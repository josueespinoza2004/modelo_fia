export type RoastLevel = 'Ligero' | 'Medio-Ligero' | 'Medio' | 'Medio-Oscuro' | 'Oscuro';

export type BrewMethod = 'V60' | 'Chemex' | 'Aeropress' | 'Espresso' | 'Prensa Francesa' | 'Moka';

export type FlavorCategory = 'floral-citrico' | 'chocolate-caramelo' | 'frutal-exotico' | 'dulce-sedoso';

export interface CoffeeProduct {
  id: string;
  name: string;
  subtitle: string;
  origin: string;
  country: string;
  region: string;
  farm: string;
  producer: string;
  altitude: string;
  variety: string;
  process: string;
  roastLevel: RoastLevel;
  scaScore: number;
  tastingNotes: string[];
  flavorCategory: FlavorCategory;
  aromaIntensity: number; // 1-5
  acidity: number; // 1-5
  body: number; // 1-5
  sweetness: number; // 1-5
  recommendedBrews: BrewMethod[];
  price: number;
  weightGrams: number;
  description: string;
  sommelierQuote: string;
  inStock: boolean;
  featured?: boolean;
  image: string;
}

export interface BrewingGuide {
  id: BrewMethod;
  name: string;
  tagline: string;
  ratio: string;
  ratioMultiplier: number;
  grind: string;
  waterTemp: string;
  brewTime: string;
  recommendedCoffees: string[];
  tips: string;
}

export interface CartItem {
  product: CoffeeProduct;
  quantity: number;
  grindOption:
    | 'Grano Entero'
    | 'Molienda Fina (Espresso)'
    | 'Molienda Media (V60 / Filtro)'
    | 'Molienda Gruesa (Prensa Francesa)';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  recommendedProductIds?: string[];
  recommendedProducts?: CoffeeProduct[];
  suggestedQuestions?: string[];
}

export interface QuizAnswer {
  preparationMethod?: BrewMethod;
  flavorPreference?: 'frutal' | 'chocolate' | 'floral' | 'intenso';
  milkPreference?: 'solo' | 'con-leche' | 'ambos';
}

export interface UserPalateMemory {
  preferredMethod?: BrewMethod;
  flavorPreference?: 'floral' | 'frutal' | 'chocolate' | 'decaf';
  milkPreference?: 'solo' | 'con-leche';
  lowAcidity?: boolean;
  consultedCoffees?: string[];
  lastUpdated?: string;
}

export interface SommelierChatResponse {
  success: boolean;
  reply?: string;
  recommendedProductIds?: string[];
  recommendedProducts?: CoffeeProduct[];
  updatedMemory?: UserPalateMemory;
  engine?: 'groq' | 'local-fallback';
  error?: string;
}

export interface QuizEvaluationResponse {
  success: boolean;
  matchScore: number;
  winner: CoffeeProduct;
  runnerUp?: CoffeeProduct | null;
  recommendedGrind: CartItem['grindOption'];
  updatedMemory: UserPalateMemory;
}

export interface RatioCalculationResponse {
  success: boolean;
  method: BrewMethod;
  coffeeGrams: number;
  waterMl: number;
  bloomMl: number;
  ratioMultiplier: number;
  waterTemp: string;
  brewTime: string;
  grind: string;
}

export interface CouponValidationResponse {
  success: boolean;
  valid: boolean;
  code?: string | null;
  discountRate: number;
  discountAmount: number;
  message: string;
}

export interface OrderConfirmationResponse {
  success: boolean;
  orderNumber?: string;
  email?: string;
  subtotal?: number;
  discountAmount?: number;
  shippingCost?: number;
  total?: number;
  freeShippingApplied?: boolean;
  roastDate?: string;
  estimatedDispatch?: string;
  error?: string;
}

export interface NewsletterResponse {
  success: boolean;
  message?: string;
  couponCode?: string;
  error?: string;
}
