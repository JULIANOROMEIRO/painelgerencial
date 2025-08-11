# Dockerfile Completo para Hostinger
# Instala tudo automaticamente a partir do código fonte

FROM node:18-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache \
    libc6-compat \
    curl \
    bash \
    git

# Definir diretório de trabalho
WORKDIR /app

# Instalar pnpm globalmente
RUN npm install -g pnpm

# ===== STAGE 1: Instalar dependências =====
FROM base AS deps

# Copiar arquivos de configuração de dependências
COPY package.json pnpm-lock.yaml* ./

# Quebrar cache usando timestamp dinâmico e instalar dependências sem frozen-lockfile
RUN export CACHE_BREAKER=$(date +%s) && pnpm install --no-frozen-lockfile
# ===== STAGE 2: Build da aplicação =====
FROM base AS builder

WORKDIR /app

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar todo o código fonte
COPY . .

# Executar validação antes do build
RUN node validate-build.js

# Desabilitar telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Executar build da aplicação
RUN pnpm build

# Limpar cache do pnpm para economizar espaço
RUN pnpm store prune

# ===== STAGE 3: Imagem de produção =====
FROM base AS runner

WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos públicos
COPY --from=builder /app/public ./public

# Copiar build output do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Definir usuário
USER nextjs

# Expor porta
EXPOSE 3000

# Variáveis de ambiente para produção
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Comando para iniciar a aplicação
CMD ["node", "server.js"]