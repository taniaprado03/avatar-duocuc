# ══════════════════════════════════════════════════════════════
# TanIA Frontend — Multi-stage Docker Build
# Stage 1: Build React/Vite app
# Stage 2: Serve with Nginx
# ══════════════════════════════════════════════════════════════

# --- Stage 1: Build ---
FROM node:20-alpine AS build

WORKDIR /app

# Copiar solo package files primero (cache de dependencias)
COPY package.json package-lock.json* ./
RUN npm ci --silent

# Copiar código fuente
COPY . .

# Variables de entorno para el build (se pasan con --build-arg o .env)
ARG VITE_CLAUDE_API_KEY
ENV VITE_CLAUDE_API_KEY=$VITE_CLAUDE_API_KEY

# Build de producción
RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:1.27-alpine

# Copiar el build de React al directorio de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Los modelos de face-api.js ya están en /dist/models/ (se copian del public/)

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
