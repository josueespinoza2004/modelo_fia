'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { calculateBrewRatio } from '@/lib/api';
import { BrewMethod, CartItem } from '@/types/coffee';
import {
  Droplet,
  Flame,
  Timer,
  Sparkles,
  Sliders,
  Calculator,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  ShoppingBag,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function getGrindForGuide(method: BrewMethod): CartItem['grindOption'] {
  switch (method) {
    case 'Espresso':
    case 'Moka':
      return 'Molienda Fina (Espresso)';
    case 'Prensa Francesa':
      return 'Molienda Gruesa (Prensa Francesa)';
    default:
      return 'Molienda Media (V60 / Filtro)';
  }
}

export function BrewGuideSection() {
  const { guides, products, openSommelierWithCoffee, addItem } = useCart();
  const [selectedMethod, setSelectedMethod] = useState<BrewMethod>('V60');
  const [coffeeGrams, setCoffeeGrams] = useState<number>(18);
  const [waterResult, setWaterResult] = useState<{ waterMl: number; bloomMl: number } | null>(null);

  // Cronómetro de extracción en vivo
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const guide = guides.find((g) => g.id === selectedMethod) || guides[0];

  // Consultar cálculo de ratio en el backend Python
  useEffect(() => {
    if (!guide) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await calculateBrewRatio(selectedMethod, coffeeGrams);
        if (!cancelled && res.success) {
          setWaterResult({ waterMl: res.waterMl, bloomMl: res.bloomMl });
        }
      } catch {
        // Fallback visual únicamente mientras responde la red
      }
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedMethod, coffeeGrams, guide]);

  if (!guide) {
    return (
      <section id="guia-extraccion" className="py-20 bg-[#100c0a] border-t border-amber-600/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-80 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
        </div>
      </section>
    );
  }

  const calculatedWater = waterResult?.waterMl ?? Math.round(coffeeGrams * guide.ratioMultiplier);
  const calculatedBloom = waterResult?.bloomMl ?? Math.round(coffeeGrams * 2.5);

  const recommendedProducts = guide.recommendedCoffees
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <section id="guia-extraccion" className="py-20 bg-[#100c0a] border-t border-amber-600/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Sliders className="w-4 h-4" />
            <span>Laboratorio Barista de AURA</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-50">
            Guía de Extracción de Precisión
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            El 98% de tu taza es agua. Dominar el ratio, la molienda y la temperatura es el secreto para extraer todas las notas florales y frutales sin amargor.
          </p>
        </div>

        {/* Method Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {guides.map((g) => (
            <button
              key={g.id}
              onClick={() => {
                setSelectedMethod(g.id);
                setIsRunning(false);
                setTimerSeconds(0);
              }}
              className={`px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all cursor-pointer border ${
                selectedMethod === g.id
                  ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-amber-500/40'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Method Details Card & Ratio Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Guide Parameters + Recommended Coffees */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-zinc-950/80 border border-amber-500/30 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Método de Extracción
                </span>
                <span className="text-xs text-zinc-400 font-mono">Guía de Especialidad</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-amber-100">
                {guide.name}
              </h3>
              <p className="text-sm text-zinc-300 mt-1 italic">&quot;{guide.tagline}&quot;</p>
            </div>

            {/* 4 Tech metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <Droplet className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-[10px] text-zinc-400 uppercase font-medium block">
                  Ratio Base
                </span>
                <span className="text-xs sm:text-sm font-bold text-zinc-100">{guide.ratio}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <Flame className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-[10px] text-zinc-400 uppercase font-medium block">
                  Temp. Agua
                </span>
                <span className="text-xs sm:text-sm font-bold text-zinc-100">
                  {guide.waterTemp}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <Timer className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-[10px] text-zinc-400 uppercase font-medium block">
                  Tiempo Total
                </span>
                <span className="text-xs sm:text-sm font-bold text-zinc-100">{guide.brewTime}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <Sliders className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-[10px] text-zinc-400 uppercase font-medium block">
                  Molienda
                </span>
                <span className="text-xs sm:text-sm font-bold text-zinc-100">{guide.grind}</span>
              </div>
            </div>

            {/* Pro Barista Tip */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-600/30">
              <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> Secreto de Barra:
              </h5>
              <p className="text-xs text-zinc-300 leading-relaxed">{guide.tips}</p>
            </div>

            {/* Recommended Coffees for this Method */}
            {recommendedProducts.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" /> Microlotes calibrados para {guide.id}:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {recommendedProducts.map((coffee) => (
                    <div
                      key={coffee.id}
                      className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/40 flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <h6 className="text-xs font-bold text-zinc-100 truncate">{coffee.name}</h6>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {coffee.tastingNotes.slice(0, 2).join(' • ')} • ${coffee.price.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => addItem(coffee, getGrindForGuide(guide.id))}
                        title={`Añadir con ${getGrindForGuide(guide.id)}`}
                        className="shrink-0 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Añadir</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Interactive Ratio Calculator + Live Brew Timer */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-zinc-950 to-[#140f0c] border border-amber-500/40 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-5 h-5 text-amber-400" />
                <h4 className="font-serif text-lg font-bold text-amber-100">
                  Calculadora de Ratio & Cronómetro
                </h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ajusta la dosis de café seco para obtener el agua exacta y cronometra tu extracción en tiempo real.
              </p>
            </div>

            {/* Slider / Gram input */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-300 font-medium">Gramos de café seco:</span>
                <span className="text-xl font-serif font-bold text-amber-400">{coffeeGrams} g</span>
              </div>

              <input
                type="range"
                min="10"
                max="40"
                step="1"
                value={coffeeGrams}
                onChange={(e) => setCoffeeGrams(Number(e.target.value))}
                aria-label="Gramos de café seco"
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>10g (1 taza ligera)</span>
                <span>20g (2 tazas)</span>
                <span>40g (Jarra Chemex)</span>
              </div>

              {/* Calculated Results Box */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-amber-500/30 text-center space-y-1">
                <span className="text-[11px] text-zinc-400 block uppercase font-medium">
                  {selectedMethod === 'Espresso'
                    ? 'Rendimiento Líquido en Taza (Ratio 1:2):'
                    : `Agua Caliente Requerida (${guide.waterTemp}):`}
                </span>
                <span className="font-serif text-3xl font-extrabold text-amber-300">
                  {calculatedWater} ml / gramos
                </span>
                {selectedMethod !== 'Espresso' && (
                  <span className="text-[10px] text-emerald-400 block">
                    ✓ Pre-infusión (Bloom) sugerida: primeros {calculatedBloom} ml por 40s
                  </span>
                )}
              </div>

              {/* Interactive Brew Timer */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                    Cronómetro Barista ({guide.brewTime})
                  </span>
                  <span className="font-mono text-2xl font-bold text-amber-100">
                    {formatTime(timerSeconds)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRunning((r) => !r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isRunning
                        ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                        : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Iniciar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsRunning(false);
                      setTimerSeconds(0);
                    }}
                    title="Reiniciar cronómetro"
                    aria-label="Reiniciar cronómetro"
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Ask Don Aurelio CTA */}
            <Button
              onClick={() => openSommelierWithCoffee()}
              className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-zinc-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-600/25"
            >
              <Sparkles className="w-4 h-4" />
              <span>Pedir Receta Personalizada a Don Aurelio</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
