# Image officielle Node.js 24
FROM node:24-bookworm-slim

# Dossier de travail
WORKDIR /app

# Copier les fichiers de dépendances backend
COPY backend/package*.json ./

# Installer les dépendances de production
RUN npm ci --omit=dev

# Copier le code backend
COPY backend/ ./

# Préparer les dossiers persistants
RUN mkdir -p /app/data /app/uploads/products

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=4000
ENV SQLITE_DB_PATH=/app/data/luxe.db
ENV UPLOAD_DIR=/app/uploads/products

# Port API
EXPOSE 4000

# Démarrer le backend
CMD ["node", "--experimental-sqlite", "server.js"]
