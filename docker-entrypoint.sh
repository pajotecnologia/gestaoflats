#!/bin/sh
set -e

echo "=== DNYL Gestão de Flats — Docker Entrypoint ==="

# Sincroniza schema do Prisma com SQLite (preserva dados e cria tabelas se não existirem)
if [ -f "prisma/schema.prisma" ]; then
  echo "Sincronizando banco de dados com Prisma..."
  npx prisma db push --skip-generate || echo "Aviso: prisma db push não executado (verifique DATABASE_URL ou permissões de escrita)"
fi

echo "Iniciando aplicação na porta ${PORT:-3010}..."
exec "$@"
