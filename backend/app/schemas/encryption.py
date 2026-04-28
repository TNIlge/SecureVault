from pydantic import BaseModel

class EncryptRequest(BaseModel):
    plaintext: str
    key_name: str | None = None

class EncryptResponse(BaseModel):
    ciphertext: str
    key_used: str

class DecryptRequest(BaseModel):
    ciphertext: str
    key_name: str | None = None

class DecryptResponse(BaseModel):
    plaintext: str
