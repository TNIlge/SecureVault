#!/bin/bash

# Script d'installation et de lancement pour SecureVault
# Ce script automatise la configuration de Vault, de la DB et le lancement des conteneurs.

echo "🚀 Démarrage de SecureVault..."

# 1. Chargement des variables d'environnement
if [ ! -f .env ]; then
    echo "⚠️ Fichier .env manquant, création à partir de .env.example..."
    cp .env.example .env
fi

# 2. Lancement des services avec Docker
echo "🐳 Lancement des conteneurs (PostgreSQL, Vault)..."
docker compose up -d

# Attendre que Vault soit prêt
echo "⏳ Attente du démarrage de Vault..."
sleep 5

# 3. Initialisation de Vault
echo "🔐 Configuration de Vault (Moteur Transit)..."
# On utilise le root token défini par défaut dans .env.example (dev-token)
export VAULT_TOKEN="root"
export VAULT_ADDR="http://localhost:8200"

# Activer le moteur de secrets Transit (nécessaire pour notre chiffrement)
docker compose exec -e VAULT_TOKEN=root vault vault secrets enable transit 2>/dev/null || echo "Info: Moteur Transit déjà activé."

# Créer la clé de chiffrement par défaut
docker compose exec -e VAULT_TOKEN=root vault vault write -f transit/keys/vault-key 2>/dev/null || echo "Info: Clé 'vault-key' déjà existante."

# 4. Initialisation de la Base de Données (Alembic)
echo "py 🗄️ Application des migrations de base de données..."
# On attend que Postgres soit prêt
sleep 3
# Exécution des migrations via le conteneur backend
docker compose exec backend alembic revision --autogenerate -m "Initial migration"
docker compose exec backend alembic upgrade head

echo "✅ Installation terminée !"
echo "🌐 Frontend : http://localhost:3000"
echo "📡 Backend API : http://localhost:8000"
echo "🔐 Vault UI : http://localhost:8200"
