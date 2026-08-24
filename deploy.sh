#!/bin/bash

# ==============================================================================
# Script de Atualização e Deploy Automático (Modo Node.js / PM2 / aaPanel)
# Uso na VPS: bash deploy.sh
# ==============================================================================

set -e

echo "🚀 [1/5] Puxando últimas atualizações do GitHub..."
git pull origin master

echo "📦 [2/5] Instalando dependências..."
npm install

echo "🗄️ [3/5] Sincronizando banco de dados SQLite..."
npx prisma db push
npx prisma generate

echo "📁 [4/5] Configurando permissões de uploads e links..."
# Remove trava do aaPanel caso exista
chattr -i .user.ini 2>/dev/null || true

# Cria estruturas de pastas de upload
mkdir -p public/uploads/flats public/uploads/vistorias public/uploads/empresa

# Cria o link simbólico /uploads -> /public/uploads
ln -sf $(pwd)/public/uploads $(pwd)/uploads

# Permissão de escrita para imagens e laudos
chmod -R 777 public/uploads 2>/dev/null || true

echo "🏗️ [5/5] Compilando e reiniciando a aplicação (npm run build)..."
npm run build

if command -v pm2 &> /dev/null; then
    pm2 restart all 2>/dev/null || pm2 start npm --name "locacoes" -- run start || true
fi

echo "=============================================================================="
echo "✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!"
echo "=============================================================================="
