import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { COFFEE_PRODUCTS } from '@/data/coffeeCatalog';

// Inicializar cliente Groq con la API key de entorno
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// Catálogo condensado para inyectar en el prompt
const CATALOG_CONTEXT = COFFEE_PRODUCTS.map((c) => ({
  id: c.id,
  nombre: c.name,
  origen: `${c.origin}, ${c.country}`,
  finca: c.farm,
  altura: c.altitude,
  variedad: c.variety,
  proceso: c.process,
  tueste: c.roastLevel,
  sca: c.scaScore,
  notas_cata: c.tastingNotes.join(', '),
  metodos_ideales: c.recommendedBrews.join(', '),
  precio: `$${c.price.toFixed(2)} USD`,
  descripcion: c.description,
})).map(c => `- ID: ${c.id} | ${c.nombre} (${c.origen}, ${c.altura}) | Variedad: ${c.variedad} | Proceso: ${c.proceso} | Tueste: ${c.tueste} | SCA: ${c.sca} pts | Notas: ${c.notas_cata} | Métodos: ${c.metodos_ideales} | Precio: ${c.precio}`).join('\n');

const SYSTEM_PROMPT = `
Eres "Don Aurelio", Maestro Sommelier de Café, Licenciado Q-Grader y Director de Tueste de la tostaduría boutique "AURA Coffee Roasters".
Tu pasión es educar el paladar de las personas y conectarlas con el café de especialidad perfecto para su momento, gusto sensorial y método de extracción.

REGLAS DE INTERACCIÓN:
1. Hablas en español con un tono cálido, distinguido, sensorial y apasionado (como un barista sabio y cercano en una barra de especialidad).
2. Tienes acceso al catálogo exclusivo de AURA Coffee Roasters. Usa SOLO estos cafés al recomendar granos:
${CATALOG_CONTEXT}

3. Sé conciso y directo:
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Mensaje requerido' },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Clave de API de Groq no configurada' },
        { status: 500 }
      );
    }

    // Limitar historial a los últimos 6 mensajes
    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];

    // Formatear mensajes para la API de Groq
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: String(msg.content || ''),
      })),
      { role: 'user', content: message.trim() },
    ];

    // Llamar a Groq con el modelo disponible
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
      recommendedProductIds,
    });
  } catch (error: unknown) {
    console.error('Error en sommelier API:', error);
    const errMsg = error instanceof Error ? error.message : 'Error al consultar con el sommelier';
    return NextResponse.json(
      {
        success: false,
        error: errMsg,
      },
      { status: 500 }
    );
  }
}
