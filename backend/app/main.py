from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import catalog, commerce, sommelier


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Backend completo en Python (FastAPI) para AURA Specialty Coffee Roasters: "
        "Sommelier IA con Groq, Memoria Sensorial Adaptativa, Catálogo, Guías Barista y Comercio."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sommelier.router)
app.include_router(catalog.router)
app.include_router(commerce.router)


@app.get("/health", tags=["Sistema"])
def healthcheck():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "groqConfigured": bool(settings.GROQ_API_KEY),
    }

