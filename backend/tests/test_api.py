from pathlib import Path
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.database import init_db
from app.main import app


@pytest.fixture(autouse=True)
def isolated_db(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    db_file = tmp_path / "test_aura.db"
    monkeypatch.setattr(settings, "DATABASE_PATH", db_file)
    init_db(db_file)
    yield


def test_healthcheck():
    with TestClient(app) as client:
        res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"


def test_catalog_coffees_and_filters():
    with TestClient(app) as client:
        res = client.get("/api/catalog/coffees")
        assert res.status_code == 200
        assert res.json()["total"] == 6

        floral = client.get("/api/catalog/coffees?category=floral-citrico&sort=sca-desc")
        assert floral.status_code == 200
        products = floral.json()["products"]
        assert len(products) == 2
        assert products[0]["id"] == "geisha-la-esmeralda"

        search = client.get("/api/catalog/coffees?search=Jazmín")
        assert search.status_code == 200
        assert search.json()["total"] == 1
        assert search.json()["products"][0]["id"] == "geisha-la-esmeralda"

        missing = client.get("/api/catalog/coffees/no-existe")
        assert missing.status_code == 404


def test_brewing_guides_and_ratio_calculator():
    with TestClient(app) as client:
        res = client.get("/api/catalog/guides")
        assert res.status_code == 200
        assert len(res.json()["guides"]) == 5

        calc = client.post(
            "/api/catalog/guides/calculate",
            json={"method": "V60", "coffeeGrams": 20},
        )
        assert calc.status_code == 200
        data = calc.json()
        assert data["waterMl"] == 320
        assert data["bloomMl"] == 50
        assert data["ratioMultiplier"] == 16


def test_sommelier_validation_and_empty_message():
    with TestClient(app) as client:
        res = client.post("/api/sommelier", json={"message": "   "})
        assert res.status_code == 400
        assert res.json()["success"] is False


def test_sommelier_memory_and_fallback_resilience(monkeypatch: pytest.MonkeyPatch):
    # Forzar motor adaptativo local sin depender de red en pruebas unitarias
    monkeypatch.setattr(settings, "GROQ_API_KEY", "")

    with TestClient(app) as client:
        # Escenario 1: V60 + gastritis
        res1 = client.post(
            "/api/sommelier",
            json={
                "sessionId": "test-session-1",
                "message": "Hola Don Aurelio, tengo cafetera V60 pero sufro de gastritis leve, ¿qué café no sea ácido?",
            },
        )
        assert res1.status_code == 200
        d1 = res1.json()
        assert d1["engine"] == "local-fallback"
        assert d1["updatedMemory"]["preferredMethod"] == "V60"
        assert d1["updatedMemory"]["lowAcidity"] is True
        assert "sugarcane-decaf-caldas" in d1["recommendedProductIds"]

        # Escenario 2: Multi-turno recordando V60 sin repetirlo
        res2 = client.post(
            "/api/sommelier",
            json={
                "sessionId": "test-session-1",
                "message": "¿Y qué tal me iría con el Bourbon Rosado?",
            },
        )
        assert res2.status_code == 200
        d2 = res2.json()
        assert d2["updatedMemory"]["preferredMethod"] == "V60"
        assert d2["updatedMemory"]["lowAcidity"] is True
        assert "bourbon-rosado-huila" in d2["updatedMemory"]["consultedCoffees"]
        assert "V60" in d2["reply"]

        # Recuperar sesión de SQLite
        session_res = client.get("/api/sommelier/session/test-session-1")
        assert session_res.status_code == 200
        assert len(session_res.json()["messages"]) == 4

        # Olvidar memoria
        del_mem = client.delete("/api/sommelier/session/test-session-1/memory")
        assert del_mem.status_code == 200
        after = client.get("/api/sommelier/session/test-session-1").json()
        assert after["userMemory"]["preferredMethod"] is None


def test_taste_quiz_backend():
    with TestClient(app) as client:
        res = client.post(
            "/api/sommelier/quiz",
            json={
                "method": "Aeropress",
                "flavor": "frutal",
                "milk": "solo",
                "sessionId": "quiz-session",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["winner"]["id"] == "bourbon-rosado-huila"
        assert data["recommendedGrind"] == "Molienda Media (V60 / Filtro)"
        assert data["updatedMemory"]["preferredMethod"] == "Aeropress"


def test_commerce_coupon_order_and_newsletter():
    with TestClient(app) as client:
        bad = client.post(
            "/api/commerce/coupons/validate",
            json={"code": "NOEXISTE", "subtotal": 40},
        )
        assert bad.status_code == 400
        assert bad.json()["valid"] is False

        good = client.post(
            "/api/commerce/coupons/validate",
            json={"code": "aura15", "subtotal": 40},
        )
        assert good.status_code == 200
        assert good.json()["discountAmount"] == 6.0

        order = client.post(
            "/api/commerce/orders",
            json={
                "email": "catador@ejemplo.com",
                "couponCode": "AURA15",
                "items": [
                    {
                        "productId": "geisha-la-esmeralda",
                        "quantity": 2,
                        "grindOption": "Molienda Media (V60 / Filtro)",
                    }
                ],
            },
        )
        assert order.status_code == 200
        o = order.json()
        assert o["orderNumber"].startswith("#AURA-2026-")
        assert o["subtotal"] == 68.0
        assert o["discountAmount"] == 10.2
        assert o["shippingCost"] == 0.0
        assert o["freeShippingApplied"] is True
        assert o["total"] == 57.8

        news = client.post(
            "/api/commerce/newsletter",
            json={"email": "catador@ejemplo.com"},
        )
        assert news.status_code == 200
        assert news.json()["couponCode"] == "AURA15"

