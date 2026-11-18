# Image officielle Node.js 24
FROM node:24-bookworm-slim

# Dossier de travail
WORKDIR /app

# Mettre à jour npm pour corriger les vulnérabilités de ses dépendances internes
RUN npm install -g npm@12.2.2

# Copier les fichiers de dépendances backend
COPY backend/package*.json ./

# Installer les dépendances de production
RUN npm ci --omit=dev

# Copier le code backend
COPY backend/ ./

# Copier le catalogue initial hors du volume SQLite
COPY backend/data/products.seed.json /app/seed/products.seed.json

# Préparer les dossiers persistants et attribuer leurs droits à node
RUN mkdir -p /app/data /app/uploads/products \
    && chown -R node:node /app/data /app/uploads

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=4000
ENV SQLITE_DB_PATH=/app/data/luxe.db
ENV UPLOAD_DIR=/app/uploads/products
ENV SEED_FILE=/app/seed/products.seed.json

# Port API
EXPOSE 4000

# Exécuter l'application sans privilèges root
USER node

# Démarrer le backend
CMD ["node", "--experimental-sqlite", "server.js"]
