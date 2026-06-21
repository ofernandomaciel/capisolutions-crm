FROM node:20-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ============================================================
# Stage 1: Instalar dependências
# ============================================================
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ============================================================
# Stage 2: Build
# ============================================================
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de build (passadas via ARG)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Desabilitar telemetria
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ============================================================
# Stage 3: Runner (produção)
# ============================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Permissões corretas para .next
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
