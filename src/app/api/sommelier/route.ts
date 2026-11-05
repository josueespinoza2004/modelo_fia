import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { COFFEE_PRODUCTS } from '@/data/coffeeCatalog';
import { UserPalateMemory } from '@/types/coffee';

// Inicializar cliente Groq con la API key de entorno
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// Catálogo condensado con perfil sensorial completo
const CATALOG_CONTEXT = COFFEE_PRODUCTS.map((c) => ({
  id: c.id,
  nombre: c.name,
  origen: `${c.origin}, ${c.country}`,
  finca: `${c.farm} (Productor: ${c.producer})`,
  altura: c.altitude,
  variedad: c.variety,
  proceso: c.process,
  tueste: c.roastLevel,
  sca: c.scaScore,
  sensorial: `Aroma ${c.aromaIntensity}/5, Acidez ${c.acidity}/5, Cuerpo ${c.body}/5, Dulzura ${c.sweetness}/5`,
  notas_cata: c.tastingNotes.join(', '),
  metodos_ideales: c.recommendedBrews.join(', '),
  precio: `$${c.price.toFixed(2)} USD (250g)`,
  cita: c.sommelierQuote,
}))
  .map(
    (c) =>
      `- ID: ${c.id} | ${c.nombre} (${c.origen}, ${c.altura}) | Finca: ${c.finca} | Variedad: ${c.variedad} | Proceso: ${c.proceso} | Tueste: ${c.tueste} | SCA: ${c.sca} pts | Perfil: ${c.sensorial} | Notas: ${c.notas_cata} | Métodos: ${c.metodos_ideales} | Precio: ${c.precio}`
  )
  .join('\n');

/**
 * Extrae y actualiza la Memoria Sensorial del Usuario a partir de su mensaje en lenguaje natural.
 * Permite que el agente recuerde método, preferencia de sabor, leche y sensibilidad gástrica entre turnos.
 */
export function extractAndMergeMemory(
  message: string,
  prevMemory: UserPalateMemory = {}
): UserPalateMemory {
  const q = message.toLowerCase();
  const next: UserPalateMemory = {
    ...prevMemory,
    consultedCoffees: [...(prevMemory.consultedCoffees || [])],
  };

  // 1. Detectar método de preparación
  if (q.includes('v60') || q.includes('filtro') || q.includes('goteo')) {
    next.preferredMethod = 'V60';
  } else if (q.includes('chemex')) {
    next.preferredMethod = 'Chemex';
  } else if (q.includes('aeropress')) {
    next.preferredMethod = 'Aeropress';
  } else if (q.includes('espresso') || q.includes('expreso')) {
    next.preferredMethod = 'Espresso';
  } else if (q.includes('moka') || q.includes('italiana')) {
    next.preferredMethod = 'Moka';
  } else if (q.includes('prensa') || q.includes('francesa')) {
    next.preferredMethod = 'Prensa Francesa';
  }

  // 2. Detectar preferencia de sabor
  if (
    q.includes('descafeinado') ||
    q.includes('decaf') ||
    q.includes('sin cafeína') ||
    q.includes('sin cafeina') ||
    q.includes('insomnio') ||
    q.includes('dormir') ||
    q.includes('noche')
  ) {
    next.flavorPreference = 'decaf';
  } else if (
    q.includes('floral') ||
    q.includes('jazmín') ||
    q.includes('jazmin') ||
    q.includes('bergamota') ||
    q.includes('cítrico') ||
    q.includes('citrico')
  ) {
    next.flavorPreference = 'floral';
  } else if (
    q.includes('frutal') ||
    q.includes('fruta') ||
    q.includes('arándano') ||
    q.includes('arandano') ||
    q.includes('frambuesa') ||
    q.includes('exótico') ||
    q.includes('exotico')
  ) {
    next.flavorPreference = 'frutal';
  } else if (
    q.includes('chocolate') ||
    q.includes('cacao') ||
    q.includes('panela') ||
    q.includes('caramelo') ||
    q.includes('intenso')
  ) {
    next.flavorPreference = 'chocolate';
  }

  // 3. Detectar preferencia de leche vs café negro
  if (
    q.includes('con leche') ||
    q.includes('latte') ||
    q.includes('capuchino') ||
    q.includes('cappuccino') ||
    q.includes('avena') ||
    q.includes('almendra') ||
    q.includes('vegetal')
  ) {
    next.milkPreference = 'con-leche';
  } else if (
    q.includes('sin leche') ||
    q.includes('café negro') ||
    q.includes('cafe negro') ||
    q.includes('puro') ||
    q.includes('tomo solo')
  ) {
    next.milkPreference = 'solo';
  }

  // 4. Detectar sensibilidad a la acidez / gastritis
  if (
    q.includes('reflujo') ||
    q.includes('gastritis') ||
    q.includes('estómago') ||
    q.includes('estomago') ||
    q.includes('no sea ácido') ||
    q.includes('no sea acido') ||
    q.includes('baja acidez') ||
    q.includes('poca acidez')
  ) {
    next.lowAcidity = true;
  }

  // 5. Registrar cafés consultados explícitamente
  for (const coffee of COFFEE_PRODUCTS) {
    if (
      q.includes(coffee.name.toLowerCase()) ||
      q.includes(coffee.id.replace(/-/g, ' ')) ||
      (q.includes('geisha') && coffee.id === 'geisha-la-esmeralda') ||
      (q.includes('bourbon') && coffee.id === 'bourbon-rosado-huila') ||
      (q.includes('yirgacheffe') && coffee.id === 'yirgacheffe-heirloom') ||
      (q.includes('pacamara') && coffee.id === 'pacamara-black-honey-dipilto') ||
      (q.includes('kenya') && coffee.id === 'kenya-aa-nyeri') ||
      ((q.includes('roble') || q.includes('sugarcane')) && coffee.id === 'sugarcane-decaf-caldas')
    ) {
      if (!next.consultedCoffees?.includes(coffee.id)) {
        next.consultedCoffees?.push(coffee.id);
      }
    }
  }

  next.lastUpdated = new Date().toISOString();
  return next;
}

function formatMemoryForPrompt(memory: UserPalateMemory): string {
  const traits: string[] = [];
  if (memory.preferredMethod) traits.push(`Método preferido: ${memory.preferredMethod}`);
  if (memory.flavorPreference) traits.push(`Perfil de sabor favorito: ${memory.flavorPreference}`);
  if (memory.milkPreference) {
    traits.push(
      `Preferencia de servicio: ${memory.milkPreference === 'con-leche' ? 'Con leche / bebida vegetal' : 'Café negro puro'}`
    );
  }
  if (memory.lowAcidity) traits.push(`Condición especial: Prefiere baja acidez / cuidado estomacal`);
  if (memory.consultedCoffees && memory.consultedCoffees.length > 0) {
    traits.push(`Granos ya consultados: ${memory.consultedCoffees.join(', ')}`);
  }
  return traits.length > 0
    ? `MEMORIA ADAPTATIVA DEL CLIENTE (Usa estos datos recordados de turnos anteriores para personalizar tu respuesta sin volver a preguntarlos):\n- ${traits.join('\n- ')}`
    : 'MEMORIA ADAPTATIVA DEL CLIENTE: Aún no se conocen preferencias previas del cliente.';
}

function buildSystemPrompt(memory: UserPalateMemory): string {
  return `
Eres "Don Aurelio", Maestro Sommelier de Café, Licenciado Q-Grader y Director de Tueste de la tostaduría boutique "AURA Coffee Roasters".
Tu pasión es educar el paladar de las personas y conectarlas con el café de especialidad perfecto para su momento, gusto sensorial y método de extracción.

${formatMemoryForPrompt(memory)}

REGLAS DE INTERACCIÓN:
1. Hablas en español con un tono cálido, distinguido, sensorial y apasionado (como un barista sabio y cercano en una barra de especialidad).
2. Tienes acceso al catálogo exclusivo de AURA Coffee Roasters. Usa SOLO estos cafés al recomendar granos:
${CATALOG_CONTEXT}

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
`;
}

function buildLocalSommelierResponse(
  query: string,
  memory: UserPalateMemory
): {
  reply: string;
  recommendedProductIds: string[];
} {
  const q = query.toLowerCase();
  const methodNote = memory.preferredMethod
    ? `Recordando que preparas en **${memory.preferredMethod}**, `
    : '';

  // 1. Si pregunta por un café específico del catálogo
  const matchedCoffee = COFFEE_PRODUCTS.find(
    (c) =>
      q.includes(c.name.toLowerCase()) ||
      q.includes(c.id.replace(/-/g, ' ')) ||
      (q.includes('geisha') && c.id === 'geisha-la-esmeralda') ||
      (q.includes('bourbon') && c.id === 'bourbon-rosado-huila') ||
      (q.includes('yirgacheffe') && c.id === 'yirgacheffe-heirloom') ||
      (q.includes('pacamara') && c.id === 'pacamara-black-honey-dipilto') ||
      (q.includes('kenya') && c.id === 'kenya-aa-nyeri') ||
      ((q.includes('roble') || q.includes('sugarcane')) && c.id === 'sugarcane-decaf-caldas')
  );

  if (matchedCoffee) {
    const targetMethod = memory.preferredMethod || matchedCoffee.recommendedBrews[0];
    return {
      reply: `¡Excelente elección fijarte en nuestro **${matchedCoffee.name}** (${matchedCoffee.origin}, ${matchedCoffee.country})! Es un lote cultivado a ${matchedCoffee.altitude} en **${matchedCoffee.farm}** por ${matchedCoffee.producer}, con una puntuación de **${matchedCoffee.scaScore} puntos SCA**.\n\nEn taza despliega notas vibrantes de **${matchedCoffee.tastingNotes.join(', ')}**, gracias a su proceso *${matchedCoffee.process}* y su tueste ${matchedCoffee.roastLevel.toLowerCase()} (Acidez ${matchedCoffee.acidity}/5, Cuerpo ${matchedCoffee.body}/5, Dulzura ${matchedCoffee.sweetness}/5).\n\n- **Consejo personalizado:** ${methodNote}te sugiero extraerlo en **${targetMethod}** con agua a 92°C y pre-infusión de 40 segundos para despertar todos sus compuestos aromáticos.`,
      recommendedProductIds: [matchedCoffee.id],
    };
  }

  // 2. Gastritis / baja acidez / descafeinado (por mensaje actual o por memoria previa)
  if (
    q.includes('reflujo') ||
    q.includes('gastritis') ||
    q.includes('estómago') ||
    q.includes('estomago') ||
    q.includes('no sea ácido') ||
    q.includes('no sea acido') ||
    q.includes('baja acidez') ||
    q.includes('noche') ||
    q.includes('descafeinado') ||
    memory.lowAcidity ||
    memory.flavorPreference === 'decaf'
  ) {
    return {
      reply: `${methodNote}teniendo en cuenta tu preferencia por un perfil de **baja acidez y amable con el estómago**, te recomiendo estos dos microlotes de dulzura sedosa:\n\n- **Decaf Sugarcane El Roble (Acidez 2/5):** Descafeinado natural con caña de azúcar de Caldas, Colombia. Cero irritación y notas cremosas a **toffee, vainilla tostada y almendra**.\n- **Pacamara Black Honey Reserva (Acidez 3/5):** Proceso 100% mucílago preservado con un cuerpo licoroso (5/5) y dulzura densa de **panela, canela y chocolate belga**.\n\n- **Consejo de barista:** Usa agua a **90°C** en tu ${memory.preferredMethod || 'cafetera'} para lograr una infusión redonda, dulce y libre de acidez punzante.`,
      recommendedProductIds: ['sugarcane-decaf-caldas', 'pacamara-black-honey-dipilto'],
    };
  }

  // 3. Leche / chocolate / espresso / moka / prensa (por mensaje o por memoria)
  if (
    q.includes('leche') ||
    q.includes('chocolate') ||
    q.includes('cacao') ||
    q.includes('espresso') ||
    q.includes('moka') ||
    q.includes('prensa') ||
    q.includes('dulce') ||
    memory.milkPreference === 'con-leche' ||
    memory.flavorPreference === 'chocolate'
  ) {
    return {
      reply: `${methodNote}para disfrutar de notas achocolatadas${memory.milkPreference === 'con-leche' ? ' que brillen con leche' : ' con gran cuerpo'}, necesitas granos de densidad licorosa:\n\n- **Pacamara Black Honey Reserva (Nicaragua - SCA 88):** Proceso *Black Honey* con cuerpo 5/5 y notas intensas de **chocolate belga, panela y manzana caramelizada**.\n- **Decaf Sugarcane El Roble (Colombia - SCA 86.5):** Perfil sedoso con notas de **toffee, vainilla tostada y almendra horneada**.\n\n- **Consejo de barista:** En ${memory.preferredMethod || 'Prensa Francesa o Espresso'} usa molienda ${memory.preferredMethod === 'Espresso' ? 'fina (ratio 1:2 en 28s)' : 'media-gruesa (ratio 1:15 a 93°C)'} para resaltar su textura achocolatada.`,
      recommendedProductIds: ['pacamara-black-honey-dipilto', 'sugarcane-decaf-caldas'],
    };
  }

  // 4. Frutal / exótico / aeropress (por mensaje o por memoria)
  if (
    q.includes('frutal') ||
    q.includes('fruta') ||
    q.includes('aeropress') ||
    q.includes('exótico') ||
    memory.flavorPreference === 'frutal'
  ) {
    return {
      reply: `${methodNote}para tu gusto por perfiles **frutales y exóticos**, estos dos microlotes son verdaderas joyas sensoriales:\n\n- **Bourbon Rosado Anaeróbico (Huila, Colombia - SCA 89):** Doble fermentación anaeróbica con notas de **frambuesa madura, cacao ruby y caramelo salado**.\n- **Yirgacheffe Grado 1 Heirloom (Etiopía - SCA 90):** Proceso natural secado en cereza completa, pura mermelada de **arándano silvestre, mandarina dulce y flor de sauco**.\n\n- **Consejo de barista:** En tu ${memory.preferredMethod || 'V60 o AeroPress'} extrae a **91°C** con ratio 1:15 para destacar toda su jugosidad frutal.`,
      recommendedProductIds: ['bourbon-rosado-huila', 'yirgacheffe-heirloom'],
    };
  }

  // 5. Floral / cítrico / V60 / Chemex o consulta general adaptada a memoria
  return {
    reply: `${methodNote}para experimentar la máxima complejidad floral y cítrica de nuestra tostaduría, te sugiero estos dos microlotes extraordinarios:\n\n- **Geisha Finca La Esmeralda (Panamá - SCA 91.5):** El "champagne" de los cafés. Fragancia de **jazmín silvestre, bergamota y melocotón blanco**, sublime en ${memory.preferredMethod || 'V60 o Chemex'}.\n- **Kenya AA Nyeri High Reserve (Kenia - SCA 89.0):** Lavado doble con agua de glaciar, notas vibrantes de **grosella negra (cassis), pomelo rubí y caña de azúcar**.\n\n- **Consejo de barista:** Usa un ratio **1:16** (15g de café por 240ml de agua a 92°C) con pre-infusión de 45 segundos.`,
    recommendedProductIds: ['geisha-la-esmeralda', 'kenya-aa-nyeri'],
  };
}

export async function POST(req: NextRequest) {
  let cleanMessage = '';
  let updatedMemory: UserPalateMemory = {};

  try {
    const body = await req.json();
    const { message, history = [], userMemory = {} } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    cleanMessage = message.trim().slice(0, 600);
    updatedMemory = extractAndMergeMemory(cleanMessage, userMemory);

    if (!process.env.GROQ_API_KEY) {
      const fallback = buildLocalSommelierResponse(cleanMessage, updatedMemory);
      return NextResponse.json({
        success: true,
        reply: fallback.reply,
        recommendedProductIds: fallback.recommendedProductIds,
        updatedMemory,
      });
    }

    // Limitar historial a los últimos 6 mensajes y sanitizar longitud
    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];

    // Formatear mensajes para la API de Groq inyectando la memoria adaptativa
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: buildSystemPrompt(updatedMemory) },
      ...recentHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: String(msg.content || '').slice(0, 800),
      })),
      { role: 'user', content: cleanMessage },
    ];

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages,
      temperature: 0.3,
      max_tokens: 700,
    });

    const replyContent = completion.choices[0]?.message?.content || '';

    // Extraer IDs de cafés recomendados de la etiqueta [RECOMMENDED: id1, id2]
    const recommendedMatch = replyContent.match(/\[RECOMMENDED:\s*([a-z0-9\-,\s]+)\]/i);
    let cleanReply = replyContent;
    const recommendedProductIds: string[] = [];

    if (recommendedMatch) {
      cleanReply = replyContent.replace(recommendedMatch[0], '').trim();
      const ids = recommendedMatch[1]
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((id) => COFFEE_PRODUCTS.some((p) => p.id === id));
      recommendedProductIds.push(...ids);
    }

    return NextResponse.json({
      success: true,
      reply: cleanReply,
      recommendedProductIds: Array.from(new Set(recommendedProductIds)),
      updatedMemory,
    });
  } catch (error: unknown) {
    console.error('Error en sommelier API, usando motor adaptativo local:', error);
    const fallback = buildLocalSommelierResponse(cleanMessage, updatedMemory);
    return NextResponse.json({
      success: true,
      reply: fallback.reply,
      recommendedProductIds: fallback.recommendedProductIds,
      updatedMemory,
    });
  }
}
