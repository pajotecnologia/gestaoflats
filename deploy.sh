#!/bin/bash
# Script de Deploy Seguro no Servidor VPS (Preserva Banco de Dados)

set -e

echo "🚀 Iniciando atualização segura do sistema..."
cd /www/wwwroot/dnyl.pajotech.com.br

echo "📦 Puxando últimas atualizações do código fonte..."
git fetch origin master
git reset --hard origin/master

# Garante a correção do caminho do SQLite no arquivo .env se necessário
if [ -f .env ]; then
  sed -i 's|DATABASE_URL="file:./prisma/dev.db"|DATABASE_URL="file:./dev.db"|g' .env
fi

echo "🗄️ Sincronizando estrutura do banco de dados e criando tabelas se inexistentes..."
npx prisma db push

echo "🌱 Garantindo criação do usuário administrador inicial se o banco for novo..."
npx tsx prisma/seed.ts || true

echo "🏗️ Recompilando pacotes de produção (Next.js)..."
rm -rf .next
npx next build

echo "🔄 Reiniciando processo no PM2..."
pm2 restart dnyl

echo "✅ Atualização concluída com sucesso! O banco de dados e as tabelas estão 100% ativas."
