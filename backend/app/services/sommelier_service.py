import asyncio
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
import json
import re
from typing import Literal

from groq import AsyncGroq

from app.config import settings
from app.data.catalog import COFFEE_BY_ID, COFFEE_PRODUCTS
from app.database import get_session, save_session
from app.models.schemas import (
    BrewMethod,
    CoffeeProduct,
    GrindOption,
    HistoryMessage,
    MilkPreference,
    QuizFlavor,
    QuizResponse,
    SommelierResponse,
    UserPalateMemory,
)

CATALOG_CONTEXT = "\n".join(
    f"- ID: {c.id} | {c.name} ({c.origin}, {c.country}, {c.altitude}) | "
    f"Finca: {c.farm} (Productor: {c.producer}) | Variedad: {c.variety} | "
    f"Proceso: {c.process} | Tueste: {c.roastLevel} | SCA: {c.scaScore} pts | "
    f"Perfil: Aroma {c.aromaIntensity}/5, Acidez {c.acidity}/5, Cuerpo {c.body}/5, Dulzura {c.sweetness}/5 | "
    f"Notas: {', '.join(c.tastingNotes)} | Métodos: {', '.join(c.recommendedBrews)} | "
    f"Precio: ${c.price:.2f} USD (250g)"
    for c in COFFEE_PRODUCTS
)


def get_default_grind_for_method(method: BrewMethod | None) -> GrindOption:
    if method in ("Espresso", "Moka"):
        return "Molienda Fina (Espresso)"
    if method == "Prensa Francesa":
        return "Molienda Gruesa (Prensa Francesa)"
    if method in ("V60", "Chemex", "Aeropress"):
        return "Molienda Media (V60 / Filtro)"
    return "Grano Entero"


def _detect_coffee_mentions(query_lower: str) -> list[str]:
    mentioned: list[str] = []
    for coffee in COFFEE_PRODUCTS:
        if (
            coffee.name.lower() in query_lower
            or coffee.id.replace("-", " ") in query_lower
            or ("geisha" in query_lower and coffee.id == "geisha-la-esmeralda")
            or ("bourbon" in query_lower and coffee.id == "bourbon-rosado-huila")
            or ("yirgacheffe" in query_lower and coffee.id == "yirgacheffe-heirloom")
            or ("pacamara" in query_lower and coffee.id == "pacamara-black-honey-dipilto")
            or ("kenya" in query_lower and coffee.id == "kenya-aa-nyeri")
            or (
                ("roble" in query_lower or "sugarcane" in query_lower)
                and coffee.id == "sugarcane-decaf-caldas"
            )
        ):
            mentioned.append(coffee.id)
    return mentioned


def extract_and_merge_memory(
    message: str, prev_memory: UserPalateMemory | None = None
) -> UserPalateMemory:
    """Extrae y actualiza la Memoria Sensorial del Usuario a partir de lenguaje natural."""
    base = prev_memory.model_copy(deep=True) if prev_memory else UserPalateMemory()
    q = message.lower()

    # 1. Detectar método de preparación
    if "v60" in q or "filtro" in q or "goteo" in q:
        base.preferredMethod = "V60"
    elif "chemex" in q:
        base.preferredMethod = "Chemex"
    elif "aeropress" in q:
        base.preferredMethod = "Aeropress"
    elif "espresso" in q or "expreso" in q:
        base.preferredMethod = "Espresso"
    elif "moka" in q or "italiana" in q:
        base.preferredMethod = "Moka"
    elif "prensa" in q or "francesa" in q:
        base.preferredMethod = "Prensa Francesa"

    # 2. Detectar preferencia de sabor
    if any(
        kw in q
        for kw in (
            "descafeinado",
            "decaf",
            "sin cafeína",
            "sin cafeina",
            "insomnio",
            "dormir",
            "noche",
        )
    ):
        base.flavorPreference = "decaf"
    elif any(
        kw in q
        for kw in ("floral", "jazmín", "jazmin", "bergamota", "cítrico", "citrico")
    ):
        base.flavorPreference = "floral"
    elif any(
        kw in q
        for kw in (
            "frutal",
            "fruta",
            "arándano",
            "arandano",
            "frambuesa",
            "exótico",
            "exotico",
        )
    ):
        base.flavorPreference = "frutal"
    elif any(
        kw in q for kw in ("chocolate", "cacao", "panela", "caramelo", "intenso")
    ):
        base.flavorPreference = "chocolate"

    # 3. Detectar preferencia de leche vs café negro
    if any(
        kw in q
        for kw in (
            "con leche",
            "latte",
            "capuchino",
            "cappuccino",
            "avena",
            "almendra",
            "vegetal",
        )
    ):
        base.milkPreference = "con-leche"
    elif any(
        kw in q
        for kw in ("sin leche", "café negro", "cafe negro", "puro", "tomo solo")
    ):
        base.milkPreference = "solo"

    # 4. Detectar sensibilidad a la acidez / gastritis
    if any(
        kw in q
        for kw in (
            "reflujo",
            "gastritis",
            "estómago",
            "estomago",
            "no sea ácido",
            "no sea acido",
            "baja acidez",
            "poca acidez",
            "sin mucha acidez",
            "menos acidez",
            "poco ácido",
            "poco acido",
        )
    ):
        base.lowAcidity = True

    # 5. Registrar cafés consultados explícitamente
    for coffee_id in _detect_coffee_mentions(q):
        if coffee_id not in base.consultedCoffees:
            base.consultedCoffees.append(coffee_id)

    base.lastUpdated = datetime.now(timezone.utc).isoformat()
    return base


def _format_memory_for_prompt(memory: UserPalateMemory) -> str:
    traits: list[str] = []
    if memory.preferredMethod:
        traits.append(f"Método preferido: {memory.preferredMethod}")
    if memory.flavorPreference:
        traits.append(f"Perfil de sabor favorito: {memory.flavorPreference}")
    if memory.milkPreference:
        label = (
            "Con leche / bebida vegetal"
            if memory.milkPreference == "con-leche"
            else "Café negro puro"
        )
        traits.append(f"Preferencia de servicio: {label}")
    if memory.lowAcidity:
        traits.append("Condición especial: Prefiere baja acidez / cuidado estomacal")
    if memory.consultedCoffees:
        traits.append(f"Granos ya consultados: {', '.join(memory.consultedCoffees)}")

    if traits:
        joined = "\n- ".join(traits)
        return (
            "MEMORIA ADAPTATIVA DEL CLIENTE (Usa estos datos recordados de turnos anteriores "
            "para personalizar tu respuesta sin volver a preguntarlos):\n"
            f"- {joined}"
        )
    return "MEMORIA ADAPTATIVA DEL CLIENTE: Aún no se conocen preferencias previas del cliente."


def build_system_prompt(memory: UserPalateMemory) -> str:
    return f"""
Eres "Don Aurelio", Maestro Sommelier de Café, Licenciado Q-Grader y Director de Tueste de la tostaduría boutique "AURA Coffee Roasters".
Tu pasión es educar el paladar de las personas y conectarlas con el café de especialidad perfecto para su momento, gusto sensorial y método de extracción.

{_format_memory_for_prompt(memory)}

REGLAS DE INTERACCIÓN:
1. Hablas en español con un tono cálido, distinguido, sensorial y apasionado (como un barista sabio y cercano en una barra de especialidad).
2. Tienes acceso al catálogo exclusivo de AURA Coffee Roasters. Usa SOLO estos cafés al recomendar granos:
{CATALOG_CONTEXT}

3. Sé conciso, directo y adaptativo:
   - Si en la MEMORIA ADAPTATIVA DEL CLIENTE ya consta su método de extracción, gusto o sensibilidad a la acidez, haz referencia explícita a ello para demostrar que lo recuerdas y adapta tu receta a esa cafetera.
   - Responde en 2 a 4 párrafos cortos o listas con viñetas.
   - Explica el porqué sensorial de tu recomendación (ej: notas de jazmín vs caramelo, acidez cítrica vs cuerpo sedoso).
   - Da un consejo de barista práctico (temperatura del agua, ratio café:agua o molienda).

4. ETIQUETA OBLIGATORIA DE RECOMENDACIÓN:
   - Cuando recomiendes uno o más cafés del catálogo, SIEMPRE añade al final de tu mensaje la etiqueta exacta:
     [RECOMMENDED: id_del_cafe_1, id_del_cafe_2]
   - Ejemplo: [RECOMMENDED: geisha-la-esmeralda]
   - Usa exclusivamente los IDs exactos de la lista:
     * geisha-la-esmeralda
     * bourbon-rosado-huila
     * yirgacheffe-heirloom
     * pacamara-black-honey-dipilto
     * kenya-aa-nyeri
     * sugarcane-decaf-caldas
   - Si la consulta es una duda general sobre métodos o molienda y no amerita recomendar un grano específico, no agregues la etiqueta.

5. Sé honesto: si preguntan por cafés comerciales oscuros o amargos quemados, explícales con amabilidad la diferencia con el café de especialidad de tueste medio/ligero respetuoso del terruño.
"""


def build_local_sommelier_response(
    query: str, memory: UserPalateMemory
) -> tuple[str, list[str]]:
    """Motor adaptativo local de respaldo cuando Groq no está disponible."""
    q = query.lower()
    method_note = (
        f"Recordando que preparas en **{memory.preferredMethod}**, "
        if memory.preferredMethod
        else ""
    )

    # 1. Si pregunta por un café específico del catálogo
    mentioned = _detect_coffee_mentions(q)
    if mentioned:
        coffee = COFFEE_BY_ID[mentioned[0]]
        target_method = memory.preferredMethod or coffee.recommendedBrews[0]
        reply = (
            f"¡Excelente elección fijarte en nuestro **{coffee.name}** ({coffee.origin}, {coffee.country})! "
            f"Es un lote cultivado a {coffee.altitude} en **{coffee.farm}** por {coffee.producer}, "
            f"con una puntuación de **{coffee.scaScore} puntos SCA**.\n\n"
            f"En taza despliega notas vibrantes de **{', '.join(coffee.tastingNotes)}**, "
            f"gracias a su proceso *{coffee.process}* y su tueste {coffee.roastLevel.lower()} "
            f"(Acidez {coffee.acidity}/5, Cuerpo {coffee.body}/5, Dulzura {coffee.sweetness}/5).\n\n"
            f"- **Consejo personalizado:** {method_note}te sugiero extraerlo en **{target_method}** "
            f"con agua a 92°C y pre-infusión de 40 segundos para despertar todos sus compuestos aromáticos."
        )
        return reply, [coffee.id]

    # 2. Gastritis / baja acidez / descafeinado
    if (
        any(
            kw in q
            for kw in (
                "reflujo",
                "gastritis",
                "estómago",
                "estomago",
                "no sea ácido",
                "no sea acido",
                "baja acidez",
                "noche",
                "descafeinado",
            )
        )
        or memory.lowAcidity
        or memory.flavorPreference == "decaf"
    ):
        reply = (
            f"{method_note}teniendo en cuenta tu preferencia por un perfil de **baja acidez y amable con el estómago**, "
            "te recomiendo estos dos microlotes de dulzura sedosa:\n\n"
            "- **Decaf Sugarcane El Roble (Acidez 2/5):** Descafeinado natural con caña de azúcar de Caldas, Colombia. "
            "Cero irritación y notas cremosas a **toffee, vainilla tostada y almendra**.\n"
            "- **Pacamara Black Honey Reserva (Acidez 3/5):** Proceso 100% mucílago preservado con un cuerpo licoroso (5/5) "
            "y dulzura densa de **panela, canela y chocolate belga**.\n\n"
            f"- **Consejo de barista:** Usa agua a **90°C** en tu {memory.preferredMethod or 'cafetera'} "
            "para lograr una infusión redonda, dulce y libre de acidez punzante."
        )
        return reply, ["sugarcane-decaf-caldas", "pacamara-black-honey-dipilto"]

    # 3. Leche / chocolate / espresso / moka / prensa
    if (
        any(
            kw in q
            for kw in (
                "leche",
                "chocolate",
                "cacao",
                "espresso",
                "moka",
                "prensa",
                "dulce",
            )
        )
        or memory.milkPreference == "con-leche"
        or memory.flavorPreference == "chocolate"
    ):
        milk_phrase = (
            " que brillen con leche"
            if memory.milkPreference == "con-leche"
            else " con gran cuerpo"
        )
        grind_advice = (
            "fina (ratio 1:2 en 28s)"
            if memory.preferredMethod == "Espresso"
            else "media-gruesa (ratio 1:15 a 93°C)"
        )
        reply = (
            f"{method_note}para disfrutar de notas achocolatadas{milk_phrase}, necesitas granos de densidad licorosa:\n\n"
            "- **Pacamara Black Honey Reserva (Nicaragua - SCA 88):** Proceso *Black Honey* con cuerpo 5/5 y notas intensas "
            "de **chocolate belga, panela y manzana caramelizada**.\n"
            "- **Decaf Sugarcane El Roble (Colombia - SCA 86.5):** Perfil sedoso con notas de **toffee, vainilla tostada y almendra horneada**.\n\n"
            f"- **Consejo de barista:** En {memory.preferredMethod or 'Prensa Francesa o Espresso'} usa molienda {grind_advice} "
            "para resaltar su textura achocolatada."
        )
        return reply, ["pacamara-black-honey-dipilto", "sugarcane-decaf-caldas"]

    # 4. Frutal / exótico / aeropress
    if (
        any(kw in q for kw in ("frutal", "fruta", "aeropress", "exótico", "exotico"))
        or memory.flavorPreference == "frutal"
    ):
        reply = (
            f"{method_note}para tu gusto por perfiles **frutales y exóticos**, estos dos microlotes son verdaderas joyas sensoriales:\n\n"
            "- **Bourbon Rosado Anaeróbico (Huila, Colombia - SCA 89):** Doble fermentación anaeróbica con notas de "
            "**frambuesa madura, cacao ruby y caramelo salado**.\n"
            "- **Yirgacheffe Grado 1 Heirloom (Etiopía - SCA 90):** Proceso natural secado en cereza completa, pura mermelada de "
            "**arándano silvestre, mandarina dulce y flor de sauco**.\n\n"
            f"- **Consejo de barista:** En tu {memory.preferredMethod or 'V60 o AeroPress'} extrae a **91°C** con ratio 1:15 "
            "para destacar toda su jugosidad frutal."
        )
        return reply, ["bourbon-rosado-huila", "yirgacheffe-heirloom"]

    # 5. Floral / cítrico / general
    reply = (
        f"{method_note}para experimentar la máxima complejidad floral y cítrica de nuestra tostaduría, "
        "te sugiero estos dos microlotes extraordinarios:\n\n"
        "- **Geisha Finca La Esmeralda (Panamá - SCA 91.5):** El \"champagne\" de los cafés. Fragancia de "
        f"**jazmín silvestre, bergamota y melocotón blanco**, sublime en {memory.preferredMethod or 'V60 o Chemex'}.\n"
        "- **Kenya AA Nyeri High Reserve (Kenia - SCA 89.0):** Lavado doble con agua de glaciar, notas vibrantes de "
        "**grosella negra (cassis), pomelo rubí y caña de azúcar**.\n\n"
        "- **Consejo de barista:** Usa un ratio **1:16** (15g de café por 240ml de agua a 92°C) con pre-infusión de 45 segundos."
    )
    return reply, ["geisha-la-esmeralda", "kenya-aa-nyeri"]


def _parse_recommendations(reply_content: str) -> tuple[str, list[str]]:
    match = re.search(r"\[RECOMMENDED:\s*([a-z0-9\-,\s]+)\]", reply_content, re.IGNORECASE)
    if not match:
        clean_reply = reply_content.strip()
        inferred = _detect_coffee_mentions(clean_reply.lower())[:2]
        return clean_reply, inferred

    clean_reply = reply_content.replace(match.group(0), "").strip()
    seen: set[str] = set()
    valid_ids: list[str] = []
    for raw_id in match.group(1).split(","):
        pid = raw_id.strip().lower()
        if pid in COFFEE_BY_ID and pid not in seen:
            seen.add(pid)
            valid_ids.append(pid)
    return clean_reply, valid_ids


RECOMMENDED_PREFIX = "[RECOMMENDED:"


def _split_stream_buffer(pending: str) -> tuple[str, str]:
    """Emite texto seguro y retiene cualquier sufijo potencial de [RECOMMENDED: ...]."""
    output_parts: list[str] = []
    pos = 0
    length = len(pending)

    while pos < length:
        bracket_idx = pending.find("[", pos)
        if bracket_idx == -1:
            output_parts.append(pending[pos:])
            break

        if bracket_idx > pos:
            output_parts.append(pending[pos:bracket_idx])

        tail = pending[bracket_idx:]
        upper_tail = tail.upper()

        if len(upper_tail) < len(RECOMMENDED_PREFIX):
            if RECOMMENDED_PREFIX.startswith(upper_tail):
                return "".join(output_parts), tail
            output_parts.append("[")
            pos = bracket_idx + 1
        elif upper_tail.startswith(RECOMMENDED_PREFIX):
            close_idx = tail.find("]")
            if close_idx == -1:
                return "".join(output_parts), tail
            pos = bracket_idx + close_idx + 1
        else:
            output_parts.append("[")
            pos = bracket_idx + 1

    return "".join(output_parts), ""


def _prepare_sommelier_context(
    message: str,
    history: list[HistoryMessage],
    prev_memory: UserPalateMemory | None = None,
    session_id: str | None = None,
) -> tuple[str, UserPalateMemory, list[dict], list[dict[str, str]]]:
    clean_message = message.strip()[:600]
    effective_prev_memory = prev_memory or UserPalateMemory()
    stored_messages: list[dict] = []

    if session_id:
        session_data = get_session(session_id)
        stored_messages = session_data["messages"]
        if not any(
            [
                effective_prev_memory.preferredMethod,
                effective_prev_memory.flavorPreference,
                effective_prev_memory.milkPreference,
                effective_prev_memory.lowAcidity,
                effective_prev_memory.consultedCoffees,
            ]
        ):
            effective_prev_memory = session_data["userMemory"]

    updated_memory = extract_and_merge_memory(clean_message, effective_prev_memory)
    recent_history = history[-6:]
    groq_messages = [
        {"role": "system", "content": build_system_prompt(updated_memory)},
        *[
            {
                "role": "user" if m.role == "user" else "assistant",
                "content": str(m.content or "")[:800],
            }
            for m in recent_history
        ],
        {"role": "user", "content": clean_message},
    ]
    return clean_message, updated_memory, stored_messages, groq_messages


def _persist_sommelier_turn(
    session_id: str | None,
    stored_messages: list[dict],
    updated_memory: UserPalateMemory,
    clean_message: str,
    clean_reply: str,
    recommended_ids: list[str],
) -> None:
    if not session_id:
        return
    now_id = int(datetime.now(timezone.utc).timestamp() * 1000)
    new_history = [
        *stored_messages,
        {"id": f"user-{now_id}", "role": "user", "content": clean_message},
        {
            "id": f"assistant-{now_id + 1}",
            "role": "assistant",
            "content": clean_reply,
            "recommendedProductIds": recommended_ids,
        },
    ]
    save_session(session_id, updated_memory, new_history)


def _sse_event(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


async def ask_sommelier(
    message: str,
    history: list[HistoryMessage],
    prev_memory: UserPalateMemory | None = None,
    session_id: str | None = None,
) -> SommelierResponse:
    clean_message, updated_memory, stored_messages, groq_messages = (
        _prepare_sommelier_context(message, history, prev_memory, session_id)
    )

    engine: Literal["groq", "local-fallback"] = "groq"
    clean_reply = ""
    recommended_ids: list[str] = []

    if not settings.GROQ_API_KEY:
        engine = "local-fallback"
        clean_reply, recommended_ids = build_local_sommelier_response(
            clean_message, updated_memory
        )
    else:
        try:
            client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            completion = await client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=groq_messages,  # type: ignore[arg-type]
                temperature=0.3,
                max_tokens=1600,
            )
            raw_content = completion.choices[0].message.content or ""
            clean_reply, recommended_ids = _parse_recommendations(raw_content)

            if not clean_reply:
                engine = "local-fallback"
                clean_reply, recommended_ids = build_local_sommelier_response(
                    clean_message, updated_memory
                )
        except Exception as exc:
            print(f"[Sommelier] Error llamando a Groq, usando fallback local: {exc}")
            engine = "local-fallback"
            clean_reply, recommended_ids = build_local_sommelier_response(
                clean_message, updated_memory
            )

    recommended_products: list[CoffeeProduct] = [
        COFFEE_BY_ID[pid] for pid in recommended_ids if pid in COFFEE_BY_ID
    ]

    _persist_sommelier_turn(
        session_id,
        stored_messages,
        updated_memory,
        clean_message,
        clean_reply,
        recommended_ids,
    )

    return SommelierResponse(
        success=True,
        reply=clean_reply,
        recommendedProductIds=recommended_ids,
        recommendedProducts=recommended_products,
        updatedMemory=updated_memory,
        engine=engine,
    )


async def stream_sommelier(
    message: str,
    history: list[HistoryMessage],
    prev_memory: UserPalateMemory | None = None,
    session_id: str | None = None,
) -> AsyncGenerator[str, None]:
    """Transmite la respuesta del Sommelier por SSE token por token."""
    clean_message, updated_memory, stored_messages, groq_messages = (
        _prepare_sommelier_context(message, history, prev_memory, session_id)
    )

    # Enviar inmediatamente la memoria sensorial detectada al cliente
    yield _sse_event(
        {
            "type": "memory",
            "updatedMemory": updated_memory.model_dump(),
        }
    )

    engine: Literal["groq", "local-fallback"] = "groq"
    clean_reply = ""
    recommended_ids: list[str] = []
    streamed_any_text = False

    if settings.GROQ_API_KEY:
        try:
            client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            stream = await client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=groq_messages,  # type: ignore[arg-type]
                temperature=0.3,
                max_tokens=1600,
                stream=True,
            )

            full_raw_parts: list[str] = []
            pending_buffer = ""

            async for chunk in stream:
                delta = chunk.choices[0].delta if chunk.choices else None
                piece = delta.content if delta and delta.content else ""
                if not piece:
                    continue

                full_raw_parts.append(piece)
                pending_buffer += piece
                safe_to_emit, pending_buffer = _split_stream_buffer(pending_buffer)
                if safe_to_emit:
                    streamed_any_text = True
                    yield _sse_event({"type": "delta", "content": safe_to_emit})

            raw_content = "".join(full_raw_parts)
            clean_reply, recommended_ids = _parse_recommendations(raw_content)

            # Emitir cualquier resto seguro no retenido como etiqueta
            if pending_buffer and not pending_buffer.upper().startswith(RECOMMENDED_PREFIX):
                streamed_any_text = True
                yield _sse_event({"type": "delta", "content": pending_buffer})

        except Exception as exc:
            print(f"[Sommelier Stream] Error llamando a Groq, usando fallback local: {exc}")
            engine = "local-fallback"
            clean_reply = ""
    else:
        engine = "local-fallback"

    # Si Groq falló o no devolvió texto, hacer streaming suave del motor adaptativo local
    if not clean_reply:
        engine = "local-fallback"
        clean_reply, recommended_ids = build_local_sommelier_response(
            clean_message, updated_memory
        )
        if not streamed_any_text:
            tokens = re.findall(r"\S+\s*", clean_reply)
            batch_size = 3
            for idx in range(0, len(tokens), batch_size):
                chunk_text = "".join(tokens[idx : idx + batch_size])
                yield _sse_event({"type": "delta", "content": chunk_text})
                await asyncio.sleep(0.02)

    recommended_products: list[CoffeeProduct] = [
        COFFEE_BY_ID[pid] for pid in recommended_ids if pid in COFFEE_BY_ID
    ]

    _persist_sommelier_turn(
        session_id,
        stored_messages,
        updated_memory,
        clean_message,
        clean_reply,
        recommended_ids,
    )

    yield _sse_event(
        {
            "type": "done",
            "success": True,
            "reply": clean_reply,
            "recommendedProductIds": recommended_ids,
            "recommendedProducts": [p.model_dump() for p in recommended_products],
            "updatedMemory": updated_memory.model_dump(),
            "engine": engine,
        }
    )


def evaluate_taste_quiz(
    method: BrewMethod,
    flavor: QuizFlavor,
    milk: MilkPreference,
    prev_memory: UserPalateMemory | None = None,
    session_id: str | None = None,
) -> QuizResponse:
    """Algoritmo multicriterio del Test de Paladar ejecutado en el backend."""
    base_memory = prev_memory.model_copy(deep=True) if prev_memory else UserPalateMemory()
    if session_id and not any(
        [
            base_memory.preferredMethod,
            base_memory.flavorPreference,
            base_memory.milkPreference,
            base_memory.lowAcidity,
        ]
    ):
        base_memory = get_session(session_id)["userMemory"]

    base_memory.preferredMethod = method
    base_memory.flavorPreference = flavor
    base_memory.milkPreference = milk
    base_memory.lastUpdated = datetime.now(timezone.utc).isoformat()

    scored: list[tuple[CoffeeProduct, int]] = []
    for product in COFFEE_PRODUCTS:
        score = 0

        # 1. Afinidad por familia de sabor
        if flavor == "decaf":
            if product.id == "sugarcane-decaf-caldas":
                score += 100
        elif flavor == "floral":
            if product.flavorCategory == "floral-citrico":
                score += 45
            if product.acidity >= 4:
                score += 10
        elif flavor == "frutal":
            if product.flavorCategory == "frutal-exotico":
                score += 45
            if product.id == "kenya-aa-nyeri":
                score += 25
        elif flavor == "chocolate":
            if product.flavorCategory == "chocolate-caramelo":
                score += 45
            if product.flavorCategory == "dulce-sedoso":
                score += 30

        # 2. Afinidad por método de extracción
        if method in product.recommendedBrews:
            score += 30

        if method == "Chemex" and product.id == "geisha-la-esmeralda":
            score += 12
        if method == "Aeropress" and product.id == "bourbon-rosado-huila":
            score += 15
        if method == "V60" and product.id == "kenya-aa-nyeri" and flavor == "floral":
            score += 10

        # 3. Afinidad por leche vs café negro
        if milk == "con-leche":
            if product.body >= 4:
                score += 20
            if product.id == "pacamara-black-honey-dipilto":
                score += 25
            if product.id == "sugarcane-decaf-caldas":
                score += 15
            if product.roastLevel == "Ligero":
                score -= 15
        else:
            if product.scaScore >= 89:
                score += 12

        scored.append((product, score))

    scored.sort(key=lambda pair: pair[1], reverse=True)
    winner, top_score = scored[0]
    runner_up = scored[1][0] if len(scored) > 1 else None
    match_score = round(min(99.4, max(92.0, 86.0 + (top_score / 100) * 12.5)), 1)

    if session_id:
        save_session(session_id, base_memory, None)

    return QuizResponse(
        success=True,
        matchScore=match_score,
        winner=winner,
        runnerUp=runner_up,
        recommendedGrind=get_default_grind_for_method(method),
        updatedMemory=base_memory,
    )
