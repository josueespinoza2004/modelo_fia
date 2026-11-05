'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { useCart } from '@/context/CartContext';
import { COFFEE_PRODUCTS } from '@/data/coffeeCatalog';
import { CoffeeProduct, BrewMethod, CartItem, UserPalateMemory } from '@/types/coffee';
import {
  Sparkles,
  X,
  Send,
  Coffee,
  Check,
  RotateCcw,
  ShoppingBag,
  Award,
  ChevronRight,
  Bot,
  Trash2,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendedProductIds?: string[];
}

const INITIAL_WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    '¡Un placer darte la bienvenida a nuestra tostaduría! Soy **Don Aurelio**, Maestro Sommelier y Q-Grader de AURA.\n\nCuéntame: ¿qué **método de extracción** usas en casa o qué **perfiles de sabor** (frutal, floral, achocolatado o baja acidez) estás buscando experimentar hoy? Iré recordando tus gustos para personalizar cada recomendación.',
  recommendedProductIds: ['geisha-la-esmeralda', 'pacamara-black-honey-dipilto'],
};

function getDefaultGrindForMethod(method?: BrewMethod): CartItem['grindOption'] {
  switch (method) {
    case 'Espresso':
    case 'Moka':
      return 'Molienda Fina (Espresso)';
    case 'Prensa Francesa':
      return 'Molienda Gruesa (Prensa Francesa)';
    case 'V60':
    case 'Chemex':
    case 'Aeropress':
      return 'Molienda Media (V60 / Filtro)';
    default:
      return 'Grano Entero';
  }
}

// Renderizador ligero de Markdown para negritas, cursivas y listas
function FormattedMessage({ content }: { content: string }) {
  const formatInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-amber-200">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={idx} className="italic text-amber-100/90">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  const lines = content.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="text-amber-400 font-bold mt-0.5">•</span>
              <span className="flex-1">{formatInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        return (
          <p key={i} className="leading-relaxed">
            {formatInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export function SommelierModal() {
  const {
    isSommelierOpen,
    setIsSommelierOpen,
    sommelierTab,
    setSommelierTab,
    selectedCoffeeForSommelier,
    clearSelectedCoffeeForSommelier,
    addItem,
  } = useCart();

  // Estado del chat y memoria adaptativa del usuario
  const [messages, setMessages] = useState<Message[]>([INITIAL_WELCOME_MESSAGE]);
  const [userMemory, setUserMemory] = useState<UserPalateMemory>({});
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cardGrinds, setCardGrinds] = useState<Record<string, CartItem['grindOption']>>({});
  const [addedFeedback, setAddedFeedback] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>(messages);
  const memoryRef = useRef<UserPalateMemory>(userMemory);

  // Estado del Quiz Sensorial
  const [quizStep, setQuizStep] = useState(1);
  const [quizMethod, setQuizMethod] = useState<BrewMethod>('V60');
  const [quizFlavor, setQuizFlavor] = useState<'floral' | 'frutal' | 'chocolate' | 'decaf'>('frutal');
  const [quizMilk, setQuizMilk] = useState<'solo' | 'con-leche'>('solo');
  const [quizResult, setQuizResult] = useState<CoffeeProduct | null>(null);
  const [quizRunnerUp, setQuizRunnerUp] = useState<CoffeeProduct | null>(null);
  const [quizGrind, setQuizGrind] = useState<CartItem['grindOption']>('Molienda Media (V60 / Filtro)');

  // Cargar conversación y memoria guardadas en localStorage
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const savedChat = localStorage.getItem('aura_sommelier_chat');
        if (savedChat) {
          const parsed = JSON.parse(savedChat);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
        const savedMem = localStorage.getItem('aura_user_memory');
        if (savedMem) {
          const parsedMem = JSON.parse(savedMem);
          if (parsedMem && typeof parsedMem === 'object') {
            setUserMemory(parsedMem);
          }
        }
      } catch {
        // Ignorar errores de localStorage
      }
    });
  }, []);

  // Sincronizar refs y guardar conversación y memoria en localStorage
  useEffect(() => {
    messagesRef.current = messages;
    try {
      localStorage.setItem('aura_sommelier_chat', JSON.stringify(messages.slice(-16)));
    } catch {
      // Ignorar
    }
  }, [messages]);

  useEffect(() => {
    memoryRef.current = userMemory;
    try {
      localStorage.setItem('aura_user_memory', JSON.stringify(userMemory));
    } catch {
      // Ignorar
    }
  }, [userMemory]);

  const handleSendPrompt = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend ?? inputMessage).trim();
      if (!text) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
      };

      const currentHistory = messagesRef.current.slice(-5).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, userMsg]);
      if (!textToSend) {
        setInputMessage('');
      }
      setIsLoading(true);

      try {
        const res = await fetch('/api/sommelier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: currentHistory,
            userMemory: memoryRef.current,
          }),
        });

        const data = await res.json();

        if (data.updatedMemory) {
          setUserMemory(data.updatedMemory);
        }

        if (data.success && data.reply) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: data.reply,
              recommendedProductIds: data.recommendedProductIds,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: 'assistant',
              content:
                'Disculpa, el laboratorio está calibrando el tostador. Para cafés de método **V60** te recomiendo nuestro **Geisha La Esmeralda**, y para **espresso o leche** el **Pacamara Black Honey**.',
              recommendedProductIds: ['geisha-la-esmeralda', 'pacamara-black-honey-dipilto'],
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content:
              'Tuvimos un breve lapso de conexión con la barra. Nuestro grano insigne es el **Geisha Finca La Esmeralda** (SCA 91.5 pts), pruébalo en método filtrado.',
            recommendedProductIds: ['geisha-la-esmeralda'],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [inputMessage]
  );

  // Si se abre con un café específico seleccionado desde el catálogo (sin duplicar mensaje)
  useEffect(() => {
    if (selectedCoffeeForSommelier && isSommelierOpen) {
      const coffeeName = selectedCoffeeForSommelier.name;
      queueMicrotask(() => {
        setSommelierTab('chat');
        const prompt = `Hola Don Aurelio, me interesa conocer más sobre el grano "${coffeeName}". ¿Qué me puedes decir sobre su origen, perfil sensorial y cómo extraer lo mejor de él?`;
        clearSelectedCoffeeForSommelier();
        handleSendPrompt(prompt);
      });
    }
  }, [
    selectedCoffeeForSommelier,
    isSommelierOpen,
    clearSelectedCoffeeForSommelier,
    handleSendPrompt,
    setSommelierTab,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleQuickQuestion = (question: string) => {
    if (isLoading) return;
    handleSendPrompt(question);
  };

  const handleResetChat = () => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    try {
      localStorage.removeItem('aura_sommelier_chat');
    } catch {
      // Ignorar
    }
  };

  const handleClearMemory = () => {
    setUserMemory({});
    try {
      localStorage.removeItem('aura_user_memory');
    } catch {
      // Ignorar
    }
  };

  const handleAddFromModal = (
    coffee: CoffeeProduct,
    grind: CartItem['grindOption'] = 'Grano Entero',
    openCartAfter: boolean = false
  ) => {
    addItem(coffee, grind, 1, openCartAfter);
    if (!openCartAfter) {
      setAddedFeedback((prev) => ({ ...prev, [coffee.id]: true }));
      setTimeout(() => {
        setAddedFeedback((prev) => ({ ...prev, [coffee.id]: false }));
      }, 1800);
    } else {
      setIsSommelierOpen(false);
    }
  };

  // Algoritmo multicriterio de emparejamiento del Quiz + actualización de Memoria Sensorial
  const handleCalculateMatch = (milkChoice: 'solo' | 'con-leche') => {
    setQuizMilk(milkChoice);
    setQuizGrind(getDefaultGrindForMethod(quizMethod));

    // Guardar en la memoria adaptativa del usuario lo aprendido en el Quiz
    setUserMemory((prev) => ({
      ...prev,
      preferredMethod: quizMethod,
      flavorPreference: quizFlavor,
      milkPreference: milkChoice,
      lastUpdated: new Date().toISOString(),
    }));

    const scored = COFFEE_PRODUCTS.map((product) => {
      let score = 0;

      // 1. Afinidad por familia de sabor
      if (quizFlavor === 'decaf') {
        if (product.id === 'sugarcane-decaf-caldas') score += 100;
      } else if (quizFlavor === 'floral') {
        if (product.flavorCategory === 'floral-citrico') score += 45;
        if (product.acidity >= 4) score += 10;
      } else if (quizFlavor === 'frutal') {
        if (product.flavorCategory === 'frutal-exotico') score += 45;
        if (product.id === 'kenya-aa-nyeri') score += 25;
      } else if (quizFlavor === 'chocolate') {
        if (product.flavorCategory === 'chocolate-caramelo') score += 45;
        if (product.flavorCategory === 'dulce-sedoso') score += 30;
      }

      // 2. Afinidad por método de extracción
      if (product.recommendedBrews.includes(quizMethod)) {
        score += 30;
      }

      // Ajuste específico por método
      if (quizMethod === 'Chemex' && product.id === 'geisha-la-esmeralda') score += 12;
      if (quizMethod === 'Aeropress' && product.id === 'bourbon-rosado-huila') score += 15;
      if (quizMethod === 'V60' && product.id === 'kenya-aa-nyeri' && quizFlavor === 'floral') {
        score += 10;
      }

      // 3. Afinidad por leche vs café negro
      if (milkChoice === 'con-leche') {
        if (product.body >= 4) score += 20;
        if (product.id === 'pacamara-black-honey-dipilto') score += 25;
        if (product.id === 'sugarcane-decaf-caldas') score += 15;
        if (product.roastLevel === 'Ligero') score -= 15;
      } else {
        if (product.scaScore >= 89) score += 12;
      }

      return { product, score };
    }).sort((a, b) => b.score - a.score);

    setQuizResult(scored[0].product);
    setQuizRunnerUp(scored[1]?.product || null);
    setQuizStep(4);

    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#d97706', '#f59e0b', '#78350f'],
      });
    } catch {
      // Ignorar si confetti falla
    }
  };

  const resetQuiz = () => {
    setQuizStep(1);
    setQuizResult(null);
    setQuizRunnerUp(null);
  };

  const hasActiveMemory = Boolean(
    userMemory.preferredMethod ||
      userMemory.flavorPreference ||
      userMemory.milkPreference ||
      userMemory.lowAcidity
  );

  if (!isSommelierOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-2 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sommelier-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => setIsSommelierOpen(false)}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-3xl h-[92vh] max-h-[840px] bg-[#140f0c] border border-amber-600/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 z-10">
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-amber-600/20 bg-[#1c1512] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-11 h-11 border-2 border-amber-500 bg-amber-950 text-amber-200">
                <AvatarFallback className="bg-amber-900 text-amber-200 font-serif font-bold">
                  DA
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#140f0c]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="sommelier-modal-title"
                  className="font-serif font-bold text-amber-100 text-base"
                >
                  Don Aurelio
                </h3>
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0">
                  Sommelier Q-Grader
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Asesor con Memoria Sensorial Adaptativa • AURA Coffee Roasters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs Switcher */}
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                onClick={() => setSommelierTab('chat')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  sommelierTab === 'chat'
                    ? 'bg-amber-500 text-zinc-950 font-semibold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Chat Libre
              </button>
              <button
                onClick={() => setSommelierTab('quiz')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  sommelierTab === 'quiz'
                    ? 'bg-amber-500 text-zinc-950 font-semibold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Test de Paladar (30s)
              </button>
            </div>

            {sommelierTab === 'chat' && messages.length > 1 && (
              <button
                onClick={handleResetChat}
                className="p-2 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Reiniciar conversación"
                aria-label="Reiniciar conversación"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsSommelierOpen(false)}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Memoria Sensorial Adaptativa */}
        {hasActiveMemory && (
          <div className="px-4 sm:px-6 py-2 bg-amber-950/30 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-amber-300 font-semibold flex items-center gap-1 mr-1">
                <Brain className="w-3.5 h-3.5 text-amber-400" />
                Memoria de Paladar:
              </span>
              {userMemory.preferredMethod && (
                <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-amber-500/30 text-amber-200">
                  Cafetera: <strong>{userMemory.preferredMethod}</strong>
                </span>
              )}
              {userMemory.flavorPreference && (
                <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-amber-500/30 text-amber-200 capitalize">
                  Gusto: <strong>{userMemory.flavorPreference}</strong>
                </span>
              )}
              {userMemory.milkPreference && (
                <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-amber-500/30 text-amber-200">
                  Servicio:{' '}
                  <strong>{userMemory.milkPreference === 'con-leche' ? 'Con Leche' : 'Negro'}</strong>
                </span>
              )}
              {userMemory.lowAcidity && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                  ✓ Baja Acidez
                </span>
              )}
            </div>

            <button
              onClick={handleClearMemory}
              className="text-[10px] text-zinc-400 hover:text-amber-300 underline cursor-pointer shrink-0"
            >
              Olvidar perfil
            </button>
          </div>
        )}

        {/* Tab 1: Live Chat with Don Aurelio */}
        {sommelierTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#100c0a]">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-amber-600/30 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className="max-w-[88%] sm:max-w-[80%] space-y-3">
                    {/* Bubble */}
                    <div
                      className={`p-4 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-zinc-950 font-medium rounded-tr-xs'
                          : 'bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-tl-xs shadow-lg'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <FormattedMessage content={msg.content} />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>

                    {/* Embedded Recommended Coffee Cards */}
                    {msg.recommendedProductIds && msg.recommendedProductIds.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-400 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" /> Granos recomendados para tu paladar:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.recommendedProductIds.map((id) => {
                            const coffee = COFFEE_PRODUCTS.find((c) => c.id === id);
                            if (!coffee) return null;
                            const defaultGrind = getDefaultGrindForMethod(
                              userMemory.preferredMethod
                            );
                            const selectedGrind = cardGrinds[coffee.id] || defaultGrind;
                            const isAdded = addedFeedback[coffee.id];

                            return (
                              <div
                                key={coffee.id}
                                className="p-3 rounded-xl bg-zinc-950/90 border border-amber-500/30 flex flex-col gap-2.5 hover:border-amber-400 transition-all shadow-md group"
                              >
                                <div className="flex gap-3 items-center">
                                  <div className="relative w-14 h-16 rounded-lg overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700">
                                    <Image
                                      src={coffee.image}
                                      alt={coffee.name}
                                      fill
                                      sizes="56px"
                                      className="object-cover group-hover:scale-105 transition-transform"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <h4 className="text-xs font-bold text-zinc-100 truncate">
                                        {coffee.name}
                                      </h4>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold shrink-0">
                                        SCA {coffee.scaScore}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 truncate">
                                      {coffee.origin} • Tueste {coffee.roastLevel}
                                    </p>
                                    <p className="text-[10px] text-amber-300/90 truncate mt-0.5">
                                      {coffee.tastingNotes.slice(0, 3).join(' • ')}
                                    </p>
                                  </div>
                                </div>

                                {/* Selector de molienda (adaptado a la memoria del método del usuario) y botón de añadir */}
                                <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
                                  <select
                                    value={selectedGrind}
                                    onChange={(e) =>
                                      setCardGrinds((prev) => ({
                                        ...prev,
                                        [coffee.id]: e.target.value as CartItem['grindOption'],
                                      }))
                                    }
                                    aria-label={`Molienda para ${coffee.name}`}
                                    className="flex-1 min-w-0 text-[10px] bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-zinc-300 focus:outline-none focus:border-amber-500"
                                  >
                                    <option value="Grano Entero">Grano Entero</option>
                                    <option value="Molienda Media (V60 / Filtro)">
                                      Molienda Media (Filtro)
                                    </option>
                                    <option value="Molienda Fina (Espresso)">
                                      Molienda Fina (Espresso)
                                    </option>
                                    <option value="Molienda Gruesa (Prensa Francesa)">
                                      Molienda Gruesa (Prensa)
                                    </option>
                                  </select>

                                  <span className="text-xs font-bold text-amber-400 shrink-0">
                                    ${coffee.price.toFixed(2)}
                                  </span>

                                  <button
                                    onClick={() => handleAddFromModal(coffee, selectedGrind, false)}
                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-all shrink-0 ${
                                      isAdded
                                        ? 'bg-emerald-500 text-zinc-950'
                                        : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                                    }`}
                                  >
                                    {isAdded ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        <span>¡Listo!</span>
                                      </>
                                    ) : (
                                      <>
                                        <ShoppingBag className="w-3 h-3" />
                                        <span>Añadir</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 items-center text-zinc-400 text-xs py-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center animate-spin">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <span className="italic">
                    Don Aurelio está consultando tu perfil sensorial y calibrando la recomendación...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips (Adaptativos según la memoria del usuario) */}
            <div className="px-4 py-2.5 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
              <span className="text-zinc-500 shrink-0 text-[11px]">Sugerencias:</span>
              {userMemory.preferredMethod ? (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    handleQuickQuestion(
                      `Según lo que recuerdas de mi perfil y mi ${userMemory.preferredMethod}, ¿cuál otro café me recomiendas probar?`
                    )
                  }
                  className="shrink-0 px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer disabled:opacity-50"
                >
                  ✨ Recomendación para mi {userMemory.preferredMethod}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    handleQuickQuestion('¿Qué café me recomiendas para V60 que no sea ácido?')
                  }
                  className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-amber-500 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Para V60 sin exceso de acidez
                </button>
              )}
              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  handleQuickQuestion(
                    'Quiero un café con notas a chocolate intenso para tomar con leche'
                  )
                }
                className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-amber-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                Con leche y notas a chocolate
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  handleQuickQuestion(
                    'Explícame por qué el café Geisha de Panamá es tan famoso y especial'
                  )
                }
                className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-amber-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                ¿Por qué el Geisha es especial?
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  handleQuickQuestion(
                    'Tengo reflujo o gastritis leve, ¿cuál grano me conviene?'
                  )
                }
                className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-amber-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                Baja acidez para el estómago
              </button>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              className="p-4 border-t border-amber-600/20 bg-[#16110e] flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                maxLength={500}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Pregúntale a Don Aurelio (ej: 'Tengo una Prensa Francesa y me gustan los cafés frutales')..."
                className="flex-1 bg-zinc-900/90 border border-zinc-700 text-sm text-zinc-100 placeholder:text-zinc-500 px-4 py-3 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
              />
              <Button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Enviar</span>
              </Button>
            </form>
          </div>
        )}

        {/* Tab 2: 3-Step Taste Quiz */}
        {sommelierTab === 'quiz' && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#100c0a] flex flex-col justify-center">
            {/* Progress indicator */}
            {quizStep < 4 && (
              <div className="max-w-xs mx-auto w-full mb-6">
                <div className="flex justify-between text-[11px] text-zinc-400 mb-1.5">
                  <span>Progreso del análisis</span>
                  <span className="text-amber-400 font-semibold">Paso {quizStep} de 3</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${(quizStep / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {quizStep === 1 && (
              <div className="max-w-xl mx-auto w-full space-y-6">
                <div className="text-center space-y-2">
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Paso 1 de 3 • Método
                  </Badge>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-amber-100">
                    ¿Cuál es tu método de extracción predilecto?
                  </h3>
                  <p className="text-sm text-zinc-400">
                    La molienda y el tueste reaccionan de forma muy diferente en cada cafetera.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    { id: 'V60', label: 'V60 / Cafetera de Filtro', desc: 'Resalta claridad y notas florales' },
                    { id: 'Chemex', label: 'Chemex', desc: 'Taza sedosa y ultra limpia' },
                    { id: 'Aeropress', label: 'AeroPress', desc: 'Cuerpo redondo y versátil' },
                    { id: 'Espresso', label: 'Espresso / Cafetera Moka', desc: 'Concentrado denso y con crema' },
                    { id: 'Prensa Francesa', label: 'Prensa Francesa', desc: 'Inmersión y aceites naturales' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setQuizMethod(m.id as BrewMethod);
                        setQuizStep(2);
                      }}
                      className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                        quizMethod === m.id
                          ? 'bg-amber-500/15 border-amber-500 text-amber-200'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-amber-500/40 text-zinc-300'
                      }`}
                    >
                      <h5 className="font-semibold text-sm text-zinc-100">{m.label}</h5>
                      <p className="text-xs text-zinc-400 mt-1">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quizStep === 2 && (
              <div className="max-w-xl mx-auto w-full space-y-6">
                <div className="text-center space-y-2">
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Paso 2 de 3 • Notas Aromáticas
                  </Badge>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-amber-100">
                    ¿Qué sensaciones de sabor te conquistan?
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Cada terruño y proceso genera notas aromáticas naturales fascinantes.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    {
                      id: 'floral',
                      label: '🌸 Florales & Cítricos Nobles',
                      desc: 'Jazmín, bergamota, melocotón blanco y miel sutil',
                    },
                    {
                      id: 'frutal',
                      label: '🍓 Frutas Silvestres & Exóticas',
                      desc: 'Arándanos, frambuesa madura, mandarina jugosa',
                    },
                    {
                      id: 'chocolate',
                      label: '🍫 Chocolate Oscuro & Panela',
                      desc: 'Cacao belga, caramelo tostado y especias dulces',
                    },
                    {
                      id: 'decaf',
                      label: '🌙 Dulce & Sin Cafeína',
                      desc: 'Toffee, almendras tostadas y cero insomnio',
                    },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setQuizFlavor(f.id as 'floral' | 'frutal' | 'chocolate' | 'decaf');
                        setQuizStep(3);
                      }}
                      className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                        quizFlavor === f.id
                          ? 'bg-amber-500/15 border-amber-500 text-amber-200'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-amber-500/40 text-zinc-300'
                      }`}
                    >
                      <h5 className="font-semibold text-sm text-zinc-100">{f.label}</h5>
                      <p className="text-xs text-zinc-400 mt-1">{f.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setQuizStep(1)}
                    className="text-xs text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    ← Volver al paso anterior
                  </button>
                </div>
              </div>
            )}

            {quizStep === 3 && (
              <div className="max-w-xl mx-auto w-full space-y-6">
                <div className="text-center space-y-2">
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Paso 3 de 3 • Servicio
                  </Badge>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-amber-100">
                    ¿Cómo prefieres servir tu taza?
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Algunos cafés brillan en pureza negra, mientras otros se potencian con emulsión de leche.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={() => handleCalculateMatch('solo')}
                    className="p-5 rounded-xl text-left border bg-zinc-900/60 border-zinc-800 hover:border-amber-500 text-zinc-200 cursor-pointer transition-all hover:bg-amber-500/10"
                  >
                    <span className="text-2xl mb-2 block">☕</span>
                    <h5 className="font-semibold text-base text-zinc-100">Puro / Café Negro</h5>
                    <p className="text-xs text-zinc-400 mt-1">
                      Para apreciar la pureza del terruño y la acidez viva del grano.
                    </p>
                  </button>

                  <button
                    onClick={() => handleCalculateMatch('con-leche')}
                    className="p-5 rounded-xl text-left border bg-zinc-900/60 border-zinc-800 hover:border-amber-500 text-zinc-200 cursor-pointer transition-all hover:bg-amber-500/10"
                  >
                    <span className="text-2xl mb-2 block">🥛</span>
                    <h5 className="font-semibold text-base text-zinc-100">
                      Con Leche o Bebida Vegetal
                    </h5>
                    <p className="text-xs text-zinc-400 mt-1">
                      Requiere granos con cuerpo licoroso que mantengan su presencia y creen notas a postre.
                    </p>
                  </button>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setQuizStep(2)}
                    className="text-xs text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    ← Volver al paso anterior
                  </button>
                </div>
              </div>
            )}

            {quizStep === 4 && quizResult && (
              <div className="max-w-xl mx-auto w-full space-y-5 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <Sparkles className="w-4 h-4" /> 98.4% Match Sensorial • Guardado en tu Memoria
                </div>

                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-amber-100">
                    ¡Tu Café Ideal es {quizResult.name}!
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto leading-relaxed mt-1">
                    Para extracción en <strong className="text-amber-300">{quizMethod}</strong> (
                    {quizMilk === 'con-leche' ? 'con leche' : 'taza negra'}), este microlote de{' '}
                    {quizResult.origin} es tu armonía perfecta.
                  </p>
                </div>

                {/* Match Product Card */}
                <div className="p-5 rounded-2xl bg-zinc-900/90 border border-amber-500/40 text-left flex flex-col sm:flex-row gap-5 items-center shadow-xl">
                  <div className="relative w-28 h-36 rounded-xl overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700">
                    <Image
                      src={quizResult.image}
                      alt={quizResult.name}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-amber-500 text-zinc-950 font-bold text-[10px] px-1.5 py-0.5 rounded">
                      SCA {quizResult.scaScore}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2.5 w-full">
                    <div>
                      <h4 className="font-serif text-lg font-bold text-amber-200">
                        {quizResult.name}
                      </h4>
                      <p className="text-xs text-zinc-400">
                        {quizResult.origin}, {quizResult.country} • {quizResult.altitude}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {quizResult.tastingNotes.map((note) => (
                        <Badge
                          key={note}
                          variant="outline"
                          className="text-[10px] border-amber-500/30 text-amber-300"
                        >
                          {note}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-xs text-zinc-300 italic">
                      &quot;{quizResult.sommelierQuote}&quot;
                    </p>

                    {/* Molienda recomendada según el método elegido */}
                    <div className="pt-1">
                      <label className="text-[10px] uppercase tracking-wider text-zinc-400 block mb-1">
                        Molienda calibrada para tu {quizMethod}:
                      </label>
                      <select
                        value={quizGrind}
                        onChange={(e) => setQuizGrind(e.target.value as CartItem['grindOption'])}
                        className="w-full text-xs bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Grano Entero">Grano Entero (Para moler en casa)</option>
                        <option value="Molienda Media (V60 / Filtro)">
                          Molienda Media (V60 / Chemex / AeroPress)
                        </option>
                        <option value="Molienda Fina (Espresso)">
                          Molienda Fina (Espresso / Moka)
                        </option>
                        <option value="Molienda Gruesa (Prensa Francesa)">
                          Molienda Gruesa (Prensa Francesa)
                        </option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="font-bold text-base text-amber-400">
                        ${quizResult.price.toFixed(2)} USD
                      </span>
                      <Button
                        onClick={() => handleAddFromModal(quizResult, quizGrind, true)}
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Añadir a la Cesta</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Runner-up Alternative */}
                {quizRunnerUp && (
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-3 text-left">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-amber-400/90 font-semibold block">
                        Segunda opción recomendada (SCA {quizRunnerUp.scaScore}):
                      </span>
                      <p className="text-xs font-semibold text-zinc-200 truncate">
                        {quizRunnerUp.name} —{' '}
                        <span className="text-zinc-400 font-normal">
                          {quizRunnerUp.tastingNotes.slice(0, 2).join(', ')}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddFromModal(quizRunnerUp, quizGrind, false)}
                      className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-300 font-medium cursor-pointer transition-colors"
                    >
                      {addedFeedback[quizRunnerUp.id]
                        ? '✓ Añadido'
                        : `+ Añadir ($${quizRunnerUp.price.toFixed(2)})`}
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap justify-center gap-4 pt-1">
                  <button
                    onClick={resetQuiz}
                    className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Hacer el test de nuevo</span>
                  </button>
                  <span className="text-zinc-600">•</span>
                  <button
                    onClick={() => {
                      setSommelierTab('chat');
                      handleSendPrompt(
                        `Don Aurelio, hice el test y me salió el "${quizResult.name}" para preparar en ${quizMethod}. ¿Me das tu receta exacta paso a paso?`
                      );
                    }}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <span>Pedir receta exacta a Don Aurelio</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
