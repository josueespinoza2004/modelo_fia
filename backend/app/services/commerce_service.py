import re
import secrets

from app.data.catalog import (
    BREWING_GUIDES,
    COFFEE_BY_ID,
    COFFEE_PRODUCTS,
    COUPONS,
    FREE_SHIPPING_THRESHOLD,
    GUIDE_BY_ID,
    STANDARD_SHIPPING_COST,
)
from app.database import save_order, save_subscriber
from app.models.schemas import (
    BrewMethod,
    CoffeeProduct,
    CouponValidateResponse,
    NewsletterResponse,
    OrderRequest,
    OrderResponse,
    RatioCalculationResponse,
)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def filter_coffees(
    category: str = "todos",
    method: str = "todos",
    search: str = "",
    sort: str = "featured",
) -> list[CoffeeProduct]:
    q = search.strip().lower()
    filtered: list[CoffeeProduct] = []

    for product in COFFEE_PRODUCTS:
        if category != "todos" and product.flavorCategory != category:
            continue
        if method != "todos" and method not in product.recommendedBrews:
            continue
        if q:
            haystack = [
                product.name.lower(),
                product.country.lower(),
                product.origin.lower(),
                product.variety.lower(),
                *(note.lower() for note in product.tastingNotes),
            ]
            if not any(q in field for field in haystack):
                continue
        filtered.append(product)

    if sort == "sca-desc":
        filtered.sort(key=lambda p: p.scaScore, reverse=True)
    elif sort == "price-asc":
        filtered.sort(key=lambda p: p.price)
    elif sort == "price-desc":
        filtered.sort(key=lambda p: p.price, reverse=True)
    else:
        filtered.sort(key=lambda p: (not p.featured, -p.scaScore))

    return filtered


def calculate_brew_ratio(
    method: BrewMethod, coffee_grams: int
) -> RatioCalculationResponse:
    guide = GUIDE_BY_ID.get(method) or BREWING_GUIDES[0]
    ratio_multiplier = guide.ratioMultiplier
    water_ml = round(coffee_grams * ratio_multiplier)
    bloom_ml = round(coffee_grams * 2.5) if method != "Espresso" else 0

    return RatioCalculationResponse(
        success=True,
        method=method,
        coffeeGrams=coffee_grams,
        waterMl=water_ml,
        bloomMl=bloom_ml,
        ratioMultiplier=ratio_multiplier,
        waterTemp=guide.waterTemp,
        brewTime=guide.brewTime,
        grind=guide.grind,
    )


def validate_coupon(code: str, subtotal: float = 0.0) -> CouponValidateResponse:
    normalized = code.strip().upper()
    rate = COUPONS.get(normalized)
    if rate is None:
        return CouponValidateResponse(
            success=False,
            valid=False,
            code=normalized or None,
            discountRate=0.0,
            discountAmount=0.0,
            message="Cupón inválido (prueba con AURA15)",
        )

    discount_amount = round(max(0.0, subtotal) * rate, 2)
    return CouponValidateResponse(
        success=True,
        valid=True,
        code=normalized,
        discountRate=rate,
        discountAmount=discount_amount,
        message=f"Cupón {normalized} aplicado ({int(rate * 100)}% de descuento)",
    )


def process_order(order_req: OrderRequest) -> OrderResponse:
    email = order_req.email.strip()
    if not EMAIL_REGEX.match(email):
        raise ValueError("Correo electrónico inválido")

    subtotal = 0.0
    resolved_items: list[dict] = []

    for item in order_req.items:
        product = COFFEE_BY_ID.get(item.productId)
        if not product:
            raise ValueError(f"Producto no encontrado: {item.productId}")
        line_total = round(product.price * item.quantity, 2)
        subtotal += line_total
        resolved_items.append(
            {
                "productId": product.id,
                "name": product.name,
                "quantity": item.quantity,
                "unitPrice": product.price,
                "grindOption": item.grindOption,
                "lineTotal": line_total,
            }
        )

    subtotal = round(subtotal, 2)
    discount_amount = 0.0
    applied_coupon: str | None = None

    if order_req.couponCode:
        coupon_res = validate_coupon(order_req.couponCode, subtotal)
        if coupon_res.valid and coupon_res.code:
            applied_coupon = coupon_res.code
            discount_amount = coupon_res.discountAmount

    subtotal_after_discount = round(max(0.0, subtotal - discount_amount), 2)
    free_shipping = subtotal_after_discount >= FREE_SHIPPING_THRESHOLD
    shipping_cost = 0.0 if free_shipping else STANDARD_SHIPPING_COST
    total = round(subtotal_after_discount + shipping_cost, 2)

    order_suffix = secrets.token_hex(2).upper()
    order_number = f"#AURA-2026-{order_suffix}"

    save_order(
        order_number=order_number,
        email=email,
        items=resolved_items,
        coupon_code=applied_coupon,
        subtotal=subtotal,
        discount_amount=discount_amount,
        shipping_cost=shipping_cost,
        total=total,
    )

    return OrderResponse(
        success=True,
        orderNumber=order_number,
        email=email,
        subtotal=subtotal,
        discountAmount=discount_amount,
        shippingCost=shipping_cost,
        total=total,
        freeShippingApplied=free_shipping,
        roastDate="Esta semana (Frescura pico < 72h)",
        estimatedDispatch="48 horas hábiles",
    )


def register_newsletter(email: str) -> NewsletterResponse:
    clean_email = email.strip()
    if not EMAIL_REGEX.match(clean_email):
        raise ValueError("Correo electrónico inválido")

    save_subscriber(clean_email)
    return NewsletterResponse(
        success=True,
        message="¡Bienvenido al Club de Catadores AURA!",
        couponCode="AURA15",
    )

