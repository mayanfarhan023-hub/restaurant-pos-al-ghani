import os
from dotenv import load_dotenv

load_dotenv()


def _default_database_url():
    # Use a persistent volume path when available, otherwise fall back to local file.
    if os.path.isdir("/data"):
        return "sqlite:////data/pos_al_ghani.db"
    return "sqlite:///./pos_al_ghani.db"


DATABASE_URL = os.getenv("DATABASE_URL", _default_database_url())
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-al-ghani-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")
