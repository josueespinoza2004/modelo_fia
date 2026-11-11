import {
  BrewingGuide,
  BrewMethod,
  CartItem,
  CoffeeProduct,
  CouponValidationResponse,
  FlavorCategory,
  NewsletterResponse,
  OrderConfirmationResponse,
  QuizEvaluationResponse,
  RatioCalculationResponse,
  SommelierChatResponse,
  UserPalateMemory,
} from '@/types/coffee';

export interface CatalogQueryParams {
  category?: FlavorCategory | 'todos';
  method?: BrewMethod | 'todos';
  search?: string;
  sort?: 'featured' | 'sca-desc' | 'price-asc' | 'price-desc';
}

export async function fetchCoffees(
  params: CatalogQueryParams = {}
): Promise<CoffeeProduct[]> {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.method) query.set('method', params.method);
  if (params.search) query.set('search', params.search);
  if (params.sort) query.set('sort', params.sort);

  const qs = query.toString();
  const res = await fetch(`/api/catalog/coffees${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    throw new Error('No se pudo cargar el catálogo desde el servidor');
  }
  const data = await res.json();
  return data.products || [];
}

export async function fetchBrewingGuides(): Promise<BrewingGuide[]> {
  const res = await fetch('/api/catalog/guides');
  if (!res.ok) {
    throw new Error('No se pudieron cargar las guías de extracción');
  }
  const data = await res.json();
  return data.guides || [];
}

export async function calculateBrewRatio(
  method: BrewMethod,
  coffeeGrams: number
): Promise<RatioCalculationResponse> {
  const res = await fetch('/api/catalog/guides/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, coffeeGrams }),
  });
  if (!res.ok) {
    throw new Error('Error calculando el ratio en el servidor');
  }
  return res.json();
}

export async function sendSommelierChat(payload: {
  message: string;
  history: Array<{ role: string; content: string }>;
  userMemory: UserPalateMemory;
  sessionId?: string;
}): Promise<SommelierChatResponse> {
  const res = await fetch('/api/sommelier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function submitTasteQuiz(payload: {
  method: BrewMethod;
  flavor: 'floral' | 'frutal' | 'chocolate' | 'decaf';
  milk: 'solo' | 'con-leche';
  userMemory: UserPalateMemory;
  sessionId?: string;
}): Promise<QuizEvaluationResponse> {
  const res = await fetch('/api/sommelier/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Error evaluando el Test de Paladar');
  }
  return res.json();
}

export async function fetchSommelierSession(sessionId: string): Promise<{
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    recommendedProductIds?: string[];
  }>;
  userMemory: UserPalateMemory;
}> {
  const res = await fetch(`/api/sommelier/session/${encodeURIComponent(sessionId)}`);
  if (!res.ok) {
    throw new Error('No se pudo cargar la sesión del sommelier');
  }
  return res.json();
}

export async function resetSommelierSessionChat(sessionId: string): Promise<void> {
  await fetch(`/api/sommelier/session/${encodeURIComponent(sessionId)}/chat`, {
    method: 'DELETE',
  });
}

export async function forgetSommelierSessionMemory(sessionId: string): Promise<void> {
  await fetch(`/api/sommelier/session/${encodeURIComponent(sessionId)}/memory`, {
    method: 'DELETE',
  });
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<CouponValidationResponse> {
  const res = await fetch('/api/commerce/coupons/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, subtotal }),
  });
  return res.json();
}

export async function submitOrder(payload: {
  email: string;
  items: Array<{
    productId: string;
    quantity: number;
    grindOption: CartItem['grindOption'];
  }>;
  couponCode?: string | null;
}): Promise<OrderConfirmationResponse> {
  const res = await fetch('/api/commerce/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function subscribeNewsletter(email: string): Promise<NewsletterResponse> {
  const res = await fetch('/api/commerce/newsletter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

