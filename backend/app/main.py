from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.routers import create_routers
from app.seed import seed_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_data()
    yield


app = FastAPI(
    title="AL GHANI Restaurant POS",
    version="1.0.0",
    description="Production-ready restaurant management system for AL GHANI BBQ & FAST FOOD.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in create_routers():
    app.include_router(router)


@app.get("/")
def root():
    return {"status": "ok", "app": "AL GHANI POS"}
