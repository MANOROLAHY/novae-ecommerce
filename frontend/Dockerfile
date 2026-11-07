# ==========================================
# ETAPE 1 : CONSTRUCTION DU FRONTEND
# ==========================================
FROM node:24-bookworm-slim AS build

WORKDIR /app

# Copier les fichiers de dépendances
COPY frontend/package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY frontend/ ./

# Compiler React avec Vite
RUN npm run build


# ==========================================
# ETAPE 2 : SERVEUR NGINX
# ==========================================
FROM nginx:alpine

# Copier les fichiers compilés
COPY --from=build /app/dist /usr/share/nginx/html

# Configuration Nginx personnalisée
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Port HTTP
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
