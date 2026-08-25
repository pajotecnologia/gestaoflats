#!/bin/bash

# ==============================================================================
# Script de Deploy Isolado e Seguro do Sistema Gestão Flats (Node.js / aaPanel / PM2)
# Uso na VPS: bash deploy.sh
# ==============================================================================

set -e

echo "🚀 [1/5] Sincronizando código da aplicação com GitHub master..."
git config --global --add safe.directory "*" 2>/dev/null || true
git fetch origin master
git reset --hard origin/master

echo "📦 [2/5] Instalando dependências e gerando Prisma Client..."
npm install
npx prisma generate
chmod -R 777 prisma 2>/dev/null || true
chmod 666 prisma/dev.db 2>/dev/null || true

echo "📁 [3/5] Verificando diretórios de upload..."
mkdir -p public/uploads/flats public/uploads/vistorias public/uploads/empresa public/uploads/assinaturas
chmod -R 777 public/uploads 2>/dev/null || true

echo "🧹 [4/5] Apagando cache estático antigo (.next) e compilando produção..."
rm -rf .next 2>/dev/null || true
npm run build

echo "⚡ [5/5] Reiniciando APENAS o processo 'dnyl' no PM2 (sem afetar outros sistemas)..."
if pm2 list | grep -q "dnyl"; then
    pm2 restart dnyl --update-env
else
    pm2 start npm --name "dnyl" -- start -- -p 3010
fi
pm2 save 2>/dev/null || true

echo "=============================================================================="
echo "✅ ATUALIZAÇÃO DO SISTEMA 'DNYL' CONCLUÍDA COM SUCESSO E EM SEGURANÇA!"
echo "=============================================================================="
