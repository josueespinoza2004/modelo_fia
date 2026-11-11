from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.models.schemas import (
    CouponValidateRequest,
    CouponValidateResponse,
    NewsletterRequest,
    NewsletterResponse,
    OrderRequest,
    OrderResponse,
)
from app.services.commerce_service import (
    process_order,
    register_newsletter,
    validate_coupon,
)

router = APIRouter(prefix="/api/commerce", tags=["Comercio & Pedidos"])


@router.post("/coupons/validate", response_model=CouponValidateResponse)
def check_coupon(payload: CouponValidateRequest):
    result = validate_coupon(code=payload.code, subtotal=payload.subtotal)
    if not result.valid:
        return JSONResponse(status_code=400, content=result.model_dump())
    return result


@router.post("/orders", response_model=OrderResponse)
def create_order(payload: OrderRequest):
    try:
        return process_order(payload)
    except ValueError as exc:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": str(exc)},
        )


@router.post("/newsletter", response_model=NewsletterResponse)
def subscribe_newsletter(payload: NewsletterRequest):
    try:
        return register_newsletter(payload.email)
    except ValueError as exc:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": str(exc)},
        )

