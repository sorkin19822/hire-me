FROM node:22-alpine AS base
WORKDIR /app

# Install build deps for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

# Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --ignore-scripts && npm rebuild better-sqlite3

# Build
FROM deps AS builder
COPY . .
RUN npm run build

# Production
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

ENV NODE_ENV=production
ENV PORT=3000

# Create data directory for SQLite
RUN mkdir -p /app/data

COPY --from=builder /app/.output /app/.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
