# Registro de Pruebas y Documentación del Prototipo Mejorado
**Proyecto:** AURA • Specialty Coffee Roasters & Sommelier Virtual "Don Aurelio" (`modelo_fia`)  
**Asignación:** Probar escenarios, corregir errores y agregar memoria o adaptación sencilla.  
**Entregables:** Prototipo mejorado + Registro de pruebas.

---

## 1. Arquitectura de Memoria y Adaptación Implementada

Para cumplir con el requisito de **memoria y adaptación sencilla**, se implementó un módulo de **Memoria Sensorial Adaptativa (`UserPalateMemory`)** tanto en el backend (`src/app/api/sommelier/route.ts`) como en la interfaz del Sommelier (`src/components/sommelier/SommelierModal.tsx`):

1. **`preferredMethod` (`BrewMethod`):** Detecta y recuerda si el usuario usa `V60`, `Chemex`, `Aeropress`, `Espresso`, `Moka` o `Prensa Francesa`.
2. **`flavorPreference`:** Recuerda la afinidad aromática (`floral`, `frutal`, `chocolate`, `decaf`).
3. **`milkPreference`:** Recuerda si toma el café `solo` (negro) o `con-leche` (latte, capuchino, bebida vegetal).
4. **`lowAcidity` (`boolean`):** Detecta sensibilidad gástrica, reflujo o preferencia explícita por baja acidez.
5. **`consultedCoffees` (`string[]`):** Lleva el historial de granos específicos sobre los que el cliente ya pidió información.

### Adaptación visible en la interfaz (UX/UI):
- **Barra de Memoria de Paladar en Vivo:** En la parte superior del modal de Don Aurelio aparece automáticamente una barra con los rasgos aprendidos del usuario (con opción de *"Olvidar perfil"* para reiniciar pruebas).
- **Chips de Sugerencia Dinámicos:** Cuando el agente recuerda la cafetera del usuario, el primer chip de sugerencia rápida cambia dinámicamente a `✨ Recomendación para mi [Método]`.
- **Calibración Automática de Molienda:** Las tarjetas de producto recomendadas en el chat preseleccionan automáticamente la molienda ideal según el método recordado en la memoria del usuario.

---

## 2. Registro de Errores Detectados y Corregidos

| ID | Componente / Archivo | Descripción del Error Original | Causa Raíz | Solución Aplicada | Estado |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **BUG-01** | `ProductCatalog.tsx` / `page.tsx` | Seleccionar una familia aromática en el *Radar Sensorial* no actualizaba la lista de productos del catálogo. | `useState(initialFilter)` solo leía la prop en el montaje inicial y no reaccionaba a cambios del padre. | Se sincronizó el estado de forma bidireccional entre `FlavorRadarSection` y `ProductCatalog`. | ✅ Corregido |
| **BUG-02** | `SommelierModal.tsx` | En el Paso 3 del *Test de Paladar*, elegir *"Con Leche"* era ignorado en el primer clic. | `setQuizMilk('con-leche')` es asíncrono y `handleCalculateMatch()` leía el estado anterior (`'solo'`). | `handleCalculateMatch(milkChoice)` ahora recibe la elección directamente por parámetro y puntúa los 6 cafés. | ✅ Corregido |
| **BUG-03** | `SommelierModal.tsx` | Al pulsar el botón de Sommelier en una tarjeta del catálogo, el mensaje del usuario se insertaba duplicado y no permitía volver a consultar el mismo café. | El `useEffect` hacía `setMessages` antes de llamar a `handleSendPrompt` (que volvía a hacer `setMessages`) y no limpiaba `selectedCoffeeForSommelier`. | Se delegó la inserción únicamente a `handleSendPrompt` y se limpia la selección con `clearSelectedCoffeeForSommelier()`. | ✅ Corregido |
| **BUG-04** | `SommelierModal.tsx` | Las respuestas del chatbot mostraban asteriscos crudos (`**texto**`) en lugar de formato enriquecido. | El mensaje se renderizaba en un `<p>` plano sin parser de Markdown. | Se implementó el componente `FormattedMessage` que formatea negritas, cursivas y listas de viñetas. | ✅ Corregido |
| **BUG-05** | `HeroSection.tsx` | El botón principal *"Test de Paladar en 30s"* abría el modal en la pestaña de Chat Libre en lugar del Test. | `openSommelierWithCoffee()` no aceptaba la pestaña destino. | Se amplió la firma a `openSommelierWithCoffee(coffee, 'quiz')` para abrir directamente el Test de 3 pasos. | ✅ Corregido |
| **BUG-06** | `globals.css` & `OriginPhilosophy.tsx` | La fuente serif `Playfair Display` no se aplicaba por referencia circular en CSS y el contador de países decía `4` en vez de `5`. | `--font-sans: var(--font-sans)` sin definir `--font-serif` en `@theme inline`. | Se vincularon correctamente `--font-geist-sans` y `--font-serif`, y se actualizó la cifra a `5 países`. | ✅ Corregido |

---

## 3. Matriz de Pruebas de Escenarios (Ejecución y Resultados)

### Escenario 1: Usuario con sensibilidad gástrica y cafetera de filtrado
- **Entrada (Turno 1):** *"Hola Don Aurelio, tengo una cafetera V60 en casa pero sufro de gastritis leve, ¿qué café me recomiendas que no sea ácido?"*
- **Resultado Esperado:** Extraer en memoria `preferredMethod: 'V60'` y `lowAcidity: true`. Recomendar `sugarcane-decaf-caldas` y `pacamara-black-honey-dipilto` con molienda media preseleccionada.
- **Resultado Obtenido:** ✅ **Aprobado.**

### Escenario 2: Prueba de Memoria Multi-turno (Adaptación sin repetir contexto)
- **Entrada (Turno 2, continuando Escenario 1):** *"¿Y qué tal me iría con el Bourbon Rosado?"*
- **Resultado Esperado:** Conservar `preferredMethod: 'V60'` y `lowAcidity: true`, añadir `bourbon-rosado-huila` a `consultedCoffees` y adaptar la receta del Bourbon Rosado a la cafetera V60 recordada del turno 1.
- **Resultado Obtenido:** ✅ **Aprobado.**

### Escenario 3: Amante de bebidas con leche y sabores achocolatados
- **Entrada:** *"Busco un café intenso con notas a chocolate o caramelo para preparar en Prensa Francesa y tomar con leche de avena."*
- **Resultado Esperado:** Actualizar memoria (`preferredMethod: 'Prensa Francesa'`, `flavorPreference: 'chocolate'`, `milkPreference: 'con-leche'`), recomendar `pacamara-black-honey-dipilto` y preseleccionar `Molienda Gruesa (Prensa Francesa)`.
- **Resultado Obtenido:** ✅ **Aprobado.**

### Escenario 4: Consulta específica desde la tarjeta del Catálogo
- **Acción:** Hacer clic en el botón de Sommelier (✨) sobre el producto **Geisha Finca La Esmeralda**.
- **Resultado Esperado:** Abrir el chat, enviar la pregunta sin duplicarla y registrar `geisha-la-esmeralda` en memoria.
- **Resultado Obtenido:** ✅ **Aprobado.**

### Escenario 5: Flujo completo del Test de Paladar (Quiz de 3 pasos) + Sincronización con Memoria
- **Acción:** Clic en *"Test de Paladar en 30s"* → Paso 1: `Aeropress` → Paso 2: `Frutal` → Paso 3: `Puro / Café Negro`.
- **Resultado Esperado:** Recomendar `Bourbon Rosado Anaeróbico` (Match #1) y `Yirgacheffe Grado 1 Heirloom` (Match #2), y guardar las 3 respuestas en la Memoria Sensorial del chat.
- **Resultado Obtenido:** ✅ **Aprobado.**

### Escenario 6: Filtros combinados en Catálogo + Radar Sensorial
- **Acción:** Seleccionar `Florales & Cítricos` en el Radar Sensorial, filtrar por `Chemex` y ordenar por `Mayor Puntaje SCA`.
- **Resultado Esperado:** Sincronización bidireccional de filtros y visualización de barras sensoriales + modal de Ficha Técnica.
- **Resultado Obtenido:** ✅ **Aprobado.**

### Escenario 7: Resiliencia ante fallo de API / Falta de `GROQ_API_KEY`
- **Acción:** Enviar consultas cuando la API externa no está disponible.
- **Resultado Esperado:** El motor local adaptativo responde con recomendaciones precisas usando la memoria del usuario y estado HTTP `200 OK`.
- **Resultado Obtenido:** ✅ **Aprobado.**

### Escenario 8: Validación de Entradas Inválidas y Seguridad
- **Acción:** Enviar mensaje vacío (`"   "`) o texto superior a 600 caracteres.
- **Resultado Esperado:** Rechazar mensaje vacío con HTTP `400` y truncar entradas largas a 600 caracteres.
- **Resultado Obtenido:** ✅ **Aprobado.**

