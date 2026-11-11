from fastapi import APIRouter, HTTPException, Query

from app.data.catalog import BREWING_GUIDES, COFFEE_BY_ID
from app.models.schemas import (
    CatalogCoffeeDetailResponse,
    CatalogCoffeesResponse,
    CatalogGuidesResponse,
    RatioCalculationRequest,
    RatioCalculationResponse,
)
from app.services.commerce_service import calculate_brew_ratio, filter_coffees

router = APIRouter(prefix="/api/catalog", tags=["Catálogo & Guías"])


@router.get("/coffees", response_model=CatalogCoffeesResponse)
def list_coffees(
    category: str = Query(default="todos"),
    method: str = Query(default="todos"),
    search: str = Query(default=""),
    sort: str = Query(default="featured"),
):
    products = filter_coffees(
        category=category,
        method=method,
        search=search,
        sort=sort,
    )
    return CatalogCoffeesResponse(
        success=True,
        products=products,
        total=len(products),
    )


@router.get("/coffees/{coffee_id}", response_model=CatalogCoffeeDetailResponse)
def get_coffee_detail(coffee_id: str):
    product = COFFEE_BY_ID.get(coffee_id)
    if not product:
        raise HTTPException(status_code=404, detail="Microlote no encontrado")
    return CatalogCoffeeDetailResponse(success=True, product=product)


@router.get("/guides", response_model=CatalogGuidesResponse)
def list_brewing_guides():
    return CatalogGuidesResponse(success=True, guides=BREWING_GUIDES)


@router.post("/guides/calculate", response_model=RatioCalculationResponse)
def calculate_ratio(payload: RatioCalculationRequest):
    return calculate_brew_ratio(
        method=payload.method,
        coffee_grams=payload.coffeeGrams,
    )

