#!/bin/bash

# Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
until python -c "import psycopg2; psycopg2.connect('$DATABASE_URL', sslmode='prefer')" > /dev/null 2>&1; do
  echo "En attente de connexion à $DATABASE_URL..."
  sleep 2
done

echo "🗄️ Application des migrations..."
alembic upgrade head
echo "🚀 Démarrage de l'API..."
uvicorn app.main:app --host 0.0.0.0 --port 8080
