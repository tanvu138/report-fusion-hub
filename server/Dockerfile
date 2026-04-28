# Backend production Dockerfile
# Multi-stage build: install deps + Puppeteer system libs, run with Node

# --- Stage 1: Install dependencies ---
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# --- Stage 2: Production runtime ---
FROM node:20-alpine

WORKDIR /app

# Install Chromium system dependencies for Puppeteer PDF export
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use system Chromium instead of downloading its own
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy production dependencies and generated Prisma client
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy application code
COPY . .

# Create secure uploads directory
RUN mkdir -p secure_uploads/report_images && \
    chown -R node:node /app

USER node

EXPOSE 8945

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8945/health || exit 1

CMD ["node", "server.js"]
