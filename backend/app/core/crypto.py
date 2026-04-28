import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

class CryptoEngine:
    """
    Moteur de chiffrement de bas niveau utilisant l'algorithme AES-256-GCM.
    Ce moteur est utilisé pour chiffrer les fichiers volumineux localement
    sans surcharger HashiCorp Vault.
    """
    
    @staticmethod
    def encrypt(data: bytes, key: bytes) -> bytes:
        """
        Chiffre des données binaires avec AES-256-GCM.
        
        Args:
            data: Les données en clair (bytes)
            key: La clé de chiffrement de 32 octets (256 bits)
            
        Returns:
            Le sel (nonce) concaténé au texte chiffré.
        """
        # AES-GCM (Galois/Counter Mode) assure à la fois la confidentialité et l'intégrité
        aesgcm = AESGCM(key)
        
        # Le Nonce (IV) doit être unique pour CHAQUE opération de chiffrement avec la même clé.
        # Pour GCM, 12 octets est la taille standard recommandée.
        nonce = os.urandom(12)
        
        # On chiffre. Le troisième argument est pour les données associées (non utilisé ici).
        ciphertext = aesgcm.encrypt(nonce, data, None)
        
        # On retourne le nonce + le ciphertext car on en aura besoin pour déchiffrer.
        return nonce + ciphertext

    @staticmethod
    def decrypt(encrypted_data: bytes, key: bytes) -> bytes:
        """
        Déchiffre des données binaires.
        
        Args:
            encrypted_data: Le bloc binaire (nonce + ciphertext)
            key: La clé de déchiffrement
        """
        aesgcm = AESGCM(key)
        
        # On extrait les 12 premiers octets qui correspondent au nonce (IV)
        nonce = encrypted_data[:12]
        # Le reste est le message chiffré proprement dit
        ciphertext = encrypted_data[12:]
        
        # Déchiffrement. Si les données ont été altérées, une exception sera levée (Authenticité).
        return aesgcm.decrypt(nonce, ciphertext, None)

    @staticmethod
    def derive_key(passphrase: str, salt: bytes = None) -> tuple[bytes, bytes]:
        """
        Transforme un mot de passe en une clé robuste de 32 octets.
        Utile si on veut chiffrer à partir d'un mot de passe utilisateur.
        """
        if salt is None:
            salt = os.urandom(16)
        
        # Utilisation de PBKDF2 avec 100 000 itérations pour ralentir les attaques par force brute
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = kdf.derive(passphrase.encode())
        return key, salt
