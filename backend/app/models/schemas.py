from typing import Literal, Optional
from pydantic import BaseModel, Field

RoastLevel = Literal["Ligero", "Medio-Ligero", "Medio", "Medio-Oscuro", "Oscuro"]
BrewMethod = Literal["V60", "Chemex", "Aeropress", "Espresso", "Prensa Francesa", "Moka"]
FlavorCategory = Literal[
    "floral-citrico", "chocolate-caramelo", "frutal-exotico", "dulce-sedoso"
]
GrindOption = Literal[
    "Grano Entero",
    "Molienda Fina (Espresso)",
    "Molienda Media (V60 / Filtro)",
    "Molienda Gruesa (Prensa Francesa)",
]
QuizFlavor = Literal["floral", "frutal", "chocolate", "decaf"]
MilkPreference = Literal["solo", "con-leche"]


class CoffeeProduct(BaseModel):
    id: str
    name: str
    subtitle: str
    origin: str
    country: str
    region: str
    farm: str
    producer: str
    altitude: str
    variety: str
    process: str
    roastLevel: RoastLevel
    scaScore: float
    tastingNotes: list[str]
    flavorCategory: FlavorCategory
    aromaIntensity: int
    acidity: int
    body: int
    sweetness: int
    recommendedBrews: list[BrewMethod]
    price: float
    weightGrams: int
    description: str
    sommelierQuote: str
    inStock: bool = True
    featured: bool = False
    image: str


class BrewingGuide(BaseModel):
    id: BrewMethod
    name: str
    tagline: str
    ratio: str
    ratioMultiplier: int
    grind: str
    waterTemp: str
    brewTime: str
    recommendedCoffees: list[str]
    tips: str


class UserPalateMemory(BaseModel):
    preferredMethod: Optional[BrewMethod] = None
    flavorPreference: Optional[QuizFlavor] = None
    milkPreference: Optional[MilkPreference] = None
    lowAcidity: Optional[bool] = None
    consultedCoffees: list[str] = Field(default_factory=list)
    lastUpdated: Optional[str] = None


class HistoryMessage(BaseModel):
    role: str
    content: str = ""


class SommelierRequest(BaseModel):
    message: Optional[str] = None
    history: list[HistoryMessage] = Field(default_factory=list)
    userMemory: UserPalateMemory = Field(default_factory=UserPalateMemory)
    sessionId: Optional[str] = None


class SommelierResponse(BaseModel):
    success: bool = True
    reply: str
    recommendedProductIds: list[str] = Field(default_factory=list)
    recommendedProducts: list[CoffeeProduct] = Field(default_factory=list)
    updatedMemory: UserPalateMemory
    engine: Literal["groq", "local-fallback"] = "groq"


class QuizRequest(BaseModel):
    method: BrewMethod
    flavor: QuizFlavor
    milk: MilkPreference
    sessionId: Optional[str] = None
    userMemory: UserPalateMemory = Field(default_factory=UserPalateMemory)


class QuizResponse(BaseModel):
    success: bool = True
    matchScore: float
    winner: CoffeeProduct
    runnerUp: Optional[CoffeeProduct] = None
    recommendedGrind: GrindOption
    updatedMemory: UserPalateMemory


class CatalogCoffeesResponse(BaseModel):
    success: bool = True
    products: list[CoffeeProduct]
    total: int


class CatalogCoffeeDetailResponse(BaseModel):
    success: bool = True
    product: CoffeeProduct


class CatalogGuidesResponse(BaseModel):
    success: bool = True
    guides: list[BrewingGuide]


class RatioCalculationRequest(BaseModel):
    method: BrewMethod
    coffeeGrams: int = Field(ge=5, le=100)


class RatioCalculationResponse(BaseModel):
    success: bool = True
    method: BrewMethod
    coffeeGrams: int
    waterMl: int
    bloomMl: int
    ratioMultiplier: int
    waterTemp: str
    brewTime: str
    grind: str


class CouponValidateRequest(BaseModel):
    code: str
    subtotal: float = 0.0


class CouponValidateResponse(BaseModel):
    success: bool
    valid: bool
    code: Optional[str] = None
    discountRate: float = 0.0
    discountAmount: float = 0.0
    message: str


class OrderItemInput(BaseModel):
    productId: str
    quantity: int = Field(ge=1, le=50)
    grindOption: GrindOption = "Grano Entero"


class OrderRequest(BaseModel):
    email: str
    items: list[OrderItemInput] = Field(min_length=1)
    couponCode: Optional[str] = None


class OrderResponse(BaseModel):
    success: bool = True
    orderNumber: str
    email: str
    subtotal: float
    discountAmount: float
    shippingCost: float
    total: float
    freeShippingApplied: bool
    roastDate: str
    estimatedDispatch: str


class NewsletterRequest(BaseModel):
    email: str


class NewsletterResponse(BaseModel):
    success: bool = True
    message: str
    couponCode: str

