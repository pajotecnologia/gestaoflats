#!/bin/bash

# ==============================================================================
# Script de Deploy, Automação Nginx e Atualização na VPS (Node.js / aaPanel)
# Uso na VPS: bash deploy.sh
# ==============================================================================

set -e

echo "🚀 [1/6] Configurando diretório seguro e puxando atualizações do GitHub..."
git config --global --add safe.directory "*" 2>/dev/null || true
git pull origin master

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

echo "🧹 [5.5/6] Limpando caches estáticos do Next.js (.next)..."
rm -rf .next 2>/dev/null || true

echo "🔄 Encerrando processos antigos do Node.js na porta 3010..."
fuser -k 3010/tcp 2>/dev/null || pkill -f "next-server" 2>/dev/null || true

echo "🏗️ [6/6] Compilando Next.js (npm run build) e reiniciando a aplicação..."
npm run build

if command -v pm2 &> /dev/null; then
    pm2 restart all --force 2>/dev/null || pm2 start npm --name "dnyl" -- start -- -p 3010 || true
fi

echo "=============================================================================="
echo "✅ DEPLOY E CONFIGURAÇÃO DA VPS CONCLUÍDOS COM SUCESSO!"
echo "=============================================================================="
