'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { useCart } from '@/context/CartContext';
import {
  fetchSommelierSession,
  forgetSommelierSessionMemory,
  resetSommelierSessionChat,
  streamSommelierChat,
  submitTasteQuiz,
} from '@/lib/api';
import { CoffeeProduct, BrewMethod, CartItem, UserPalateMemory } from '@/types/coffee';
import {
  X,
  Send,
  Square,
  Coffee,
  Check,
  RotateCcw,
  ShoppingBag,
  Award,
  ChevronRight,
  Trash2,
  BookmarkCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendedProductIds?: string[];
  recommendedProducts?: CoffeeProduct[];
}

const INITIAL_WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    '¡Hola! Soy **Don Aurelio**, maestro barista y tostador en AURA ☕\n\n¿Qué cafetera usas en casa o qué tipo de sabores te agradan más? Con gusto te oriento para preparar tu taza ideal.',
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
          <strong key={idx} className="font-semibold text-[#8f461e]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={idx} className="italic text-[#59493d]">
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
              <span className="text-[#8f461e] font-bold mt-0.5">•</span>
              <span className="flex-1">{formatInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        const numMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="text-[#8f461e] font-semibold">{numMatch[1]}</span>
              <span className="flex-1">{formatInline(numMatch[2])}</span>
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
    products,
    sessionId,
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
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [cardGrinds, setCardGrinds] = useState<Record<string, CartItem['grindOption']>>({});
  const [addedFeedback, setAddedFeedback] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>(messages);
  const memoryRef = useRef<UserPalateMemory>(userMemory);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Estado del Quiz Sensorial
  const [quizStep, setQuizStep] = useState(1);
  const [quizMethod, setQuizMethod] = useState<BrewMethod>('V60');
  const [quizFlavor, setQuizFlavor] = useState<'floral' | 'frutal' | 'chocolate' | 'decaf'>('frutal');
  const [quizMilk, setQuizMilk] = useState<'solo' | 'con-leche'>('solo');
  const [quizResult, setQuizResult] = useState<CoffeeProduct | null>(null);
  const [quizRunnerUp, setQuizRunnerUp] = useState<CoffeeProduct | null>(null);
  const [quizMatchScore, setQuizMatchScore] = useState<number>(98.4);
  const [quizGrind, setQuizGrind] = useState<CartItem['grindOption']>('Molienda Media (V60 / Filtro)');
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  // Cargar conversación y memoria desde el backend Python (y cache local)
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const sessionData = await fetchSommelierSession(sessionId);
        if (cancelled) return;
        if (Array.isArray(sessionData.messages) && sessionData.messages.length > 0) {
          setMessages([INITIAL_WELCOME_MESSAGE, ...sessionData.messages]);
        }
        if (sessionData.userMemory && typeof sessionData.userMemory === 'object') {
          setUserMemory(sessionData.userMemory);
        }
      } catch {
        // Fallback silencioso a localStorage si la sesión aún no existe en backend
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
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

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

  const handleStopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
    setStreamingMessageId(null);
  }, []);

  const handleSendPrompt = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend ?? inputMessage).trim();
      if (!text) return;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const now = Date.now();
      const userMsg: Message = {
        id: `user-${now}`,
        role: 'user',
        content: text,
      };
      const assistantMsgId = `assistant-${now + 1}`;

      const currentHistory = messagesRef.current.slice(-5).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, userMsg]);
      if (!textToSend) {
        setInputMessage('');
      }
      setIsLoading(true);
      setStreamingMessageId(null);

      let bubbleCreated = false;

      try {
        await streamSommelierChat(
          {
            message: text,
            history: currentHistory,
            userMemory: memoryRef.current,
            sessionId: sessionId || undefined,
          },
          {
            signal: controller.signal,
            onMemory: (updatedMemory) => {
              setUserMemory(updatedMemory);
            },
            onDelta: (chunk) => {
              if (!bubbleCreated) {
                bubbleCreated = true;
                setIsLoading(false);
                setStreamingMessageId(assistantMsgId);
                setMessages((prev) => [
                  ...prev,
                  {
                    id: assistantMsgId,
                    role: 'assistant',
                    content: chunk,
                  },
                ]);
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: m.content + chunk }
                      : m
                  )
                );
              }
            },
            onDone: (data) => {
              if (data.updatedMemory) {
                setUserMemory(data.updatedMemory);
              }
              setMessages((prev) => {
                if (!bubbleCreated) {
                  bubbleCreated = true;
                  return [
                    ...prev,
                    {
                      id: assistantMsgId,
                      role: 'assistant',
                      content: data.reply || '',
                      recommendedProductIds: data.recommendedProductIds,
                      recommendedProducts: data.recommendedProducts,
                    },
                  ];
                }
                return prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: data.reply || m.content,
                        recommendedProductIds: data.recommendedProductIds,
                        recommendedProducts: data.recommendedProducts,
                      }
                    : m
                );
              });
            },
          }
        );
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: 'assistant',
              content:
                'No fue posible conectar con el servidor en este momento. Por favor verifica que el backend esté disponible e intenta de nuevo.',
            },
          ]);
        }
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setIsLoading(false);
        setStreamingMessageId(null);
      }
    },
    [inputMessage, sessionId]
  );

  // Cancelar stream activo al cerrar modal o desmontar
  useEffect(() => {
    if (!isSommelierOpen) {
      abortControllerRef.current?.abort();
    }
  }, [isSommelierOpen]);

  // Si se abre con un café específico seleccionado desde el catálogo
  useEffect(() => {
    if (selectedCoffeeForSommelier && isSommelierOpen) {
      const coffeeName = selectedCoffeeForSommelier.name;
      queueMicrotask(() => {
        setSommelierTab('chat');
        const prompt = `Hola Don Aurelio, me gustaría saber más sobre el café "${coffeeName}". ¿Qué recomendaciones de preparación y notas me puedes dar?`;
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

  const isBusy = isLoading || streamingMessageId !== null;

  const handleQuickQuestion = (question: string) => {
    if (isBusy) return;
    handleSendPrompt(question);
  };

  const handleResetChat = async () => {
    handleStopStream();
    setMessages([INITIAL_WELCOME_MESSAGE]);
    try {
      localStorage.removeItem('aura_sommelier_chat');
      if (sessionId) {
        await resetSommelierSessionChat(sessionId);
      }
    } catch {
      // Ignorar
    }
  };

  const handleClearMemory = async () => {
    setUserMemory({});
    try {
      localStorage.removeItem('aura_user_memory');
      if (sessionId) {
        await forgetSommelierSessionMemory(sessionId);
      }
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

  // Test de Paladar ejecutado en el backend
  const handleCalculateMatch = async (milkChoice: 'solo' | 'con-leche') => {
    setQuizMilk(milkChoice);
    setIsQuizLoading(true);
    try {
      const result = await submitTasteQuiz({
        method: quizMethod,
        flavor: quizFlavor,
        milk: milkChoice,
        userMemory: memoryRef.current,
        sessionId: sessionId || undefined,
      });

      setQuizResult(result.winner);
      setQuizRunnerUp(result.runnerUp || null);
      setQuizMatchScore(result.matchScore);
      setQuizGrind(result.recommendedGrind);
      setUserMemory(result.updatedMemory);
      setQuizStep(4);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#8f461e', '#b4682c', '#d4a373'],
        });
      } catch {
        // Ignorar si confetti falla
      }
    } catch {
      // Si el backend no responde, mostrar fallback amigable desde productos cargados
      if (products.length > 0) {
        setQuizResult(products[0]);
        setQuizRunnerUp(products[1] || null);
        setQuizGrind(getDefaultGrindForMethod(quizMethod));
        setQuizStep(4);
      }
    } finally {
      setIsQuizLoading(false);
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
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsSommelierOpen(false)}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-3xl h-[92vh] max-h-[840px] bg-[#fbf9f5] border border-[#dcd2c2] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#29211b] z-10">
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-[#e6dfd4] bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-11 h-11 border-2 border-[#8f461e] bg-[#8f461e] text-white">
                <AvatarFallback className="bg-[#8f461e] text-white font-serif font-bold text-sm">
                  DA
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="sommelier-modal-title"
                  className="font-serif font-bold text-[#261f1a] text-base"
                >
                  Don Aurelio
                </h3>
                <Badge className="bg-[#f2ece2] text-[#6d5845] border border-[#ded5c6] text-[10px] px-1.5 py-0 font-medium">
                  Maestro Barista & Q-Grader
                </Badge>
              </div>
              <p className="text-xs text-[#6e5f52] hidden sm:block">
                Asesoría de cata & preparación artesanal • AURA Coffee
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs Switcher */}
            <div className="flex bg-[#f2ece2] p-1 rounded-xl border border-[#ded5c6] text-xs">
              <button
                onClick={() => setSommelierTab('chat')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  sommelierTab === 'chat'
                    ? 'bg-[#8f461e] text-white font-semibold shadow-xs'
                    : 'text-[#5c4e42] hover:text-[#29211b]'
                }`}
              >
                Charla con Barista
              </button>
              <button
                onClick={() => setSommelierTab('quiz')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  sommelierTab === 'quiz'
                    ? 'bg-[#8f461e] text-white font-semibold shadow-xs'
                    : 'text-[#5c4e42] hover:text-[#29211b]'
                }`}
              >
                Test de Paladar (30s)
              </button>
            </div>

            {sommelierTab === 'chat' && messages.length > 1 && (
              <button
                onClick={handleResetChat}
                className="p-2 text-[#7d6f62] hover:text-[#8f461e] rounded-lg hover:bg-[#f2ece2] transition-colors cursor-pointer"
                title="Reiniciar conversación"
                aria-label="Reiniciar conversación"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsSommelierOpen(false)}
              className="p-2 text-[#7d6f62] hover:text-[#29211b] rounded-lg hover:bg-[#f2ece2] transition-colors cursor-pointer"
              aria-label="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Preferencias de Cata Recordadas */}
        {hasActiveMemory && (
          <div className="px-4 sm:px-6 py-2 bg-[#f4ede3] border-b border-[#e2d6c6] flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[#8f461e] font-semibold flex items-center gap-1 mr-1">
                <BookmarkCheck className="w-3.5 h-3.5 text-[#8f461e]" />
                Preferencias guardadas:
              </span>
              {userMemory.preferredMethod && (
                <span className="px-2 py-0.5 rounded-full bg-white border border-[#ded5c6] text-[#382b20]">
                  Cafetera: <strong>{userMemory.preferredMethod}</strong>
                </span>
              )}
              {userMemory.flavorPreference && (
                <span className="px-2 py-0.5 rounded-full bg-white border border-[#ded5c6] text-[#382b20] capitalize">
                  Notas: <strong>{userMemory.flavorPreference}</strong>
                </span>
              )}
              {userMemory.milkPreference && (
                <span className="px-2 py-0.5 rounded-full bg-white border border-[#ded5c6] text-[#382b20]">
                  Servicio:{' '}
                  <strong>{userMemory.milkPreference === 'con-leche' ? 'Con Leche' : 'Negro'}</strong>
                </span>
              )}
              {userMemory.lowAcidity && (
                <span className="px-2 py-0.5 rounded-full bg-[#ecf7ed] border border-[#c3e6c6] text-[#2b6634]">
                  ✓ Acidez Suave
                </span>
              )}
            </div>

            <button
              onClick={handleClearMemory}
              className="text-[10px] text-[#78695c] hover:text-[#8f461e] underline cursor-pointer shrink-0"
            >
              Restablecer preferencias
            </button>
          </div>
        )}

        {/* Tab 1: Live Chat with Don Aurelio */}
        {sommelierTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#f8f5ee]">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-[#f1ebe0] border border-[#ded5c6] flex items-center justify-center shrink-0 text-[#8f461e] mt-1 shadow-xs">
                      <Coffee className="w-4 h-4" />
                    </div>
                  )}

                  <div className="max-w-[88%] sm:max-w-[80%] space-y-3">
                    {/* Bubble */}
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#8f461e] text-white rounded-tr-xs shadow-xs'
                          : 'bg-white border border-[#e2d8ca] text-[#29211b] rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <>
                          <FormattedMessage content={msg.content} />
                          {streamingMessageId === msg.id && (
                            <span
                              aria-label="Escribiendo..."
                              className="inline-block w-2 h-4 ml-1 align-middle bg-[#8f461e] animate-pulse rounded-xs"
                            />
                          )}
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>

                    {/* Embedded Recommended Coffee Cards */}
                    {msg.recommendedProductIds && msg.recommendedProductIds.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8f461e] flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" /> Granos recomendados para ti:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.recommendedProductIds.map((id) => {
                            const coffee =
                              msg.recommendedProducts?.find((c) => c.id === id) ||
                              products.find((c) => c.id === id);
                            if (!coffee) return null;
                            const defaultGrind = getDefaultGrindForMethod(
                              userMemory.preferredMethod
                            );
                            const selectedGrind = cardGrinds[coffee.id] || defaultGrind;
                            const isAdded = addedFeedback[coffee.id];

                            return (
                              <div
                                key={coffee.id}
                                className="p-3 rounded-xl bg-white border border-[#e2d8ca] flex flex-col gap-2.5 hover:border-[#bdafa0] transition-all shadow-xs group"
                              >
                                <div className="flex gap-3 items-center">
                                  <div className="relative w-14 h-16 rounded-lg overflow-hidden shrink-0 bg-[#f0e9df] border border-[#e2d8ca]">
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
                                      <h4 className="text-xs font-bold text-[#29211b] truncate">
                                        {coffee.name}
                                      </h4>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f2ece2] text-[#6d5845] font-bold shrink-0 border border-[#ded5c6]">
                                        SCA {coffee.scaScore}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-[#706154] truncate">
                                      {coffee.origin} • Tueste {coffee.roastLevel}
                                    </p>
                                    <p className="text-[10px] text-[#8f461e] truncate mt-0.5 font-medium">
                                      {coffee.tastingNotes.slice(0, 3).join(' • ')}
                                    </p>
                                  </div>
                                </div>

                                {/* Selector de molienda y botón de añadir */}
                                <div className="flex items-center gap-2 pt-1 border-t border-[#eee7dd]">
                                  <select
                                    value={selectedGrind}
                                    onChange={(e) =>
                                      setCardGrinds((prev) => ({
                                        ...prev,
                                        [coffee.id]: e.target.value as CartItem['grindOption'],
                                      }))
                                    }
                                    aria-label={`Molienda para ${coffee.name}`}
                                    className="flex-1 min-w-0 text-[10px] bg-[#faf7f2] border border-[#ded5c6] rounded-md px-2 py-1 text-[#29211b] focus:outline-none focus:border-[#8f461e]"
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

                                  <span className="text-xs font-bold text-[#261f1a] shrink-0">
                                    ${coffee.price.toFixed(2)}
                                  </span>

                                  <button
                                    onClick={() => handleAddFromModal(coffee, selectedGrind, false)}
                                    className={`text-[11px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-all shrink-0 ${
                                      isAdded
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-[#8f461e] hover:bg-[#783916] text-white'
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
                <div className="flex gap-3 items-center text-[#706154] text-xs py-2">
                  <div className="w-8 h-8 rounded-full bg-[#f2ece2] text-[#8f461e] flex items-center justify-center animate-spin">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <span className="italic">
                    Don Aurelio está preparando tu recomendación...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="px-4 py-2.5 border-t border-[#e6dfd4] bg-[#fbf9f5] flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
              <span className="text-[#8c7d6f] shrink-0 text-[11px]">Sugerencias:</span>
              {userMemory.preferredMethod ? (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    handleQuickQuestion(
                      `Según lo que recuerdas de mi gusto y mi ${userMemory.preferredMethod}, ¿qué café me recomiendas probar hoy?`
                    )
                  }
                  className="shrink-0 px-2.5 py-1 rounded-full bg-[#f2ece2] hover:bg-[#e8dec0] text-[#755943] border border-[#ded5c6] transition-colors cursor-pointer disabled:opacity-50"
                >
                  ☕ Recomendación para mi {userMemory.preferredMethod}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    handleQuickQuestion('¿Qué café me recomiendas para V60 que no sea ácido?')
                  }
                  className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-[#f6f1e9] text-[#4f4134] border border-[#ded5c6] hover:border-[#8f461e] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Para V60 con acidez suave
                </button>
              )}
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  handleQuickQuestion(
                    'Quiero un café con notas a chocolate intenso para tomar con leche'
                  )
                }
                className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-[#f6f1e9] text-[#4f4134] border border-[#ded5c6] hover:border-[#8f461e] transition-colors cursor-pointer disabled:opacity-50"
              >
                Con leche y notas a chocolate
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  handleQuickQuestion(
                    '¿Por qué el café Geisha es tan cotizado y qué lo distingue?'
                  )
                }
                className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-[#f6f1e9] text-[#4f4134] border border-[#ded5c6] hover:border-[#8f461e] transition-colors cursor-pointer disabled:opacity-50"
              >
                ¿Por qué el Geisha es especial?
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() =>
                  handleQuickQuestion(
                    'Suelo tener el estómago delicado, ¿cuál grano me sienta mejor?'
                  )
                }
                className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-[#f6f1e9] text-[#4f4134] border border-[#ded5c6] hover:border-[#8f461e] transition-colors cursor-pointer disabled:opacity-50"
              >
                Baja acidez para el estómago
              </button>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isBusy) handleSendPrompt();
              }}
              className="p-4 border-t border-[#e6dfd4] bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                maxLength={500}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Platícale a Don Aurelio (ej: 'Uso cafetera italiana y me gustan los sabores dulces')..."
                className="flex-1 bg-[#faf7f2] border border-[#ded5c6] text-sm text-[#29211b] placeholder:text-[#9c8e80] px-4 py-3 rounded-xl focus:outline-none focus:border-[#8f461e] transition-colors"
              />
              {isBusy ? (
                <Button
                  type="button"
                  onClick={handleStopStream}
                  className="bg-[#f2ece2] hover:bg-[#e8dec0] text-[#8f461e] border border-[#ded5c6] font-medium px-4 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-[#8f461e]" />
                  <span className="hidden sm:inline">Detener</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="bg-[#8f461e] hover:bg-[#783916] text-white font-medium px-4 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-xs border border-[#783916]"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Enviar</span>
                </Button>
              )}
            </form>
          </div>
        )}

        {/* Tab 2: 3-Step Taste Quiz */}
        {sommelierTab === 'quiz' && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#f8f5ee] flex flex-col justify-center">
            {/* Progress indicator */}
            {quizStep < 4 && (
              <div className="max-w-xs mx-auto w-full mb-6">
                <div className="flex justify-between text-[11px] text-[#78695c] mb-1.5">
                  <span>Progreso del test</span>
                  <span className="text-[#8f461e] font-semibold">Paso {quizStep} de 3</span>
                </div>
                <div className="h-1.5 w-full bg-[#e8dfd3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8f461e] transition-all duration-300"
                    style={{ width: `${(quizStep / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {quizStep === 1 && (
              <div className="max-w-xl mx-auto w-full space-y-6">
                <div className="text-center space-y-2">
                  <Badge className="bg-[#f0e8db] text-[#6d5743] border border-[#ded5c6]">
                    Paso 1 de 3 • Cafetera
                  </Badge>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#261f1a]">
                    ¿Qué método de extracción utilizas?
                  </h3>
                  <p className="text-sm text-[#66574a]">
                    El tueste y la molienda se comportan de forma distinta en cada cafetera.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    { id: 'V60', label: 'V60 / Cafetera de Goteo', desc: 'Resalta claridad y notas florales' },
                    { id: 'Chemex', label: 'Chemex', desc: 'Taza limpia, brillante y sedosa' },
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
                      className={`p-4 rounded-xl text-left border transition-all cursor-pointer shadow-xs ${
                        quizMethod === m.id
                          ? 'bg-white border-[#8f461e] text-[#29211b]'
                          : 'bg-white border-[#ded5c6] hover:border-[#8f461e] text-[#423427]'
                      }`}
                    >
                      <h5 className="font-semibold text-sm text-[#261f1a]">{m.label}</h5>
                      <p className="text-xs text-[#6e5f52] mt-1">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quizStep === 2 && (
              <div className="max-w-xl mx-auto w-full space-y-6">
                <div className="text-center space-y-2">
                  <Badge className="bg-[#f0e8db] text-[#6d5743] border border-[#ded5c6]">
                    Paso 2 de 3 • Notas de Sabor
                  </Badge>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#261f1a]">
                    ¿Qué sensaciones en taza buscas disfrutar?
                  </h3>
                  <p className="text-sm text-[#66574a]">
                    Cada variedad y proceso despierta notas naturales características.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    {
                      id: 'floral',
                      label: '🌸 Florales & Cítricos Nobles',
                      desc: 'Jazmín, bergamota, melocotón blanco y miel suave',
                    },
                    {
                      id: 'frutal',
                      label: '🍓 Frutas Silvestres & Exóticas',
                      desc: 'Arándanos, frambuesa madura, mandarina dulce',
                    },
                    {
                      id: 'chocolate',
                      label: '🍫 Chocolate Oscuro & Panela',
                      desc: 'Cacao belga, caramelo tostado y especias dulces',
                    },
                    {
                      id: 'decaf',
                      label: '🌙 Dulce & Sin Cafeína',
                      desc: 'Toffee, almendras tostadas y descanso reparador',
                    },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setQuizFlavor(f.id as 'floral' | 'frutal' | 'chocolate' | 'decaf');
                        setQuizStep(3);
                      }}
                      className={`p-4 rounded-xl text-left border transition-all cursor-pointer shadow-xs ${
                        quizFlavor === f.id
                          ? 'bg-white border-[#8f461e] text-[#29211b]'
                          : 'bg-white border-[#ded5c6] hover:border-[#8f461e] text-[#423427]'
                      }`}
                    >
                      <h5 className="font-semibold text-sm text-[#261f1a]">{f.label}</h5>
                      <p className="text-xs text-[#6e5f52] mt-1">{f.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setQuizStep(1)}
                    className="text-xs text-[#78695c] hover:text-[#8f461e] transition-colors cursor-pointer"
                  >
                    ← Volver al paso anterior
                  </button>
                </div>
              </div>
            )}

            {quizStep === 3 && (
              <div className="max-w-xl mx-auto w-full space-y-6">
                <div className="text-center space-y-2">
                  <Badge className="bg-[#f0e8db] text-[#6d5743] border border-[#ded5c6]">
                    Paso 3 de 3 • Forma de Tomarlo
                  </Badge>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#261f1a]">
                    ¿Cómo acostumbras beberlo?
                  </h3>
                  <p className="text-sm text-[#66574a]">
                    Algunos granos lucen mejor en taza negra; otros conservan su potencia con leche.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <button
                    disabled={isQuizLoading}
                    onClick={() => handleCalculateMatch('solo')}
                    className="p-5 rounded-xl text-left border bg-white border-[#ded5c6] hover:border-[#8f461e] text-[#29211b] cursor-pointer transition-all shadow-xs disabled:opacity-50"
                  >
                    <span className="text-2xl mb-2 block">☕</span>
                    <h5 className="font-semibold text-base text-[#261f1a]">Café Negro / Puro</h5>
                    <p className="text-xs text-[#66574a] mt-1">
                      Para apreciar la pureza del terruño y la acidez viva del grano.
                    </p>
                  </button>

                  <button
                    disabled={isQuizLoading}
                    onClick={() => handleCalculateMatch('con-leche')}
                    className="p-5 rounded-xl text-left border bg-white border-[#ded5c6] hover:border-[#8f461e] text-[#29211b] cursor-pointer transition-all shadow-xs disabled:opacity-50"
                  >
                    <span className="text-2xl mb-2 block">🥛</span>
                    <h5 className="font-semibold text-base text-[#261f1a]">
                      Con Leche o Bebida Vegetal
                    </h5>
                    <p className="text-xs text-[#66574a] mt-1">
                      Requiere granos con cuerpo denso que mantengan su presencia con notas a postre.
                    </p>
                  </button>
                </div>

                {isQuizLoading && (
                  <p className="text-center text-xs text-[#8f461e] animate-pulse font-medium">
                    Analizando perfil de sabor y buscando el mejor grano...
                  </p>
                )}

                <div className="text-center">
                  <button
                    onClick={() => setQuizStep(2)}
                    className="text-xs text-[#78695c] hover:text-[#8f461e] transition-colors cursor-pointer"
                  >
                    ← Volver al paso anterior
                  </button>
                </div>
              </div>
            )}

            {quizStep === 4 && quizResult && (
              <div className="max-w-xl mx-auto w-full space-y-5 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eaf4eb] border border-[#c6e3c8] text-[#2b6634] text-xs font-semibold">
                  <Sparkles className="w-4 h-4 text-[#2b6634]" /> {quizMatchScore}% Compatibilidad • Preferencias guardadas
                </div>

                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#261f1a]">
                    ¡Tu Café Ideal es {quizResult.name}!
                  </h3>
                  <p className="text-xs sm:text-sm text-[#66574a] max-w-md mx-auto leading-relaxed mt-1">
                    Para preparación en <strong className="text-[#8f461e]">{quizMethod}</strong> (
                    {quizMilk === 'con-leche' ? 'con leche' : 'taza negra'}), este microlote de{' '}
                    {quizResult.origin} es tu maridaje perfecto.
                  </p>
                </div>

                {/* Match Product Card */}
                <div className="p-5 rounded-2xl bg-white border border-[#e2d8ca] text-left flex flex-col sm:flex-row gap-5 items-center shadow-md">
                  <div className="relative w-28 h-36 rounded-xl overflow-hidden shrink-0 bg-[#f0e9df] border border-[#ded5c6]">
                    <Image
                      src={quizResult.image}
                      alt={quizResult.name}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-[#8f461e] text-white font-bold text-[10px] px-1.5 py-0.5 rounded shadow-xs">
                      SCA {quizResult.scaScore}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2.5 w-full">
                    <div>
                      <h4 className="font-serif text-lg font-bold text-[#261f1a]">
                        {quizResult.name}
                      </h4>
                      <p className="text-xs text-[#706154]">
                        {quizResult.origin}, {quizResult.country} • {quizResult.altitude}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {quizResult.tastingNotes.map((note) => (
                        <Badge
                          key={note}
                          variant="outline"
                          className="text-[10px] border-[#ded5c6] text-[#4f4033] bg-[#fbf9f5]"
                        >
                          {note}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-xs text-[#524438] italic">
                      &quot;{quizResult.sommelierQuote}&quot;
                    </p>

                    {/* Molienda recomendada */}
                    <div className="pt-1">
                      <label className="text-[10px] uppercase tracking-wider text-[#7d6f62] block mb-1">
                        Molienda sugerida para tu {quizMethod}:
                      </label>
                      <select
                        value={quizGrind}
                        onChange={(e) => setQuizGrind(e.target.value as CartItem['grindOption'])}
                        className="w-full text-xs bg-[#faf7f2] border border-[#ded5c6] rounded-lg px-2.5 py-1.5 text-[#29211b] focus:outline-none focus:border-[#8f461e]"
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
                      <span className="font-serif font-bold text-lg text-[#261f1a]">
                        ${quizResult.price.toFixed(2)} USD
                      </span>
                      <Button
                        onClick={() => handleAddFromModal(quizResult, quizGrind, true)}
                        className="bg-[#8f461e] hover:bg-[#783916] text-white font-medium px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs border border-[#783916]"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Añadir a la Cesta</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Runner-up Alternative */}
                {quizRunnerUp && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#ded5c6] flex items-center justify-between gap-3 text-left shadow-xs">
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider text-[#8f461e] font-semibold block">
                        Segunda alternativa (SCA {quizRunnerUp.scaScore}):
                      </span>
                      <p className="text-xs font-semibold text-[#29211b] truncate">
                        {quizRunnerUp.name} —{' '}
                        <span className="text-[#6e5f52] font-normal">
                          {quizRunnerUp.tastingNotes.slice(0, 2).join(', ')}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddFromModal(quizRunnerUp, quizGrind, false)}
                      className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-[#faf7f2] hover:bg-[#f1ebe0] border border-[#ded5c6] text-[#382b20] font-medium cursor-pointer transition-colors"
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
                    className="text-xs text-[#78695c] hover:text-[#8f461e] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Hacer el test de nuevo</span>
                  </button>
                  <span className="text-[#c4b6a5]">•</span>
                  <button
                    onClick={() => {
                      setSommelierTab('chat');
                      handleSendPrompt(
                        `Don Aurelio, completé el test y obtuve el grano "${quizResult.name}" para preparar en ${quizMethod}. ¿Me compartes tu receta paso a paso para prepararlo?`
                      );
                    }}
                    className="text-xs text-[#8f461e] hover:underline flex items-center gap-1 font-medium cursor-pointer"
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
