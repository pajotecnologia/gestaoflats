#!/bin/sh

echo "=== DNYL Gestão de Flats — Docker Entrypoint ==="

# Sincroniza schema do Prisma com PostgreSQL de forma tolerante a falhas
if [ -f "prisma/schema.prisma" ]; then
  echo "Sincronizando banco de dados com Prisma..."
  npx prisma db push --accept-data-loss --skip-generate >/dev/null 2>&1 || true
fi

echo "Iniciando aplicação na porta ${PORT:-3010}..."
exec "$@"
