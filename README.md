# AL GHANI Restaurant POS

A production-ready Restaurant Management System / Point of Sale for **AL GHANI BBQ & FAST FOOD**.

## Features

- Role-based secure login (admin, manager, cashier)
- Dark, modern, touch-friendly UI
- Order entry for BBQ, Fast Food and Deals
- 3 table management with manual bill entry
- Receipt printing and preview
- Daily / Weekly / Monthly reports with charts
- Settings for menu, categories, deals, users, tax, discount, printer and backups
- SQLite database with full seed data from the uploaded menu

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + Recharts + React Router
- **Backend:** FastAPI + SQLAlchemy + SQLite + JWT auth

## Project Structure

```
restaurant-pos-al-ghani/
├── backend/               FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   ├── seed.py
│   │   ├── routers.py
│   │   └── utils.py
│   ├── requirements.txt
│   └── run.py
└── frontend/              React frontend
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── api.js
    │   ├── auth.jsx
    │   └── App.jsx
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

## Getting Started

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

The API runs on `http://localhost:8000` and auto-creates / seeds the SQLite database.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173` and proxies API calls to `http://localhost:8000`.

## Default Login

- **Username:** `admin`
- **Password:** `admin`

Change the default admin password in production.

## API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for the interactive Swagger UI.

## Backup

From the **Settings** page, click **Backup Database** to download the SQLite file.

## License

Internal use for AL GHANI BBQ & FAST FOOD.
