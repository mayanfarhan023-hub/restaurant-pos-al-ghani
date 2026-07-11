from decimal import Decimal
from app.database import SessionLocal
from app.models import Category, MenuItem, Deal, DealItem, User, Setting
from app.auth import get_password_hash
from app.config import ADMIN_USERNAME, ADMIN_PASSWORD


MENU_SEED = {
    "BBQ": [
        ("Rolls", [
            ("Kebab Roll", 100),
            ("Kebab Mayo Roll", 120),
            ("Boti Roll", 130),
            ("Boti Mayo Roll", 150),
            ("Chicken Boti Roll", 140),
            ("Chicken Boti Mayo Roll", 160),
            ("Malai Boti Roll", 150),
            ("Malai Boti Mayo Roll", 170),
        ]),
        ("Puri Paratha Rolls", [
            ("Kebab Roll", 120),
            ("Kebab Mayo Roll", 140),
            ("Boti Roll", 150),
            ("Boti Mayo Roll", 170),
            ("Chicken Boti Roll", 160),
            ("Chicken Boti Mayo Roll", 180),
            ("Malai Boti Roll", 170),
            ("Malai Boti Mayo Roll", 190),
        ]),
        ("Tikka", [
            ("Chicken Tikka Seena", 400),
            ("Chicken Behari Tikka Seena", 400),
            ("Chicken Malai Tikka Seena", 450),
            ("Chicken Green Tikka Seena", 450),
            ("Chicken Leg Tikka", 350),
            ("Chicken Leg Behari Tikka", 350),
            ("Chicken Leg Malai Tikka", 400),
            ("Chicken Leg Green Tikka", 400),
            ("Chicken Behari Tikka", 400),
        ]),
        ("Bar BQ Plates", [
            ("Dhagha Kebab Plate", 300),
            ("Gola Kebab Plate", 350),
            ("Chandan Kebab Plate", 350),
            ("Beef Behari Boti Plate", 400),
            ("Chicken Boti Plate", 400),
            ("Chicken Malai Boti Plate", 430),
        ]),
        ("Rice Platters", [
            ("Rice Platter", 1700),
        ]),
        ("BBQ Platters", [
            ("Platter", 1550),
        ]),
        ("Paratha/Puri", [
            ("Puri Paratha", 50),
            ("Special Puri Paratha", 100),
            ("Tawa Paratha", 40),
        ]),
    ],
    "Fast Food": [
        ("Burgers", [
            ("Zinger Burger", 380),
            ("Zinger Cheese Burger", 430),
            ("Zinger Double Decker", 550),
            ("Zinger Double Decker Cheese", 600),
            ("Zinger Junior", 280),
            ("Zinger Cheese Junior", 330),
            ("Zinger Crispy Roll", 280),
            ("Zinger Crispy Cheese Roll", 330),
            ("Chicken Burger", 280),
            ("Chicken Cheese Burger", 330),
            ("Beef Burger", 330),
            ("Beef Cheese Burger", 380),
        ]),
        ("Sandwiches", [
            ("Chicken Club Sandwich", 330),
            ("Chicken Cheese Club Sandwich", 380),
            ("Chicken Sandwich", 280),
            ("Chicken Cheese Sandwich", 330),
            ("Arabian Sandwich", 400),
            ("Arabian Club Sandwich", 450),
            ("Zinger Crispy Sandwich", 450),
            ("Zinger Crispy Club Sandwich", 520),
            ("Beef (Qeema) Spicy Sandwich", 400),
            ("Beef (Qeema) Spicy Club Sandwich", 450),
            ("Chicken (Qeema) Spicy Sandwich", 400),
            ("Chicken (Qeema) Spicy Club Sandwich", 450),
        ]),
        ("Broast", [
            ("Broast Chest Qtr", 450),
            ("Broast Leg Qtr", 400),
            ("Masala Chest Qtr", 500),
            ("Masala Leg Qtr", 450),
            ("Mayo Broast Chest Qtr", 500),
            ("Mayo Broast Leg Qtr", 450),
            ("Crispy Chest Qtr", 450),
            ("Crispy Leg Qtr", 400),
            ("Full Broast", 1650),
            ("Half Broast", 850),
            ("Chicken Nuggets (12 Pcs)", 500),
            ("Masala With Mayo Fries", 200),
            ("Normal Fries", 100),
        ]),
    ],
}


DEALS = [
    {
        "name": "Deal 01",
        "price": 950,
        "items": [("Zinger Burger", 1), ("Beef Burger", 1), ("Chicken Club Sandwich", 1), ("Normal Fries", 1)],
    },
    {
        "name": "Deal 02",
        "price": 800,
        "items": [("Zinger Junior", 1), ("Chicken Sandwich", 1), ("Normal Fries", 1)],
    },
    {
        "name": "Deal 03",
        "price": 520,
        "items": [("Zinger Crispy Roll", 1), ("Zinger Junior", 1), ("Normal Fries", 1)],
    },
    {
        "name": "Deal 04",
        "price": 1400,
        "items": [("Broast Chest Qtr", 1), ("Zinger Burger", 1), ("Chicken Club Sandwich", 1), ("Normal Fries", 1)],
    },
    {
        "name": "Deal 05",
        "price": 500,
        "items": [("Zinger Junior", 2), ("Normal Fries", 1)],
    },
    {
        "name": "Deal 06",
        "price": 800,
        "items": [("Chicken Burger", 1), ("Beef Burger", 1), ("Zinger Crispy Roll", 1), ("Normal Fries", 1)],
    },
    {
        "name": "Deal 07",
        "price": 1200,
        "items": [("Zinger Junior", 5), ("Normal Fries", 1)],
    },
    {
        "name": "Deal 08",
        "price": 1700,
        "items": [
            ("Zinger Double Decker", 1),
            ("Zinger Crispy Roll", 1),
            ("Broast Leg Qtr", 1),
            ("Chicken Club Sandwich", 1),
            ("Chicken Burger", 1),
            ("Beef Burger", 1),
            ("Normal Fries", 1),
        ],
    },
    {
        "name": "Deal 09",
        "price": 1850,
        "items": [
            ("Broast Chest Qtr", 1),
            ("Zinger Burger", 1),
            ("Chicken Club Sandwich", 1),
            ("Chicken Burger", 1),
            ("Beef Burger", 1),
            ("Normal Fries", 1),
        ],
    },
    {
        "name": "Deal 10",
        "price": 1600,
        "items": [
            ("Zinger Junior", 2),
            ("Chicken Burger", 1),
            ("Beef Burger", 1),
            ("Chicken Club Sandwich", 1),
            ("Normal Fries", 1),
        ],
    },
]


DEFAULT_SETTINGS = {
    "restaurant_name": "AL GHANI BBQ & FAST FOOD",
    "restaurant_address": "",
    "restaurant_phone": "",
    "tax_rate": "0",
    "default_discount": "0",
    "printer_name": "",
    "currency": "Rs.",
    "receipt_header": "AL GHANI BBQ & FAST FOOD",
    "receipt_footer": "Thank you for dining with us!",
}


def seed_data():
    db = SessionLocal()
    try:
        if not db.query(Category).first():
            cat_map = {}
            for section, cats in MENU_SEED.items():
                for idx, (cat_name, items) in enumerate(cats):
                    cat = Category(name=cat_name, section=section, sort_order=idx)
                    db.add(cat)
                    db.flush()
                    cat_map[cat_name] = cat.id
                    for item_name, price in items:
                        db.add(MenuItem(name=item_name, price=Decimal(price), category_id=cat.id))

            # Create an admin user if missing
            if not db.query(User).filter(User.username == ADMIN_USERNAME).first():
                db.add(
                    User(
                        username=ADMIN_USERNAME,
                        full_name="System Administrator",
                        role="admin",
                        hashed_password=get_password_hash(ADMIN_PASSWORD),
                    )
                )

            # Default settings
            for key, value in DEFAULT_SETTINGS.items():
                if not db.query(Setting).filter(Setting.key == key).first():
                    db.add(Setting(key=key, value=value))

            # Create deals
            for deal in DEALS:
                new_deal = Deal(name=deal["name"], price=Decimal(deal["price"]))
                db.add(new_deal)
                db.flush()
                for item_name, qty in deal["items"]:
                    menu_item = db.query(MenuItem).filter(MenuItem.name == item_name).first()
                    if menu_item:
                        db.add(DealItem(deal_id=new_deal.id, menu_item_id=menu_item.id, quantity=qty))

            db.commit()
            print("Seeding completed.")
        else:
            print("Database already seeded.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
