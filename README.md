# 🔐 Secure Vault - Système de Stockage de Fichiers Hautement Sécurisé

Secure Vault est une application web moderne conçue pour le stockage et la gestion sécurisée de fichiers. Elle repose sur une architecture robuste utilisant le chiffrement de "enveloppe" et la gestion centralisée des secrets via **HashiCorp Vault**.

---

## 🛠 Guide d'Installation Détaillé

Ce projet est conçu pour être lancé rapidement grâce à Docker, mais voici les étapes détaillées pour garantir une installation réussie.

### 1. Prérequis Système
Avant de commencer, assurez-vous d'avoir installé :
- **Docker** (version 20.10+)
- **Docker Compose** (version 2.0+)
- **Git**

### 2. Récupération du Projet
```bash
git clone <votre-repo-url>
cd secure-vault
```

### 3. Configuration de l'Environnement
L'application utilise un fichier `.env` pour gérer ses secrets (mots de passe base de données, clés API).
- À la racine du projet, vous trouverez un fichier `.env.example`.
- Le script de lancement (étape 4) créera automatiquement un fichier `.env` à partir de celui-ci si vous ne le faites pas manuellement.
- **Note** : Pour une production réelle, vous devriez modifier la valeur de `SECRET_KEY` dans le fichier `.env` généré.

### 4. Lancement Automatique (Recommandé)
Le projet inclut un script qui automatise la configuration complexe (Docker + Vault + Base de données).

```bash
# Donner les permissions d'exécution
chmod +x scripts/setup.sh

# Lancer l'installation
./scripts/setup.sh
```

#### Ce que fait ce script :
1. **Docker Compose** : Télécharge et lance les conteneurs PostgreSQL, Vault, Backend (FastAPI) et Frontend (React).
2. **Configuration Vault** :
   - Active le moteur de secrets `transit`.
   - Génère une clé maîtresse nommée `vault-key` qui servira à chiffrer toutes les clés de vos fichiers.
3. **Base de données** : Exécute les migrations **Alembic** pour créer les tables (Utilisateurs, Fichiers, Logs) dans PostgreSQL.

### 5. Vérification du Lancement
Une fois le script terminé, vérifiez que tout est opérationnel :

| Service | URL | Vérification |
| :--- | :--- | :--- |
| **Frontend** | [http://localhost:3000](http://localhost:3000) | Vous devez voir l'interface de connexion. |
| **Backend API** | [http://localhost:8000/docs](http://localhost:8000/docs) | La documentation Swagger doit s'afficher. |
| **Vault UI** | [http://localhost:8200](http://localhost:8200) | Connectez-vous avec la méthode `Token` et le code `root`. |

---

## 🧠 Fonctionnement Global

Le projet résout le problème du stockage de données sensibles sur des serveurs tiers.

### Concept de "Envelope Encryption"
Le système n'utilise pas une seule clé pour tout. Voici le processus :
1. **Pour chaque fichier** : Une clé AES-GCM unique est générée localement par le serveur.
2. **Chiffrement du fichier** : Le fichier est verrouillé avec cette clé unique.
3. **Verrouillage de la clé** : Cette clé unique est envoyée à **HashiCorp Vault**, qui la chiffre avec sa clé maîtresse (`vault-key`).
4. **Stockage** : On stocke le fichier chiffré sur le disque et la "clé chiffrée" en base de données.
   - *Résultat* : Même si un pirate vole la base de données ET les fichiers, il ne peut rien lire sans l'accès à Vault.

---

## 🛠 Stack Technique

- **Backend** : FastAPI (Python 3.12), SQLAlchemy (ORM), Alembic (Migrations).
- **Sécurité** : HashiCorp Vault (Transit Engine), JWT pour les sessions.
- **Frontend** : React, TypeScript, Tailwind CSS, Lucide Icons.
- **Base de données** : PostgreSQL 15.
- **Conteneurisation** : Docker & Docker Compose.

---

## 🖥 Commandes de Maintenance utiles

### Voir ce qu'il se passe à l'intérieur
```bash
# Voir les logs du backend (utile pour le debug)
docker compose logs -f backend

# Accéder à la base de données
docker exec -it secure-vault-db-1 psql -U user -d securevault
```

### Réinitialisation complète
Si vous souhaitez repartir de zéro (supprimer toutes les données et fichiers) :
```bash
docker compose down -v
rm -rf postgres_data/
./scripts/setup.sh
```

---

## 🔒 Sécurité et Bonnes Pratiques
- **Secrets** : Ne jamais commiter le fichier `.env` sur GitHub (il est déjà dans le `.gitignore`).
- **Production** : En production, remplacez le token `root` de Vault par une politique d'accès restreinte.
- **Volumes** : Les données de la base de données sont persistées dans un volume Docker pour ne pas les perdre au redémarrage.
