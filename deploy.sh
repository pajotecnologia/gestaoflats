#!/bin/bash

# =========================================================
# Script de Atualização e Sincronização do Banco de Dados
# Uso na VPS: bash deploy.sh
# =========================================================

echo "🚀 [1/5] Puxando atualizações do GitHub..."
git pull origin master

echo "📦 [2/5] Instalando/atualizando dependências..."
npm install

echo "🗄️ [3/5] Criando e sincronizando estrutura do banco de dados (SQLite)..."
npx prisma db push

echo "⚙️ [4/5] Gerando Prisma Client..."
npx prisma generate

echo "🏗️ [5/5] Reconstruindo a aplicação..."
if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
    echo "🐳 Reiniciando via Docker Compose..."
    docker compose up -d --build
else
    echo "⚡ Compilando Next.js (PM2 / Node)..."
    npm run build
fi

echo "✅ Atualização concluída com sucesso no diretório!"
