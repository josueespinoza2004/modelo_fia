'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { useCart } from '@/context/CartContext';
import { COFFEE_PRODUCTS } from '@/data/coffeeCatalog';
import { CoffeeProduct, BrewMethod } from '@/types/coffee';
import {
  Sparkles,
  X,
  Send,
  Coffee,
  Check,
  RotateCcw,
  ShoppingBag,
  Flame,
  Award,
  ChevronRight,
  Bot
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

export function SommelierModal() {
  const { isSommelierOpen, setIsSommelierOpen, selectedCoffeeForSommelier, addItem } = useCart();
  const [activeTab, setActiveTab] = useState<'chat' | 'quiz'>('chat');

  // Estado del chat
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '¡Un placer darte la bienvenida a nuestra tostaduría! Soy Don Aurelio, Maestro Sommelier y Q-Grader de AURA. Cuéntame: ¿qué método de extracción usas en casa o qué perfiles de sabor (frutal, floral, achocolatado o especiado) estás buscando experimentar hoy?',
      recommendedProductIds: ['geisha-la-esmeralda', 'pacamara-black-honey-dipilto'],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estado del Quiz Sensorial
  const [quizStep, setQuizStep] = useState(1);
  const [quizMethod, setQuizMethod] = useState<BrewMethod>('V60');
  const [quizFlavor, setQuizFlavor] = useState<'floral' | 'frutal' | 'chocolate' | 'decaf'>('frutal');
  const [quizMilk, setQuizMilk] = useState<'solo' | 'con-leche'>('solo');
  const [quizResult, setQuizResult] = useState<CoffeeProduct | null>(null);

  // Si se abre con un café específico seleccionado desde el catálogo
  useEffect(() => {
    if (selectedCoffeeForSommelier && isSommelierOpen) {
      setActiveTab('chat');
      const introMsg: Message = {
        id: `ask-${Date.now()}`,
        role: 'user',
        content: `Hola Don Aurelio, me interesa conocer más sobre el grano "${selectedCoffeeForSommelier.name}". ¿Qué me puedes decir sobre su origen y cómo extraer lo mejor de él?`,
      };
      setMessages((prev) => [...prev, introMsg]);
      handleSendPrompt(introMsg.content);
    }
  }, [selectedCoffeeForSommelier]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendPrompt = async (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Filtrar historial para la API
      const history = messages.slice(-5).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/sommelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      const data = await res.json();

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
              'Disculpa, el laboratorio está calibrando el tostador. Para cafés de método V60 te recomiendo nuestro Geisha La Esmeralda, y para espresso el Pacamara Black Honey.',
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
            'Tuvimos un breve lapso de conexión con la barra. Nuestro grano insigne es el Geisha Finca La Esmeralda (SCA 91.5 pts), pruébalo en método filtrado.',
          recommendedProductIds: ['geisha-la-esmeralda'],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
    handleSendPrompt(question);
  };

  // Lógica del Quiz
  const handleCalculateMatch = () => {
    let matchedId = 'bourbon-rosado-huila';
    if (quizFlavor === 'decaf') {
      matchedId = 'sugarcane-decaf-caldas';
    } else if (quizFlavor === 'floral') {
      matchedId = 'geisha-la-esmeralda';
    } else if (quizFlavor === 'chocolate' || quizMilk === 'con-leche') {
      matchedId = 'pacamara-black-honey-dipilto';
    } else if (quizMethod === 'Chemex' || quizFlavor === 'frutal') {
      matchedId = 'yirgacheffe-heirloom';
    }

    const matchedCoffee = COFFEE_PRODUCTS.find((p) => p.id === matchedId) || COFFEE_PRODUCTS[0];
    setQuizResult(matchedCoffee);
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
  };

  if (!isSommelierOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => setIsSommelierOpen(false)}
      />

      {/* Main Container */}
      <div className="relative w-full max-w-3xl h-[90vh] max-h-[820px] bg-[#140f0c] border border-amber-600/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 z-10">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-amber-600/20 bg-[#1c1512] flex items-center justify-between">
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
                <h3 className="font-serif font-bold text-amber-100 text-base">Don Aurelio</h3>
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0">
                  Sommelier Q-Grader
                </Badge>
              </div>
              <p className="text-xs text-zinc-400">
                Asesor Sensorial impulsado por Inteligencia Artificial de AURA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs Switcher */}
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'chat'
                    ? 'bg-amber-500 text-zinc-950 font-semibold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Chat Libre
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === 'quiz'
                    ? 'bg-amber-500 text-zinc-950 font-semibold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Test de Paladar (30s)
              </button>
            </div>

            <button
              onClick={() => setIsSommelierOpen(false)}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Live Chat with Don Aurelio */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#100c0a]">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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

                  <div className={`max-w-[85%] sm:max-w-[78%] space-y-3`}>
                    {/* Bubble */}
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-zinc-950 font-medium rounded-tr-xs'
                          : 'bg-zinc-900/90 border border-zinc-800 text-zinc-200 rounded-tl-xs shadow-lg'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
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
                            return (
                              <div
                                key={coffee.id}
                                className="p-3 rounded-xl bg-zinc-950/80 border border-amber-500/30 flex gap-3 items-center hover:border-amber-400 transition-all shadow-md group"
                              >
                                <div className="relative w-14 h-16 rounded-lg overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700">
                                  <Image
                                    src={coffee.image}
                                    alt={coffee.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <h4 className="text-xs font-bold text-zinc-100 truncate">
                                      {coffee.name}
                                    </h4>
                                    <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                                      {coffee.scaScore}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-zinc-400 truncate">{coffee.origin}</p>
                                  <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-xs font-bold text-amber-400">
                                      ${coffee.price.toFixed(2)}
                                    </span>
                                    <button
                                      onClick={() => addItem(coffee)}
                                      className="text-[11px] bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-2 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <ShoppingBag className="w-3 h-3" />
                                      <span>Añadir</span>
                                    </button>
                                  </div>
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
                  <span className="italic">Don Aurelio está analizando las notas de cata y extrayendo los mejores consejos...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="px-4 py-2 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
              <span className="text-zinc-500 shrink-0 text-[11px]">Sugerencias:</span>
              <button
                onClick={() => handleQuickQuestion('¿Qué café me recomiendas para V60 que no sea ácido?')}
                className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-amber-500 transition-colors"
              >
                Para V60 sin exceso de acidez
              </button>
              <button
                onClick={() => handleQuickQuestion('Quiero un café con notas a chocolate intenso para tomar con leche')}
                className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-amber-500 transition-colors"
              >
                Con leche y notas a chocolate
              </button>
              <button
                onClick={() => handleQuickQuestion('Explícame por qué el café Geisha de Panamá es tan famoso y caro')}
                className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-amber-500 transition-colors"
              >
                ¿Por qué el Geisha es especial?
              </button>
              <button
                onClick={() => handleQuickQuestion('Tengo reflujo o gastritis leve, ¿cuál grano me conviene?')}
                className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-amber-500 transition-colors"
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
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Pregúntale a Don Aurelio (ej: 'Recomiéndame un café dulce para prensa francesa')..."
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
        {activeTab === 'quiz' && (
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#100c0a] flex flex-col justify-center">
            {quizStep === 1 && (
              <div className="max-w-xl mx-auto w-full space-y-6">
                <div className="text-center space-y-2">
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Paso 1 de 3
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
                    Paso 2 de 3
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
                        setQuizFlavor(f.id as any);
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
                    className="text-xs text-zinc-500 hover:text-amber-400 transition-colors"
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
                    Paso 3 de 3
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
                    onClick={() => {
                      setQuizMilk('solo');
                      handleCalculateMatch();
                    }}
                    className="p-5 rounded-xl text-left border bg-zinc-900/60 border-zinc-800 hover:border-amber-500 text-zinc-200 cursor-pointer transition-all hover:bg-amber-500/10"
                  >
                    <span className="text-2xl mb-2 block">☕</span>
                    <h5 className="font-semibold text-base text-zinc-100">Puro / Café Negro</h5>
                    <p className="text-xs text-zinc-400 mt-1">
                      Para apreciar la pureza del terruño y la acidez viva del grano.
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setQuizMilk('con-leche');
                      handleCalculateMatch();
                    }}
                    className="p-5 rounded-xl text-left border bg-zinc-900/60 border-zinc-800 hover:border-amber-500 text-zinc-200 cursor-pointer transition-all hover:bg-amber-500/10"
                  >
                    <span className="text-2xl mb-2 block">🥛</span>
                    <h5 className="font-semibold text-base text-zinc-100">Con Leche o Bebida Vegetal</h5>
                    <p className="text-xs text-zinc-400 mt-1">
                      Requiere granos con cuerpo licoroso que mantengan su presencia y creen notas a postre.
                    </p>
                  </button>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setQuizStep(2)}
                    className="text-xs text-zinc-500 hover:text-amber-400 transition-colors"
                  >
                    ← Volver al paso anterior
                  </button>
                </div>
              </div>
            )}

            {quizStep === 4 && quizResult && (
              <div className="max-w-xl mx-auto w-full space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <Sparkles className="w-4 h-4" /> 98.4% Match Sensorial Calibrado
                </div>

                <h3 className="font-serif text-3xl font-bold text-amber-100">
                  ¡Tu Café Ideal es {quizResult.name}!
                </h3>
                <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                  Basado en tu preferencia por {quizFlavor} y extracción en {quizMethod}, este microlote de {quizResult.origin} es tu armonía perfecta.
                </p>

                {/* Match Product Card */}
                <div className="p-5 rounded-2xl bg-zinc-900/90 border border-amber-500/40 text-left flex flex-col sm:flex-row gap-5 items-center shadow-xl">
                  <div className="relative w-28 h-36 rounded-xl overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700">
                    <Image
                      src={quizResult.image}
                      alt={quizResult.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-amber-500 text-zinc-950 font-bold text-[10px] px-1.5 py-0.5 rounded">
                      SCA {quizResult.scaScore}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="font-serif text-lg font-bold text-amber-200">
                        {quizResult.name}
                      </h4>
                      <p className="text-xs text-zinc-400">
                        {quizResult.origin} • {quizResult.altitude}
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

                    <p className="text-xs text-zinc-300 italic pt-1">
                      &quot;{quizResult.sommelierQuote}&quot;
                    </p>

                    <div className="flex items-center justify-between pt-2">
                      <span className="font-bold text-base text-amber-400">
                        ${quizResult.price.toFixed(2)} USD
                      </span>
                      <Button
                        onClick={() => {
                          addItem(quizResult);
                          setIsSommelierOpen(false);
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Añadir a la Cesta</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4 pt-2">
                  <button
                    onClick={resetQuiz}
                    className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Hacer el test de nuevo</span>
                  </button>
                  <span className="text-zinc-600">•</span>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Preguntar detalles a Don Aurelio</span>
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
