from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# On utilise PostgreSQL comme défini dans le docker-compose
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dépendance pour obtenir une session de base de données."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
