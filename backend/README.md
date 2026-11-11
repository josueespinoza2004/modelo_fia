# AURA Coffee Roasters — Python Backend (FastAPI)

Backend independiente en **Python + FastAPI + SQLite + Groq SDK** que concentra toda la lógica de negocio, la IA del Sommelier *Don Aurelio*, la memoria sensorial adaptativa, el catálogo de cafés, las guías de extracción y el procesamiento de órdenes.

El frontend en Next.js actúa únicamente como capa visual consumiendo los endpoints bajo `/api/*`.

## Requisitos

- Python 3.12+
- Dependencias instaladas en `backend/.venv` (ver `requirements.txt`)
- Clave `GROQ_API_KEY` configurada en `backend/.env` o en `../.env.local`

## Ejecución local

Desde la carpeta raíz del repositorio:

```bash
npm run dev:backend
```

O directamente dentro de `backend/`:

```bash
.venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Documentación interactiva Swagger UI: `http://127.0.0.1:8000/docs`
- Healthcheck: `http://127.0.0.1:8000/health`

## Pruebas automatizadas

```bash
cd backend && .venv/bin/pytest -v
```

