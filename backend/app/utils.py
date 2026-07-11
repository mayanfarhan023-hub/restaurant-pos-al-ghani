from decimal import Decimal
from sqlalchemy.orm import Session
from app.models import Setting


def get_setting(db: Session, key: str, default: str = "") -> str:
    row = db.query(Setting).filter(Setting.key == key).first()
    return row.value if row else default


def get_decimal_setting(db: Session, key: str, default: Decimal = Decimal("0")) -> Decimal:
    try:
        return Decimal(get_setting(db, key, str(default)))
    except Exception:
        return default
