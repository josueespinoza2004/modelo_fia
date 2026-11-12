# AURA • Specialty Coffee Roasters & Sommelier Virtual con IA

Plataforma web boutique para una tostaduría de café de especialidad (**SCA 86+ puntos**) equipada con **Don Aurelio**, un sommelier virtual conversacional con **streaming en tiempo real**, **memoria sensorial adaptativa** y arquitectura desacoplada:

- **Frontend (Solo Visualización):** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 y componentes **shadcn/ui**.
- **Backend (Toda la Lógica, IA y Persistencia):** Python + **FastAPI**, **Groq SDK** (`AsyncGroq`), Pydantic y **SQLite**.

---

## Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Funcionalidades Principales](#funcionalidades-principales)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Requerimientos Previos](#requerimientos-previos)
5. [Instalación Paso a Paso](#instalación-paso-a-paso)
6. [Variables de Entorno](#variables-de-entorno)
7. [Ejecución Local](#ejecución-local)
8. [Endpoints de la API](#endpoints-de-la-api)
9. [Pruebas y Verificación](#pruebas-y-verificación)

---

## Arquitectura General

```text
┌──────────────────────┐       /api/* (Rewrites)       ┌──────────────────────────────┐
│   Next.js Frontend   │ ────────────────────────────► │   Python FastAPI Backend     │
│   (Puerto 3000)      │ ◄──────────────────────────── │   (Puerto 8000)              │
│                      │   JSON & SSE (text/event-stream) │                              │
│  • Landing Boutique  │                               │  • Sommelier IA (Groq API)   │
│  • UI Shadcn + TW    │                               │  • Memoria Sensorial (SQLite)│
│  • Carrito & Modal   │                               │  • Fallback Adaptativo Local │
└──────────────────────┘                               │  • Catálogo, Guías & Órdenes │
                                                       └──────────────┬───────────────┘
                                                                      │
                                                                      ▼
                                                       ┌──────────────────────────────┐
                                                       │   Groq Cloud API & SQLite    │
                                                       │   (backend/data/aura.db)     │
                                                       └──────────────────────────────┘
```

Next.js actúa únicamente como capa visual: todas las consultas al catálogo, cálculos de extracción, evaluación del Test de Paladar, validación de cupones, órdenes de compra y conversaciones con *Don Aurelio* se procesan en el servidor Python mediante `rewrites()` configurados en [`next.config.ts`](next.config.ts).

---

## Funcionalidades Principales

### 1. Sommelier Virtual "Don Aurelio" con Streaming en Tiempo Real
- **Transmisión SSE (`POST /api/sommelier/stream`):** Las respuestas fluyen token por token en el chat con botón para **Detener** la generación en curso.
- **Tono Conversacional Breve:** Calibrado para responder de forma natural, cercana y concisa (sin bloques extensos innecesarios salvo que se solicite una receta paso a paso).
- **Tarjetas Interactivas en el Chat:** Al recomendar granos, el backend parsea la selección del modelo sin mostrar etiquetas internas en pantalla y renderiza tarjetas listas para elegir molienda y añadir al carrito con un clic.
- **Resiliencia Offline / Sin Cuota:** Si no existe `GROQ_API_KEY` o falla la conexión externa, el motor local adaptativo responde automáticamente usando la memoria del usuario sin errores HTTP 500.

### 2. Memoria Sensorial Adaptativa (`UserPalateMemory`)
El backend detecta, recuerda y persiste en SQLite (asociado al `sessionId` del navegador):
- **Cafetera / Método preferido:** `V60`, `Chemex`, `Aeropress`, `Espresso`, `Moka`, `Prensa Francesa`.
- **Perfil aromático:** `floral`, `frutal`, `chocolate`, `decaf`.
- **Preferencia de servicio:** `solo` (café negro) o `con-leche`.
- **Sensibilidad gástrica / Baja acidez:** Detección automática de reflujo, gastritis o preferencia por baja acidez.
- **Historial de granos consultados** y barra visual editable en el modal (*"Olvidar perfil"*).

### 3. Test de Paladar en 30 Segundos
- Flujo guiado en 3 pasos (Método → Familia de Sabor → Negro o con Leche) evaluado por el backend en `POST /api/sommelier/quiz`.
- Calcula el grano ideal, segunda opción, molienda calibrada y porcentaje de afinidad, sincronizándolo automáticamente con la memoria del chat.

### 4. Catálogo, Radar Sensorial y Guía Barista
- **Catálogo con Búsqueda y Filtros en Backend:** Filtrado por familia aromática, método de preparación, búsqueda por notas/origen y ordenamiento (Destacados, Puntaje SCA, Precio), además de modal de Ficha Técnica con barras sensoriales.
- **Calculadora de Ratio & Cronómetro en Vivo:** Calcula en el backend la dosis exacta de agua y pre-infusión según método y gramos, acompañado de un cronómetro barista integrado.
- **Cesta de Compra y Checkout:** Edición de molienda en cesta, barra de envío gratis (`$55.00 USD`), validación de cupones en backend (`AURA15` para 15% y `SOMMELIER10` para 10%), generación de número de lote/orden (`#AURA-2026-...`) y suscripción al Club de Catadores guardados en SQLite.

---

## Estructura del Proyecto

```text
modelo_fia/
├── backend/
│   ├── app/
│   │   ├── data/
│   │   │   └── catalog.py           # Catálogo de microlotes, guías y cupones
│   │   ├── models/
│   │   │   └── schemas.py           # Esquemas Pydantic de peticiones/respuestas
│   │   ├── routers/
│   │   │   ├── catalog.py           # Endpoints de catálogo y calculadora barista
│   │   │   ├── commerce.py          # Endpoints de cupones, órdenes y newsletter
│   │   │   └── sommelier.py         # Chat JSON, Streaming SSE, Quiz y Sesiones
│   │   ├── services/
│   │   │   ├── commerce_service.py  # Filtros, cálculos y procesamiento de pedidos
│   │   │   └── sommelier_service.py # Groq AsyncGroq, memoria adaptativa y fallback
│   │   ├── config.py                # Carga de variables (.env / .env.local)
│   │   ├── database.py              # SQLite (sessions, orders, subscribers)
│   │   └── main.py                  # Instancia FastAPI, CORS y /health
│   ├── tests/
│   │   └── test_api.py              # Suite pytest (10 pruebas automatizadas)
│   ├── .env.example                 # Plantilla de variables para el backend
│   ├── README.md                    # Guía rápida del backend
│   └── requirements.txt             # Dependencias Python
├── public/
│   └── images/                      # Recursos gráficos de la tostaduría
├── src/
│   ├── app/
│   │   ├── globals.css              # Tema oscuro café/ámbar y estilos base
│   │   ├── layout.tsx               # Layout raíz, fuentes y proveedores globales
│   │   └── page.tsx                 # Landing principal
│   ├── components/
│   │   ├── cart/CartDrawer.tsx      # Cajón lateral de compra y checkout
│   │   ├── home/                    # Hero, FlavorRadar, ProductCatalog, BrewGuide, OriginPhilosophy
│   │   ├── layout/                  # Navbar y Footer
│   │   ├── sommelier/               # SommelierModal (Chat SSE + Quiz) y SommelierWidget
│   │   └── ui/                      # Componentes base de shadcn/ui
│   ├── context/CartContext.tsx      # Estado global de catálogo, carrito, sesión y modales
│   ├── lib/api.ts                   # Cliente HTTP/SSE tipado hacia el backend Python
│   └── types/coffee.ts              # Tipos TypeScript compartidos
├── next.config.ts                   # Proxy /api/* hacia FastAPI
├── package.json                     # Scripts y dependencias Next.js
├── REGISTRO_PRUEBAS.md              # Documentación de escenarios y correcciones
└── README.md                        # Este documento
```

> Nota: `chatbot.php` en la raíz se conserva únicamente como referencia histórica del prototipo original.

---

## Requerimientos Previos

- **Node.js:** v20 o superior (incluye `npm`).
- **Python:** 3.12 o superior (recomendado 3.12–3.14) con `pip` o [`uv`](https://docs.astral.sh/uv/).
- **Clave API de Groq (Opcional pero recomendada):** Puedes generar una clave gratuita en [Groq Console](https://console.groq.com/). Si no se configura, el chatbot funcionará automáticamente con el motor adaptativo local.

---

## Instalación Paso a Paso

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd modelo_fia
```

### 2. Instalar dependencias del Frontend (Next.js)

```bash
npm install
```

### 3. Crear entorno virtual e instalar dependencias del Backend (Python)

Con `venv` + `pip`:

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cd ..
```

*(Alternativa rápida si tienes `uv` instalado)*:

```bash
uv venv backend/.venv
uv pip install --python backend/.venv/bin/python -r backend/requirements.txt
```

---

## Variables de Entorno

El backend busca automáticamente la configuración en `backend/.env` y, de forma alternativa, en `.env.local` en la raíz del proyecto (ver [`backend/app/config.py`](backend/app/config.py)).

Crea un archivo `.env.local` en la raíz (o copia `backend/.env.example` a `backend/.env`):

```env
# Clave de API de Groq (opcional; si se omite usa el motor local adaptativo)
GROQ_API_KEY=gsk_tu_api_key_de_groq

# Modelo activo en Groq
GROQ_MODEL=openai/gpt-oss-120b

# Orígenes permitidos para CORS directo
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# URL del backend Python usada por Next.js rewrites (por defecto http://127.0.0.1:8000)
PYTHON_BACKEND_URL=http://127.0.0.1:8000
```

---

## Ejecución Local

Para trabajar localmente necesitas levantar ambos servicios en **dos terminales separadas** desde la raíz del proyecto:

### Terminal 1 — Backend Python (Puerto `8000`)

```bash
npm run dev:backend
```

*(Equivalente a `cd backend && .venv/bin/uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`)*

- Documentación interactiva **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Healthcheck del sistema: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### Terminal 2 — Frontend Next.js (Puerto `3000`)

```bash
npm run dev
```

Abre **[http://localhost:3000](http://localhost:3000)** en tu navegador para interactuar con la plataforma completa.

---

## Endpoints de la API

| Categoría | Método | Ruta | Descripción |
| :--- | :---: | :--- | :--- |
| **Sistema** | `GET` | `/health` | Estado del servidor y verificación de `GROQ_API_KEY` |
| **Sommelier IA** | `POST` | `/api/sommelier/stream` | Chat en vivo por SSE (`memory`, `delta`, `done`) |
| **Sommelier IA** | `POST` | `/api/sommelier` | Chat en formato JSON clásico (no streaming) |
| **Sommelier IA** | `POST` | `/api/sommelier/quiz` | Evaluación multicriterio del Test de Paladar |
| **Sesión** | `GET` | `/api/sommelier/session/{session_id}` | Recupera historial y memoria guardada en SQLite |
| **Sesión** | `DELETE` | `/api/sommelier/session/{session_id}/chat` | Reinicia la conversación de la sesión |
| **Sesión** | `DELETE` | `/api/sommelier/session/{session_id}/memory` | Borra el perfil de paladar aprendido |
| **Catálogo** | `GET` | `/api/catalog/coffees` | Lista cafés con filtros `category`, `method`, `search`, `sort` |
| **Catálogo** | `GET` | `/api/catalog/coffees/{coffee_id}` | Ficha técnica de un microlote específico |
| **Guías** | `GET` | `/api/catalog/guides` | Lista guías de extracción (`V60`, `Chemex`, `Aeropress`, etc.) |
| **Guías** | `POST` | `/api/catalog/guides/calculate` | Calcula mililitros de agua y pre-infusión según dosis |
| **Comercio** | `POST` | `/api/commerce/coupons/validate` | Valida códigos promocionales (`AURA15`, `SOMMELIER10`) |
| **Comercio** | `POST` | `/api/commerce/orders` | Recalcula totales, genera orden y la guarda en SQLite |
| **Comercio** | `POST` | `/api/commerce/newsletter` | Registra suscriptor y entrega código de bienvenida |

---

## Pruebas y Verificación

### Pruebas automatizadas del Backend (Python / pytest)

```bash
cd backend && .venv/bin/pytest -v
```

### Validación de tipos y Linter del Frontend (TypeScript / ESLint)

```bash
npx tsc --noEmit && npm run lint
```


