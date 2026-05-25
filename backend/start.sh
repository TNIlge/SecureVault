#!/bin/bash
echo "🗄️ Application des migrations..."
alembic upgrade head
echo "🚀 Démarrage de l'API..."
uvicorn app.main:app --host 0.0.0.0 --port 8080
