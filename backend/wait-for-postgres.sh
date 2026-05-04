#!/bin/sh
set -e

echo "DEBUG: DATABASE_URL=$DATABASE_URL"

# Parse DATABASE_URL: postgresql://user:password@host:port/db
# Remove the scheme (postgresql:// or postgres://)
url_without_scheme=$(echo "$DATABASE_URL" | sed 's|^postgresql://||; s|^postgres://||')
echo "DEBUG: url_without_scheme=$url_without_scheme"

# Extract user (before :)
user=$(echo "$url_without_scheme" | cut -d: -f1)

# Extract password and rest (after first :, before @)
rest=$(echo "$url_without_scheme" | cut -d@ -f2)
echo "DEBUG: rest=$rest"

# Extract host (before :)
host=$(echo "$rest" | cut -d: -f1)

# Extract port (after :, before /)
port=$(echo "$rest" | cut -d: -f2 | cut -d/ -f1)

# Default values if parsing fails
host=${host:-localhost}
port=${port:-5432}
user=${user:-postgres}

echo "DEBUG: host=$host port=$port user=$user"
echo "Waiting for postgres at $host:$port..."

until pg_isready -h "$host" -p "$port" -U "$user" 2>/dev/null; do
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is up - executing command"
exec "$@"
