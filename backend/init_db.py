from app.database import engine, Base
from app.seed import seed_data

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed_data()
    print("Database initialized and seeded.")
