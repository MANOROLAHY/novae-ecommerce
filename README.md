# Maison Vaer — Plateforme e-commerce

Application e-commerce complète (frontend + backend) pour une maison de luxe
vendant mode et électronique haut de gamme.

## Structure du projet

```
luxe/
├── backend/          API REST (Node.js + Express)
│   ├── db/             Connexion SQLite, schéma, seed, mappers
│   ├── data/            Données d'amorçage (products.seed.json)
│   ├── routes/          Routes: products, cart, orders
│   └── server.js
└── frontend/         Application React (Vite + Tailwind CSS)
    └── src/
        ├── components/  Header, Footer, ProductCard, ProductVisual, AtelierTag
        ├── context/      CartContext + client API
        └── pages/        Home, Shop, ProductDetail, Cart, Checkout, Confirmation
```

## Fonctionnalités

- Catalogue produits avec filtres par catégorie / sous-catégorie, recherche, tri par prix
- Fiches produit détaillées (coloris, tailles, stock, composition, avis)
- Panier persistant (identifiant de panier stocké côté navigateur)
- Tunnel de commande complet (coordonnées, livraison, confirmation)
- **Panneau d'administration** protégé par mot de passe (`/admin`) : ajouter,
  modifier et supprimer des produits du catalogue
- Design "commercial moderne" (badges promo, avis clients, urgence de stock)
- Entièrement responsive, focus clavier visible, animations réduites respectées

## Panneau d'administration

Accessible à l'adresse **`/admin`** (ou via le lien discret "Administration"
en bas de page). Protégé par un mot de passe simple.

- **Mot de passe par défaut : Le mot de passe administrateur est défini par la variable d'environnement
ADMIN_PASSWORD. Consultez le fichier .env.example pour connaître la
configuration nécessaire.
- Permet d'ajouter, modifier et supprimer des produits (nom, prix, stock,
  coloris, tailles, visuel, mise en avant…).
- **Comment ça marche techniquement** : à la connexion, le serveur génère un
  jeton de session et l'enregistre dans la base de données (table
  `admin_sessions`), pas seulement en mémoire. Ce jeton est ensuite envoyé
  dans l'en-tête `x-admin-token` à chaque requête d'écriture
  (créer/modifier/supprimer un produit) ; le serveur vérifie ce jeton avant
  d'autoriser l'action. **La session est permanente** : elle survit aux
  redémarrages du serveur et n'expire jamais tant que vous ne cliquez pas
  sur "Déconnexion" (qui supprime le jeton de la base).
- **Limites à connaître** (acceptables pour apprendre/prototyper, à corriger
  avant une vraie mise en production) :
  - Un seul mot de passe partagé, pas de comptes utilisateurs individuels
  - Une session qui n'expire jamais est un risque si le jeton fuite (vol
    d'ordinateur, navigateur partagé…) — une vraie mise en production
    ajouterait une expiration longue avec renouvellement automatique
  - Le mot de passe n'est pas haché (à ne jamais faire en production)
  - Pas de limite de tentatives de connexion (protection anti bruteforce à ajouter)

## Installation et lancement en local

Deux serveurs à lancer (deux terminaux séparés).

### 1. Backend (API)

```bash
cd backend
npm install
npm run dev
```

L'API démarre sur **http://localhost:4000**.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application démarre sur **http://localhost:5173** et communique avec l'API
via un proxy Vite déjà configuré (`vite.config.js`).

Ouvrez ensuite **http://localhost:5173** dans votre navigateur.

## Base de données

Le backend utilise **SQLite** via `node:sqlite` — le module SQLite **intégré
directement à Node.js** depuis la version 22.5 (encore marqué
« expérimental », mais parfaitement adapté à cet usage). Toutes les données
(produits, paniers, commandes) vivent dans un vrai fichier de base
relationnelle, `backend/db/luxe.db`, généré automatiquement au premier
démarrage.

**Important : cela nécessite Node.js 22.5 ou plus récent** (vérifiez avec
`node -v`). Aucune installation ni compilation native n'est requise — c'est
le principal avantage de `node:sqlite` par rapport à des paquets comme
`better-sqlite3`, qui peuvent échouer à l'installation selon les machines
(compilation de code natif, accès réseau à des serveurs de build).

- Le schéma (tables, clés étrangères, index) est défini dans
  `backend/db/database.js`.
- Au premier lancement, `backend/db/seed.js` importe les 12 produits de
  démonstration depuis `backend/data/products.seed.json` dans la table
  `products`. Ce seed ne s'exécute qu'une seule fois (si la table est déjà
  peuplée, il ne fait rien).
- Les commandes sont créées via une **transaction SQL**
  (`runInTransaction(...)` dans `db/database.js`, basé sur BEGIN/COMMIT/
  ROLLBACK) : soit toutes les lignes (commande + articles + vidage du
  panier) sont écrites ensemble, soit aucune ne l'est en cas d'erreur — une
  garantie qu'un simple fichier JSON ne peut pas offrir.
- Pour repartir d'une base vierge, supprimez simplement les fichiers
  `backend/db/luxe.db`, `luxe.db-shm` et `luxe.db-wal`, puis relancez le
  serveur : le seed les recréera automatiquement.
- Pour explorer la base à la main, vous pouvez installer l'outil en ligne de
  commande `sqlite3` (`sudo apt install sqlite3` sous Linux) puis lancer
  `sqlite3 backend/db/luxe.db`.

### Passer à PostgreSQL plus tard

SQLite est idéal en développement et pour de petits volumes, mais une vraie
mise en production bénéficierait de PostgreSQL (accès concurrent à grande
échelle, hébergement géré). La bonne nouvelle : le SQL utilisé ici (schéma,
requêtes) est très proche du standard, la migration consisterait
principalement à remplacer `node:sqlite` par un client `pg`, sans changer
la logique des routes.

## Prochaines étapes suggérées pour la production

- Passer de SQLite à PostgreSQL pour un usage à grande échelle
- Ajouter l'authentification client (compte, historique de commandes)
- Intégrer un vrai prestataire de paiement (Stripe, Adyen…)
- Ajouter un back-office d'administration pour gérer le catalogue
- Remplacer les visuels vectoriels par de vraies photographies produit
- Ajouter les tests automatisés et un pipeline de déploiement
