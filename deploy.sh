#!/bin/bash

# ==============================================================================
# Script de Atualização, Permissões de Upload e Deploy Automático na VPS
# Uso na VPS: bash deploy.sh
# ==============================================================================

set -e

echo "🚀 [1/6] Puxando últimas atualizações do GitHub..."
git pull origin master

echo "📦 [2/6] Instalando / atualizando dependências..."
npm install

echo "🗄️ [3/6] Sincronizando banco de dados SQLite e Prisma Client..."
npx prisma db push
npx prisma generate

echo "📁 [4/6] Configurando pastas de uploads, links simbólicos e permissões..."
# Remove trava do aaPanel caso exista no .user.ini
chattr -i .user.ini 2>/dev/null || true

# Cria estruturas de pastas de upload
mkdir -p public/uploads/flats public/uploads/vistorias public/uploads/empresa

# Cria o link simbólico /uploads -> /public/uploads para o Nginx/aaPanel servir sem erro 404
ln -sf $(pwd)/public/uploads $(pwd)/uploads

# Aplica permissões totais de escrita para uploads de imagens e PDFs
chmod -R 777 public/uploads 2>/dev/null || true

echo "🏗️ [5/6] Gerando compilação de produção (npm run build)..."
if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
    echo "🐳 Reconstruindo via Docker Compose..."
    docker compose up -d --build
else
    echo "⚡ Compilando Next.js para produção..."
    npm run build
fi

echo "🔄 [6/6] Reiniciando processo no servidor (PM2 / Node)..."
if command -v pm2 &> /dev/null; then
    pm2 restart all 2>/dev/null || pm2 start npm --name "locacoes" -- run start || true
fi

echo "=============================================================================="
echo "✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!"
echo "   - Código atualizado do GitHub"
echo "   - Banco SQLite sincronizado"
echo "   - Pastas de upload e permissões 777 corrigidas (Link simbólico ativo)"
echo "   - Aplicação compilada e reiniciada"
echo "=============================================================================="
