import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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


static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
static_dir = os.path.normpath(static_dir)
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    @app.get("/")
    def root():
        return {"status": "ok", "app": "AL GHANI POS"}
