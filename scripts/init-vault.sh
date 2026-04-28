#!/bin/bash

# Attendre que Vault soit prêt
until vault status > /dev/null 2>&1; do
  echo "Waiting for Vault..."
  sleep 1
done

# Activer le Transit Secret Engine
vault secrets enable transit

# Créer une clé par défaut
vault write -f transit/keys/default-key

echo "Vault initialized with Transit engine and default-key."
