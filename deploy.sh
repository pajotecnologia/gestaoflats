#!/bin/bash

# ==============================================================================
# Script de Deploy, Automação Nginx e Atualização na VPS (Node.js / aaPanel)
# Uso na VPS: bash deploy.sh
# ==============================================================================

set -e

echo "🚀 [1/6] Configurando diretório seguro e sincronizando com GitHub master..."
git config --global --add safe.directory "*" 2>/dev/null || true
git fetch origin master
git reset --hard origin/master

echo "📦 [2/6] Instalando dependências..."
npm install

echo "🗄️ [3/6] Sincronizando estrutura do banco SQLite e gerando Prisma Client..."
npx prisma db push
npx prisma generate
chmod -R 777 prisma 2>/dev/null || true
chmod 666 prisma/dev.db 2>/dev/null || true

echo "📁 [4/6] Configurando pastas de upload e removendo atalhos inválidos..."
chattr -i .user.ini 2>/dev/null || true

# Remove links simbólicos em loop (ELOOP) que travam o Next.js
rm -f uploads 2>/dev/null || true
rm -f public/uploads/uploads 2>/dev/null || true
find public/uploads/ -type l -delete 2>/dev/null || true

# Cria estruturas limpas de pastas de upload
mkdir -p public/uploads/flats public/uploads/vistorias public/uploads/empresa public/uploads/assinaturas
chmod -R 777 public/uploads 2>/dev/null || true

echo "🌐 [5/6] Verificando e aplicando regra oficial do Nginx no aaPanel..."
NGINX_CONF="/www/server/panel/vhost/nginx/dnyl.pajotech.com.br.conf"
if [ -f "$NGINX_CONF" ]; then
    if ! grep -q "location \^\~ /uploads/" "$NGINX_CONF"; then
        echo "🔧 Inserindo regra location ^~ /uploads/ no Nginx do aaPanel..."
        sed -i '/location \/ {/i \    location ^~ /uploads/ {\n        alias /www/wwwroot/dnyl.pajotech.com.br/public/uploads/;\n        expires 30d;\n        access_log off;\n    }\n' "$NGINX_CONF"
        nginx -t 2>/dev/null && nginx -s reload 2>/dev/null || true
    fi
fi

echo "🧹 [5.5/6] Removendo compilação e caches antigos (.next)..."
rm -rf .next 2>/dev/null || true

echo "🔄 Encerrando processos antigos do Node.js..."
pkill -9 -f "node" 2>/dev/null || killall -9 node 2>/dev/null || fuser -k 3010/tcp 2>/dev/null || true

echo "🏗️ [6/6] Compilando Next.js em modo produção (npm run build)..."
npm run build

echo "⚡ Reiniciando a aplicação com PM2 na porta 3010..."
if command -v pm2 &> /dev/null; then
    pm2 delete all 2>/dev/null || true
    pm2 start npm --name "dnyl" -- start -- -p 3010
    pm2 save 2>/dev/null || true
else
    npx pm2 delete all 2>/dev/null || true
    npx pm2 start npm --name "dnyl" -- start -- -p 3010
fi

echo "=============================================================================="
echo "✅ DEPLOY E CONFIGURAÇÃO DA VPS CONCLUÍDOS COM SUCESSO!"
echo "=============================================================================="
