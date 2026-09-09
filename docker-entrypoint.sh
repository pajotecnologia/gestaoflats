#!/bin/sh

echo "=== DNYL Gestão de Flats — Docker Entrypoint ==="

# Garante que DATABASE_URL use o prefixo file: para SQLite
if [ -z "$DATABASE_URL" ] || echo "$DATABASE_URL" | grep -qE '^(postgres|postgresql|mysql)://'; then
  export DATABASE_URL="file:./dev.db"
elif ! echo "$DATABASE_URL" | grep -q '^file:'; then
  export DATABASE_URL="file:$DATABASE_URL"
fi

# Sincroniza schema do Prisma de forma tolerante a falhas
if [ -f "prisma/schema.prisma" ]; then
  echo "Sincronizando banco de dados com Prisma ($DATABASE_URL)..."
  npx prisma db push --accept-data-loss --skip-generate >/dev/null 2>&1 || true
fi

echo "Iniciando aplicação na porta ${PORT:-3010}..."
exec "$@"
