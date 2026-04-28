from fastapi import APIRouter, HTTPException, Depends
from app.schemas.encryption import EncryptRequest, EncryptResponse, DecryptRequest, DecryptResponse
from app.core.vault_client import VaultClient
from app.config import settings

router = APIRouter()

def get_vault_client():
    """Dépendance FastAPI pour injecter le client Vault dans les routes."""
    return VaultClient()

@router.post("/encrypt", response_model=EncryptResponse)
async def encrypt_text(
    request: EncryptRequest, 
    vault: VaultClient = Depends(get_vault_client)
):
    """
    Endpoint pour chiffrer une chaîne de texte simple.
    La donnée est envoyée à Vault, chiffrée là-bas, et on reçoit le résultat.
    Le serveur ne voit la clé de chiffrement à aucun moment.
    """
    try:
        # On utilise la clé passée en paramètre ou celle par défaut configurée
        key_name = request.key_name or settings.VAULT_TRANSIT_KEY
        
        # On délègue le travail à notre client Vault
        ciphertext = vault.encrypt_data(request.plaintext, key_name)
        
        return EncryptResponse(ciphertext=ciphertext, key_used=key_name)
    except Exception as e:
        # En cas d'erreur (Vault inaccessible, clé inexistante...), on renvoie une 500
        raise HTTPException(status_code=500, detail=f"Erreur de chiffrement: {str(e)}")

@router.post("/decrypt", response_model=DecryptResponse)
async def decrypt_text(
    request: DecryptRequest, 
    vault: VaultClient = Depends(get_vault_client)
):
    """
    Endpoint pour déchiffrer un texte.
    Le ciphertext fourni doit commencer par 'vault:v1:...' (format standard de Vault).
    """
    try:
        key_name = request.key_name or settings.VAULT_TRANSIT_KEY
        
        # Vault vérifie lui-même si le ciphertext est valide pour cette clé
        plaintext = vault.decrypt_data(request.ciphertext, key_name)
        
        return DecryptResponse(plaintext=plaintext)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur de déchiffrement: {str(e)}")
