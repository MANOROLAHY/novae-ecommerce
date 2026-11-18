# Sécurité Docker — Projet NOVAÉ

## 1. Objectif

Ce document présente les mesures de sécurité étudiées et vérifiées dans le laboratoire Docker du projet NOVAÉ.

L'objectif est de renforcer la sécurité des conteneurs backend et frontend en appliquant plusieurs principes :

- Exécuter les applications avec des utilisateurs non privilégiés.
- Limiter les capacités Linux des conteneurs.
- Rendre le système de fichiers racine non modifiable.
- Limiter les accès réseau.
- Séparer les données persistantes du système de fichiers des conteneurs.
- Renforcer la validation des fichiers téléversés.
- Vérifier que les expérimentations ne modifient pas l'environnement de production.

Les expérimentations ont été réalisées dans un environnement Docker Compose isolé.

**Important :** les vérifications décrites dans ce document concernent le laboratoire de sécurité. Elles ne constituent pas une certification de sécurité et ne signifient pas que toutes les protections ont déjà été déployées en production.

## 2. Architecture du laboratoire

Le laboratoire utilise un projet Docker Compose indépendant :

```bash
docker compose -p novae-security -f compose.security.yaml
```

Le nom du projet Compose `novae-security` permet de distinguer les conteneurs de laboratoire de ceux de production.

### 2.1. Conteneurs utilisés

| Conteneur | Fonction | Image |
|---|---|---|
| novae-security-backend | API Express et accès SQLite | novae-backend:security-update |
| novae-security-frontend | Interface React servie par Nginx | Image frontend du laboratoire |

### 2.2. Réseau et ports

Le backend écoute sur le port interne `4000`.

Il n'est pas directement publié sur les ports de la machine hôte.

Le frontend est accessible localement sur :

```text
http://127.0.0.1:8081
```

Le port du frontend est limité à l'interface locale `127.0.0.1`.

Nginx transmet les requêtes API au backend à travers le réseau interne Docker.

### 2.3. Stockage persistant

Les données du laboratoire sont séparées des conteneurs :

| Répertoire hôte du laboratoire | Répertoire dans le conteneur |
|---|---|
| /tmp/novae-compose-security/data | /app/data |
| /tmp/novae-compose-security/uploads | /app/uploads |

Cette séparation permet de conserver les données et les images téléversées indépendamment du cycle de vie des conteneurs.

Le laboratoire utilise une copie de la base SQLite afin de ne pas manipuler directement les données de production.

### 2.4. Séparation du catalogue initial et du volume SQLite

Le backend utilise un catalogue initial situé dans le fichier `products.seed.json`.

Un problème peut survenir lorsque le répertoire `/app/data` est monté comme volume Docker : le volume masque le contenu initial de ce répertoire présent dans l'image.

Pour éviter ce problème, le catalogue initial est copié dans un emplacement indépendant du volume SQLite :

```text
/app/seed/products.seed.json
```

Le chemin du catalogue est défini par la variable d'environnement :

```text
SEED_FILE=/app/seed/products.seed.json
```

Dans `backend/db/seed.js`, l'application utilise cette variable lorsqu'elle est définie et conserve le chemin historique comme valeur par défaut pour les environnements locaux.

Cette séparation permet au backend d'initialiser une nouvelle base SQLite même lorsque `/app/data` est monté sur un volume Docker vide.

**Validation réalisée :**

Un conteneur temporaire a été démarré avec un répertoire hôte vierge monté sur `/app/data`.

Résultat observé :

```text
12 produits importés dans la base SQLite.
Produits importés : 12
```

Le test confirme que le catalogue reste accessible indépendamment du volume de données.

## 3. Durcissement du backend

Plusieurs protections ont été vérifiées sur le conteneur backend.

### 3.1. Utilisateur non privilégié

Le backend fonctionne avec l'utilisateur Linux `node`.

Vérification :

```bash
docker exec novae-security-backend id
```

Résultat observé :

```text
uid=1000(node) gid=1000(node) groups=1000(node)
```

L'application ne fonctionne donc pas avec l'utilisateur `root` dans le conteneur.

### 3.2. Système de fichiers racine en lecture seule

Le système de fichiers racine du conteneur backend est configuré en lecture seule.

Vérification :

```bash
docker inspect novae-security-backend --format '{{.HostConfig.ReadonlyRootfs}}'
```

Résultat attendu :

```text
true
```

Les répertoires qui doivent recevoir des écritures, notamment les données SQLite et les fichiers téléversés, sont montés séparément.

### 3.3. Suppression des capacités Linux

Le conteneur utilise :

```yaml
cap_drop:
  - ALL
```

Cette configuration supprime toutes les capacités Linux accordées au conteneur.

Vérification :

```bash
docker inspect novae-security-backend --format '{{json .HostConfig.CapDrop}}'
```

Résultat observé :

```text
["ALL"]
```

### 3.4. Protection contre l'acquisition de privilèges supplémentaires

Le conteneur utilise l'option :

```yaml
security_opt:
  - no-new-privileges:true
```

Cette protection empêche les processus du conteneur d'acquérir de nouveaux privilèges au moyen de mécanismes tels que les exécutables setuid.

Vérification :

```bash
docker inspect novae-security-backend --format '{{json .HostConfig.SecurityOpt}}'
```

Résultat observé :

```text
["no-new-privileges:true"]
```

### 3.5. Répertoire temporaire

Le backend utilise un répertoire temporaire `/tmp` monté en mémoire avec des options restrictives.

La configuration applique notamment :

- `noexec` : empêche l'exécution directe de fichiers depuis ce montage.
- `nosuid` : neutralise l'effet des bits setuid et setgid sur ce montage.
- Une limite de taille.
- Un propriétaire adapté à l'utilisateur du backend.

### 3.6. Permissions des fichiers

La configuration utilise un `umask` de `0077`.

Vérification :

```bash
docker exec novae-security-backend sh -c 'umask'
```

Résultat observé :

```text
0077
```

Les fichiers créés par le processus sont ainsi protégés contre les accès des autres utilisateurs, sous réserve des permissions définies explicitement par l'application.

## 4. Durcissement du frontend

Le frontend est servi par Nginx dans un conteneur indépendant.

Les protections vérifiées sont les suivantes :

| Protection | Configuration vérifiée |
|---|---|
| Utilisateur non privilégié | 101:101 |
| Système de fichiers racine | Lecture seule |
| Capacités Linux | Toutes supprimées |
| Nouveaux privilèges | Interdits |
| Configuration Nginx | Montage en lecture seule |
| Répertoire temporaire | Montage tmpfs |

### 4.1. Vérification de l'utilisateur

```bash
docker exec novae-security-frontend id
```

Le processus Nginx fonctionne avec un utilisateur non privilégié.

### 4.2. Vérification du système de fichiers

```bash
docker inspect novae-security-frontend --format '{{.HostConfig.ReadonlyRootfs}}'
```

Résultat attendu :

```text
true
```

### 4.3. Vérification de la configuration Nginx

```bash
docker exec novae-security-frontend nginx -t
```

Résultat observé : la syntaxe de la configuration Nginx est valide.

### 4.4. Répertoire temporaire

Le frontend utilise un montage temporaire `/tmp` avec les options :

- `noexec`
- `nosuid`
- Une limite de taille de 64 Mo.
- Un propriétaire correspondant à l'utilisateur Nginx.

## 5. Sécurité des téléversements d'images

La route de téléversement des images produits du backend a été renforcée.

### 5.1. Formats autorisés

Les formats autorisés sont :

- JPEG
- PNG
- WEBP

La validation ne repose pas uniquement sur le nom du fichier ou son extension.

### 5.2. Vérification du contenu réel

La bibliothèque `file-type` est utilisée pour identifier le type réel du fichier à partir de sa signature binaire.

Le type détecté doit correspondre au type MIME déclaré par le client.

Un fichier texte renommé en `.png` ne doit donc pas être accepté comme une véritable image PNG.

### 5.3. Limitation de la taille

La taille maximale autorisée pour une image est de 5 Mo.

Les fichiers dépassant cette limite sont rejetés.

### 5.4. Noms de fichiers générés

Les noms de fichiers enregistrés sont générés avec UUID.

L'extension est déterminée à partir du type de fichier détecté.

Cette méthode évite de faire confiance au nom fourni par le client.

### 5.5. Nettoyage des fichiers

La route prévoit le nettoyage des fichiers temporaires en cas d'échec.

Lors du remplacement d'une image, l'ancienne image est supprimée après la mise à jour réussie de la référence en base de données.

### 5.6. Tests réalisés

Deux scénarios principaux ont été vérifiés dans le laboratoire :

| Test | Résultat |
|---|---|
| Fichier texte déguisé en image PNG | Rejet HTTP 400 |
| Véritable image PNG valide | Téléversement HTTP 200 |

Le test avec une véritable image a également permis de vérifier :

- La création du fichier dans le répertoire des uploads.
- La génération d'un nom UUID.
- Les permissions du fichier.
- La suppression de l'ancien fichier remplacé.

**Limite :** la détection de signature permet d'identifier le format du fichier, mais ne constitue pas une analyse antivirus, une validation complète du décodage de l'image ou une garantie contre tous les contenus malveillants.

## 6. Tests et validations

Plusieurs contrôles ont été exécutés sur l'environnement isolé.

### 6.1. Tests backend

La suite de tests Node.js a été exécutée.

Commande :

```bash
cd backend
npm test
```

Résultat final observé :

```text
tests 87
pass 87
fail 0
```

Les 87 tests backend ont réussi.

### 6.2. Vérification de la santé du backend

Commande :

```bash
curl -i http://127.0.0.1:8081/api/health
```

Résultat observé :

```text
HTTP 200
```

Réponse :

```json
{
  "status": "ok",
  "service": "luxe-backend"
}
```

### 6.3. Vérification des protections

Les vérifications suivantes ont été réalisées :

| Contrôle | Résultat |
|---|---|
| Backend exécuté avec l'utilisateur node | Confirmé |
| Frontend exécuté avec un utilisateur non privilégié | Confirmé |
| Root filesystem backend en lecture seule | Confirmé |
| Root filesystem frontend en lecture seule | Confirmé |
| Capacités Linux supprimées sur le backend | Confirmé |
| Capacités Linux supprimées sur le frontend | Confirmé |
| no-new-privileges sur le backend | Confirmé |
| no-new-privileges sur le frontend | Confirmé |
| Répertoires de données séparés | Confirmé |
| Configuration Nginx valide | Confirmé |
| Backend non publié directement sur l'hôte | Confirmé |
| Port frontend limité à localhost | Confirmé |
| Fichier non-image rejeté | Confirmé |
| Véritable image PNG acceptée | Confirmé |

### 6.4. Commande de vérification de l'environnement

```bash
docker compose -p novae-security -f compose.security.yaml ps
```

Cette commande permet de vérifier l'état des services du laboratoire.

## 7. Commandes de vérification de sécurité

Les commandes suivantes permettent de contrôler plusieurs paramètres Docker après le démarrage du laboratoire.

### 7.1. Vérifier les protections du backend

```bash
docker inspect novae-security-backend --format '
Utilisateur : {{.Config.User}}
Root filesystem en lecture seule : {{.HostConfig.ReadonlyRootfs}}
Capacités supprimées : {{json .HostConfig.CapDrop}}
Options de sécurité : {{json .HostConfig.SecurityOpt}}
'
```

### 7.2. Vérifier les protections du frontend

```bash
docker inspect novae-security-frontend --format '
Utilisateur : {{.Config.User}}
Root filesystem en lecture seule : {{.HostConfig.ReadonlyRootfs}}
Capacités supprimées : {{json .HostConfig.CapDrop}}
Options de sécurité : {{json .HostConfig.SecurityOpt}}
'
```

### 7.3. Vérifier les ports publiés

```bash
docker port novae-security-backend
docker port novae-security-frontend
```

Le backend ne doit pas avoir de port publié sur l'hôte.

Le frontend doit être accessible uniquement sur `127.0.0.1:8081`.

### 7.4. Vérifier Nginx

```bash
docker exec novae-security-frontend nginx -t
```

### 7.5. Vérifier l'état des conteneurs

```bash
docker compose -p novae-security -f compose.security.yaml ps
```

## 8. Isolation de la production

Toutes les expérimentations décrites dans ce document ont été réalisées dans le projet Compose `novae-security`.

Les conteneurs de production :

- `novae-backend`
- `novae-frontend`

n'ont pas été modifiés pendant ces vérifications.

Les tests ont utilisé des ressources séparées, notamment :

- Un projet Compose indépendant.
- Une copie de la base SQLite.
- Un répertoire d'uploads propre au laboratoire.
- Une configuration Nginx spécifique au laboratoire.
- Des variables d'environnement propres au laboratoire.

Aucun déploiement de ces modifications en production n'est couvert par cette validation.

Les changements de sécurité devront être évalués et testés avant toute mise en production.

## 9. Limites et améliorations futures

Les mesures vérifiées constituent une première étape de durcissement.

Plusieurs améliorations restent possibles :

- Analyse des images Docker avec un outil comme Trivy.
- Vérification régulière des vulnérabilités des dépendances.
- Analyse statique du code.
- Gestion centralisée des secrets.
- Surveillance des journaux et mise en place d'alertes.
- Tests de sécurité supplémentaires sur l'API.
- Évaluation des permissions et des sauvegardes SQLite.
- Limitation des ressources CPU, mémoire et processus des conteneurs.
- Vérification des configurations réseau et des règles de pare-feu.
- Mise en place d'une procédure de restauration des sauvegardes.
- Audit de sécurité avant toute mise en production.

Les prochaines étapes devront également vérifier les mises à jour des images de base et la provenance des images utilisées.

## 10. Conclusion

Le laboratoire Docker NOVAÉ a permis de vérifier plusieurs mesures de défense en profondeur pour le backend et le frontend.

Les protections testées réduisent les privilèges des conteneurs, limitent leur exposition réseau et renforcent la gestion des fichiers.

Les tests ont notamment confirmé le fonctionnement des conteneurs avec des utilisateurs non privilégiés, des systèmes de fichiers racine en lecture seule, la suppression des capacités Linux et la validation des images téléversées.

Cette validation concerne uniquement l'environnement de laboratoire et ne constitue pas une certification de sécurité complète.

Toute évolution devra être testée dans un environnement isolé avant d'être envisagée pour la production.
