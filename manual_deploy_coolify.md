# Manual de Deploy — Next.js + Coolify (VPS)

> Guia passo a passo para instalar projetos Next.js em produção usando Coolify na VPS `169.58.246.70`.  
> Abrange as especificidades dos projetos da Pajo Tecnologia (**SGH**, **DNYL / Gestão de Flats**, etc.).

---

## Índice

1. [Mapeamento Oficial de Portas & Bancos](#1-mapeamento-oficial-de-portas--bancos)
2. [Pré-requisitos](#2-pré-requisitos)
3. [Arquivos Essenciais do Projeto](#3-arquivos-essenciais-do-projeto)
4. [Configuração Específica: DNYL (Gestão de Flats - SQLite)](#4-configuração-específica-dnyl-gestão-de-flats---sqlite)
5. [Configuração Específica: SGH / Contratos (PostgreSQL)](#5-configuração-específica-sgh--contratos-postgresql)
6. [Criar a Aplicação no Coolify](#6-criar-a-aplicação-no-coolify)
7. [Configurar Variáveis de Ambiente](#7-configurar-variáveis-de-ambiente)
8. [Configurar SSL/HTTPS (Traefik)](#8-configurar-sslhttps-traefik)
9. [Checklist de Verificação](#9-checklist-de-verificação)
10. [Troubleshooting — Erros Comuns](#10-troubleshooting--erros-comuns)

---

## 1. Mapeamento Oficial de Portas & Bancos

| Projeto | Porta | Banco de Dados | Domínio | Autenticação |
|---------|-------|----------------|---------|--------------|
| **SGH** | `3002` | PostgreSQL (`5432` / db: `postgres` ou `sgh`) | `sgh.pajotech.com.br` | NextAuth |
| **Contratos** | `3005` | PostgreSQL (`5432` / db: `contratos`) | `contratos.pajotech.com.br` | NextAuth |
| **DNYL (Flats)** | `3005` | PostgreSQL (`5432` / db: `dnyl`) | `dnyl.pajotech.com.br` | JWT Customizado |

---

## 2. Pré-requisitos

- [x] VPS com Coolify instalado (IP: `169.58.246.70`)
- [x] Código do projeto em repositório Git (GitHub/GitLab)
- [x] Domínio apontando para o IP da VPS (registro DNS tipo A)
- [x] Volume de armazenamento configurado para projetos com SQLite ou uploads

---

## 3. Arquivos Essenciais do Projeto

Todo projeto Next.js precisa de **5 arquivos essenciais** na raiz:

### 3.1. `Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Ignora ARGs que o Coolify injeta automaticamente
ARG NEXTAUTH_SECRET
ARG ENCRYPTION_KEY
ARG JWT_SECRET
ARG NEXT_PUBLIC_APP_URL
ARG NODE_ENV

# 1. Copia pacotes e instala dependências completas
COPY package*.json .npmrc* ./
ENV NODE_ENV=development
RUN npm install --legacy-peer-deps

# 2. Prisma
COPY prisma ./prisma
RUN npx prisma generate

# 3. Copia o código
COPY . .

# 4. Entrypoint
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# 5. Build Next.js
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Fallbacks para variáveis exigidas em tempo de build
ENV NEXTAUTH_SECRET="build-fallback-secret-min-32-chars-placeholder!!"
ENV ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
ENV JWT_SECRET="build-fallback-jwt-secret-gestao-flats-saas-2026-placeholder"
RUN npm run build

# 6. Configurações de produção (definir a porta do projeto)
ENV PORT=3010
ENV HOSTNAME="0.0.0.0"

EXPOSE 3010

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
```

> [!IMPORTANT]
> - Ajuste `ENV PORT=3010` e `EXPOSE 3010` para a porta do seu projeto (ex: 3002, 3005, 3010).
> - O `NODE_ENV=development` durante `npm install` garante que **devDependencies** (webpack, typescript, tailwindcss) sejam instaladas.
> - O `NODE_ENV=production` é definido **antes** do `npm run build`.

---

### 3.2. `docker-entrypoint.sh`

**Para SQLite (DNYL):**
```bash
#!/bin/sh
set -e

echo "=== Docker Entrypoint ==="

if [ -f "prisma/schema.prisma" ]; then
  echo "Sincronizando banco de dados com Prisma..."
  npx prisma db push --skip-generate || echo "Aviso: prisma db push não executado"
fi

echo "Iniciando aplicação..."
exec "$@"
```

**Para PostgreSQL (SGH / Contratos):**
```bash
#!/bin/sh
set -e

echo "=== Docker Entrypoint ==="

if [ -f "node_modules/.prisma/client/index.js" ]; then
  echo "Aplicando migrações do banco..."
  npx prisma migrate deploy || echo "Aviso: migrações não aplicadas"
fi

echo "Iniciando aplicação..."
exec "$@"
```

---

### 3.3. `.dockerignore`

```
node_modules
.next
.git
.env
.env*.local
*.log
npm-debug.log*
release
dnyl-deploy.zip
```

---

### 3.4. `src/app/global-error.tsx` (OBRIGATÓRIO para Next.js 14+/React 19)

```tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0f172a', color: '#e2e8f0' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>Erro inesperado</h1>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              Ocorreu um problema no sistema. Tente novamente.
            </p>
            <button onClick={() => reset()} style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

---

### 3.5. Diretiva `dynamic = 'force-dynamic'`

Em `src/app/layout.tsx` e em páginas com autenticação ou banco:
```tsx
export const dynamic = 'force-dynamic';
```

---

## 4. Configuração Específica: DNYL (Gestão de Flats - PostgreSQL)

### 4.1. Criar o Banco `dnyl` no pgAdmin:
1. Conecte ao PostgreSQL via pgAdmin (`169.58.246.70:5432`, usuário `postgres`).
2. Clique com botão direito em **Databases** → **Create** → **Database...**
3. Nome do banco: **`dnyl`**
4. Clique em **Save**.
*(O Prisma executará o `prisma db push` e criará todas as tabelas automaticamente na inicialização do container).*

### 4.2. Volumes Persistentes (Storages no Coolify):
No Coolify: **Aplicação DNYL** → Aba **Storages** (ou **Persistent Storage**):
- **Uploads (Fotos/Laudos/PDFs)**:
  - **Name:** `dnyl_uploads`
  - **Destination path (container):** `/app/public/uploads`

### 4.3. Variáveis de Ambiente DNYL no Coolify:

| Variável | Valor | Build? | Runtime? |
|----------|-------|--------|----------|
| `DATABASE_URL` | `postgresql://postgres:SENHA_POSTGRES@169.58.246.70:5432/dnyl` | ❌ | ✅ |
| `JWT_SECRET` | `super-secret-jwt-key-gestao-flats-saas-2026-production-ready` | ❌ | ✅ |
| `NEXT_PUBLIC_APP_URL` | `https://dnyl.pajotech.com.br` | ❌ | ✅ |
| `NODE_ENV` | `production` | ❌ | ✅ |
| `PORT` | `3005` | ❌ | ✅ |

---

## 5. Configuração Específica: SGH / Contratos (PostgreSQL)

1. No Coolify: **Projects** → **+ New Resource** → **PostgreSQL**
2. Em **Public access**: selecione `Public through TCP proxy`, porta `5432`
3. Execute o script SQL via pgAdmin (`169.58.246.70:5432`)

### Variáveis de Ambiente SGH / Contratos:

| Variável | Valor | Build? | Runtime? |
|----------|-------|--------|----------|
| `DATABASE_URL` | `postgresql://postgres:SENHA@169.58.246.70:5432/postgres` | ❌ | ✅ |
| `NEXTAUTH_URL` | `https://sgh.pajotech.com.br` | ❌ | ✅ |
| `NEXTAUTH_SECRET` | *(chave 32+ caracteres)* | ❌ | ✅ |
| `ENCRYPTION_KEY` | *(chave 64 hex caracteres)* | ❌ | ✅ |
| `NODE_ENV` | `production` | ❌ | ✅ |
| `PORT` | `3002` (SGH) ou `3005` (Contratos) | ❌ | ✅ |

---

## 6. Criar a Aplicação no Coolify

1. **Projects** → Selecione o projeto → **+ New Resource** → **Application**
2. Selecione **GitHub** como fonte
3. Escolha o repositório e a branch `master` (ou `main`)
4. Em **Build Pack**: selecione **Dockerfile**
5. Em **General**:
   - **FQDN/Domains**: `https://dnyl.pajotech.com.br` (ou o domínio do sistema)
   - **Port Exposes**: `3005` (para DNYL e Contratos) ou `3002` (SGH)

---

## 7. Configurar Variáveis de Ambiente

No Coolify, aba **Environment Variables** da aplicação:
- Adicione as variáveis da tabela correspondente ao projeto.
- **NÃO marque** `Available at Buildtime` para `NODE_ENV`, permitindo que o Dockerfile instale devDependencies corretamente.

---

## 8. Configurar SSL/HTTPS (Traefik)

Na aba **General** da aplicação, na seção **Labels**, adicione:

```
traefik.http.routers.https-0-CONTAINER_ID.entryPoints=https
traefik.http.routers.https-0-CONTAINER_ID.rule=Host(`dnyl.pajotech.com.br`) && PathPrefix(`/`)
traefik.http.routers.https-0-CONTAINER_ID.service=http-0-CONTAINER_ID
traefik.http.routers.https-0-CONTAINER_ID.tls=true
traefik.http.routers.https-0-CONTAINER_ID.tls.certresolver=letsencrypt
traefik.http.routers.https-0-CONTAINER_ID.middlewares=gzip
traefik.http.routers.http-0-CONTAINER_ID.middlewares=redirect-to-https
```

> Substitua `CONTAINER_ID` pelo ID exibido nas labels existentes e ajuste o domínio.

Clique em **Save** e **Deploy**.

---

## 9. Checklist de Verificação

- [ ] `src/app/global-error.tsx` presente com estilos inline
- [ ] `Dockerfile` com porta correta (3010 para DNYL, 3002 para SGH, 3005 para Contratos)
- [ ] `docker-entrypoint.sh` configurado com permissão de execução
- [ ] `src/app/layout.tsx` e páginas com `export const dynamic = 'force-dynamic'`
- [ ] `package.json` com `tailwindcss`, `postcss`, `autoprefixer` em `dependencies`
- [ ] Volumes persistentes configurados para SQLite (`/app/prisma`) e Uploads (`/app/public/uploads`)
- [ ] Domínio DNS apontando para o IP da VPS `169.58.246.70`
- [ ] Variáveis de ambiente configuradas no Coolify

---

## 10. Troubleshooting — Erros Comuns

### Erro: `TypeError: Cannot read properties of null (reading 'useState')`
**Causa**: Next.js tentou pré-renderizar uma página estaticamente durante o build.  
**Solução**: Adicionar `export const dynamic = 'force-dynamic'` no layout raiz ou na página.

### Erro: `Export encountered an error on /_global-error`
**Causa**: Falta do arquivo `global-error.tsx`.  
**Solução**: Criar `src/app/global-error.tsx` com `'use client'` e `<html>`/`<body>` próprios.

### Erro: `Cannot find module 'tailwindcss'`
**Causa**: `tailwindcss` em devDependencies com `NODE_ENV=production` no install.  
**Solução**: Manter `NODE_ENV=development` no primeiro bloco do Dockerfile e mover para `dependencies` no `package.json`.

### Erro: Perda de dados ou flats cadastrados após redeploy
**Causa**: Container recriado sem volume persistente para o SQLite.  
**Solução**: Adicionar volume em **Storages** no Coolify mapeando `/app/prisma`.

---

> **Última atualização**: 27/08/2026  
> **Sistemas**: SGH (3002), Contratos (3005), DNYL (Gestão de Flats - 3010) — Pajo Tecnologia
