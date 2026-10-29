# Estágio 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar manifestos de dependência
COPY package*.json ./
RUN npm ci --include=dev

COPY . .

# Compilar frontend React e backend TypeScript Hono
RUN npm run build:client && npm run build:server

# Estágio 2: Runner de Produção
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3333

# Instalar dependências estritas de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar os artefatos gerados no build
COPY --from=builder /app/dist ./dist

# Diretório para o SQLite WAL persistente
RUN mkdir -p /app/data

VOLUME ["/app/data"]

EXPOSE 3333

CMD ["node", "dist/server/index.js"]
