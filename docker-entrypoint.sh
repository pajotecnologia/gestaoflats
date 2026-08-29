#!/bin/sh
set -e

echo "=== DNYL Gestão de Flats — Docker Entrypoint ==="

# Sincroniza schema do Prisma com PostgreSQL (cria ou atualiza tabelas preservando os dados)
if [ -f "prisma/schema.prisma" ]; then
  echo "Sincronizando banco de dados PostgreSQL com Prisma..."
  npx prisma db push --skip-generate || echo "Aviso: prisma db push não executado (verifique DATABASE_URL)"
fi

echo "Iniciando aplicação na porta ${PORT:-3010}..."
exec "$@"
