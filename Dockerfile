# Frontend production Dockerfile
# Multi-stage build: install deps, build static assets, serve via Nginx

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_* vars are baked in at build time — pass via --build-arg or .env
ARG VITE_API_URL
ARG VITE_FRONTEND_PORT=6234
ARG VITE_DIFY_TOKEN
ARG VITE_DIFY_BASE_URL

RUN npm run build

# --- Stage 2: Serve ---
FROM nginx:alpine

# Copy built assets to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 6234

CMD ["nginx", "-g", "daemon off;"]
