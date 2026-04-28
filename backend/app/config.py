from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # API Settings
    PROJECT_NAME: str = "Secure Vault"
    DATABASE_URL: str = "postgresql://user:password@db:5432/securevault"
    
    # Security
    SECRET_KEY: str = "your-super-secret-jwt-key" # À changer en prod
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Vault Settings
    VAULT_ADDR: str = "http://vault:8200"
    VAULT_TOKEN: str = "root"
    VAULT_TRANSIT_KEY: str = "vault-key"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
