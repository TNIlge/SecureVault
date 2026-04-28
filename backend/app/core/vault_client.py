import hvac
import base64
from app.config import settings

class VaultClient:
    """
    Client de haut niveau pour HashiCorp Vault.
    
    Il utilise principalement le 'Transit Secret Engine'. 
    Contrairement au stockage de secrets classique, le Transit Engine 
    chiffre/déchiffre les données à la volée sans les stocker.
    """
    def __init__(self):
        # Initialisation de la connexion avec l'adresse et le token root (défini dans .env)
        self.client = hvac.Client(
            url=settings.VAULT_ADDR, 
            token=settings.VAULT_TOKEN
        )

    def encrypt_data(self, plaintext: str, key_name: str = None) -> str:
        """
        Délègue le chiffrement d'une chaîne à Vault.
        """
        if key_name is None:
            key_name = settings.VAULT_TRANSIT_KEY
            
        # Vault exige que les données à chiffrer soient envoyées en Base64
        plaintext_b64 = base64.b64encode(plaintext.encode()).decode()
        
        # Appel API à Vault
        result = self.client.secrets.transit.encrypt_data(
            name=key_name,
            plaintext=plaintext_b64
        )
        # Retourne le ciphertext au format 'vault:v1:...'
        return result['data']['ciphertext']

    def decrypt_data(self, ciphertext: str, key_name: str = None) -> str:
        """
        Envoie un ciphertext à Vault pour récupérer le texte en clair.
        """
        return self.decrypt_bytes(ciphertext, key_name).decode()

    def decrypt_bytes(self, ciphertext: str, key_name: str = None) -> bytes:
        """
        Envoie un ciphertext à Vault pour récupérer les données brutes (bytes).
        """
        if key_name is None:
            key_name = settings.VAULT_TRANSIT_KEY
            
        # Appel API à Vault pour déchiffrer
        result = self.client.secrets.transit.decrypt_data(
            name=key_name,
            ciphertext=ciphertext
        )
        
        # Le résultat renvoyé par Vault est en Base64
        plaintext_b64 = result['data']['plaintext']
        return base64.b64decode(plaintext_b64)

    def generate_data_key(self, key_name: str = None) -> tuple[str, str]:
        """
        Génère une 'Data Encryption Key' (DEK).
        
        C'est le principe de l'Enveloppe de Chiffrement :
        1. On récupère une clé en clair pour chiffrer un gros fichier localement.
        2. On récupère la MÊME clé mais chiffrée par Vault.
        3. On stocke la clé chiffrée à côté du fichier.
        """
        if key_name is None:
            key_name = settings.VAULT_TRANSIT_KEY
            
        # Demande à Vault de générer une clé de 256 bits
        result = self.client.secrets.transit.generate_data_key(
            name=key_name,
            key_type='plaintext' # On veut la version claire ET chiffrée
        )
        
        # plaintext: à utiliser pour chiffrer maintenant
        # ciphertext: à stocker en base de données pour plus tard
        return result['data']['plaintext'], result['data']['ciphertext']
