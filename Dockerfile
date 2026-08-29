FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

# Ignora ARGs que o Coolify ou CI podem injetar automaticamente
ARG JWT_SECRET
ARG NEXT_PUBLIC_APP_URL
ARG NODE_ENV

# 1. Copia manifestos de pacotes e instala dependências completas
COPY package*.json .npmrc* ./
ENV NODE_ENV=development
RUN npm install --legacy-peer-deps

# 2. Prisma
COPY prisma ./prisma
RUN npx prisma generate

# 3. Copia o código-fonte da aplicação
COPY . .

# 4. Entrypoint executável
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# 5. Build Next.js
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV JWT_SECRET="build-fallback-jwt-secret-gestao-flats-saas-2026-placeholder"
RUN npm run build

# 6. Configurações de Produção
ENV PORT=3010
ENV HOSTNAME="0.0.0.0"

EXPOSE 3010

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
