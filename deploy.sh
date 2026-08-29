#!/bin/bash
# =============================================================================
# Script de Deploy - Sistema Gestão de Flats
# VPS: gestaoflats.pajotech.com.br | Porta: 3010 | Gerenciado por: aaPanel / Coolify
# =============================================================================
# COMO USAR:
#   cd /www/wwwroot/gestaoflats.pajotech.com.br (ou dnyl)
#   bash deploy.sh
# =============================================================================

set -e

APP_DIR="/www/wwwroot/dnyl.pajotech.com.br"
APP_PORT=3010

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║    🚀 DEPLOY - Gestão de Flats               ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

cd $APP_DIR

# 1. Atualizar código fonte
echo "📦 [1/6] Puxando atualizações do GitHub..."
git fetch origin master
git reset --hard origin/master
echo "✅ Código atualizado!"

# 2. Matar o processo antigo na porta 3010 ANTES do build
echo ""
echo "🔪 [2/6] Encerrando processo antigo na porta $APP_PORT..."
fuser -k -9 ${APP_PORT}/tcp 2>/dev/null && echo "✅ Processo encerrado!" || echo "⚠️  Nenhum processo ativo na porta $APP_PORT."

# 3. Apagar build antigo
echo ""
echo "🧹 [3/6] Limpando build antigo (.next)..."
rm -rf .next
echo "✅ Cache de build removido!"

# 4. Sincronizar banco de dados
echo ""
echo "🗄️  [4/6] Sincronizando banco de dados (sem perder dados)..."
npx prisma db push
echo "✅ Banco sincronizado!"

# 5. Compilar o Next.js
echo ""
echo "🏗️  [5/6] Compilando produção (Next.js)... Aguarde ~2 minutos..."
npx next build
echo "✅ Build concluído!"

# 6. Ajustar permissões para o aaPanel (usuário www)
echo ""
echo "🔐 [6/6] Ajustando permissões para o aaPanel..."
chown -R www:www $APP_DIR
echo "✅ Permissões ajustadas!"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ BUILD CONCLUÍDO COM SUCESSO!             ║"
echo "║                                              ║"
echo "║  PRÓXIMO PASSO OBRIGATÓRIO:                  ║"
echo "║  No aaPanel → Website → Node project         ║"
echo "║  Clique em ▶ RESTART no projeto 'dnyl'       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Após restart, acesse: https://dnyl.pajotech.com.br"
echo "  A versão atualizada aparecerá na tela de login."
echo ""
