#!/bin/bash
# Script de Deploy Seguro no Servidor VPS (Preserva Banco de Dados)

set -e

echo "🚀 Iniciando atualização segura do sistema..."
cd /www/wwwroot/dnyl.pajotech.com.br

echo "📦 Puxando últimas atualizações do código fonte..."
git fetch origin master
git reset --hard origin/master

echo "🗄️ Atualizando estrutura do banco de dados (preservando dados existentes)..."
npx prisma db push

echo "🏗️ Recompilando pacotes de produção (Next.js)..."
npx next build

echo "🔄 Reiniciando processo no PM2..."
pm2 restart dnyl

echo "✅ Atualização concluída com sucesso! Todos os dados e cadastros foram mantidos 100% intactos."
