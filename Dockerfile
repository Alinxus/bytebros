# Multi-stage Dockerfile for Cavista

# Stage 1: Install dependencies
FROM python:3.11-slim AS deps
WORKDIR /app
COPY ml-model/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Build Node.js
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
# Explicitly ensure ml-model is copied
RUN ls -la ml-model/

# Stage 3: Runner
FROM python:3.11-slim
WORKDIR /app

# Install Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy Python deps
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy Node.js
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/ml-model ./ml-model

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV PYTHONUNBUFFERED=1

EXPOSE 3000 5000 5001 5002

# Start all services
CMD sh -c "cd /app/ml-model && python app.py & cd /app/ml-model && python breast-cancer-service.py & cd /app && npm run dev"
