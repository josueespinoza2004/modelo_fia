'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { calculateBrewRatio } from '@/lib/api';
import { BrewMethod, CartItem } from '@/types/coffee';
import {
  Droplet,
  Flame,
  Timer,
  Sliders,
  Calculator,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  ShoppingBag,
  Award,
  MessageSquareQuote,
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
      <section id="guia-extraccion" className="py-20 bg-[#f5f0e8] border-t border-[#e6dfd4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-80 rounded-2xl bg-[#eae2d5] border border-[#ded5c6] animate-pulse" />
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
    <section id="guia-extraccion" className="py-20 bg-[#f5f0e8] border-t border-[#e6dfd4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eae2d5] border border-[#dcd3c3] text-[#6d5743] text-xs font-semibold">
            <Sliders className="w-3.5 h-3.5 text-[#8f461e]" />
            <span>Taller del Barista</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#261f1a]">
            Guía de Extracción de Precisión
          </h2>
          <p className="text-sm sm:text-base text-[#66574a]">
            El 98% de tu taza es agua. Dominar el ratio, la molienda y la temperatura es el secreto para resaltar las notas florales y frutales sin amargor.
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
                  ? 'bg-[#8f461e] text-white border-[#7a3915] shadow-xs font-semibold'
                  : 'bg-white text-[#4f4337] border-[#ded5c6] hover:border-[#8f461e] hover:text-[#8f461e]'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Method Details Card & Ratio Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Guide Parameters + Recommended Coffees */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-white border border-[#e2d8ca] shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#8f461e] uppercase tracking-wider">
                  Método de Extracción
                </span>
                <span className="text-xs text-[#7d6f62] font-mono">Calibración de Barra</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#261f1a]">
                {guide.name}
              </h3>
              <p className="text-sm text-[#66574a] mt-1 italic">&quot;{guide.tagline}&quot;</p>
            </div>

            {/* 4 Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e8dfd3]">
                <Droplet className="w-5 h-5 text-[#8f461e] mb-1" />
                <span className="text-[10px] text-[#7d6f62] uppercase font-medium block">
                  Ratio Base
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#29211b]">{guide.ratio}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e8dfd3]">
                <Flame className="w-5 h-5 text-[#8f461e] mb-1" />
                <span className="text-[10px] text-[#7d6f62] uppercase font-medium block">
                  Temp. Agua
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#29211b]">
                  {guide.waterTemp}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e8dfd3]">
                <Timer className="w-5 h-5 text-[#8f461e] mb-1" />
                <span className="text-[10px] text-[#7d6f62] uppercase font-medium block">
                  Tiempo Total
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#29211b]">{guide.brewTime}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e8dfd3]">
                <Sliders className="w-5 h-5 text-[#8f461e] mb-1" />
                <span className="text-[10px] text-[#7d6f62] uppercase font-medium block">
                  Molienda
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#29211b]">{guide.grind}</span>
              </div>
            </div>

            {/* Pro Barista Tip */}
            <div className="p-4 rounded-xl bg-[#f5efe7] border border-[#e2d6c6]">
              <h5 className="text-xs font-bold text-[#8f461e] flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#8f461e]" /> Secreto del Barista:
              </h5>
              <p className="text-xs text-[#524438] leading-relaxed">{guide.tips}</p>
            </div>

            {/* Recommended Coffees for this Method */}
            {recommendedProducts.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-[#eee7dd]">
                <span className="text-xs font-semibold text-[#8f461e] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#8f461e]" /> Microlotes calibrados para {guide.id}:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {recommendedProducts.map((coffee) => (
                    <div
                      key={coffee.id}
                      className="p-3 rounded-xl bg-[#faf7f2] border border-[#e8dfd3] hover:border-[#bdafa0] flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <h6 className="text-xs font-bold text-[#29211b] truncate">{coffee.name}</h6>
                        <p className="text-[10px] text-[#78695c] truncate">
                          {coffee.tastingNotes.slice(0, 2).join(' • ')} • ${coffee.price.toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => addItem(coffee, getGrindForGuide(guide.id))}
                        title={`Añadir con ${getGrindForGuide(guide.id)}`}
                        className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#8f461e] hover:bg-[#783916] text-white font-medium text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
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
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-white border border-[#e2d8ca] shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-5 h-5 text-[#8f461e]" />
                <h4 className="font-serif text-lg font-bold text-[#261f1a]">
                  Calculadora de Ratio & Cronómetro
                </h4>
              </div>
              <p className="text-xs text-[#66574a] leading-relaxed">
                Ajusta la dosis de café seco para obtener el agua exacta y cronometra tu extracción en tiempo real.
              </p>
            </div>

            {/* Slider / Gram input */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#594d42] font-medium">Gramos de café seco:</span>
                <span className="text-xl font-serif font-bold text-[#8f461e]">{coffeeGrams} g</span>
              </div>

              <input
                type="range"
                min="10"
                max="40"
                step="1"
                value={coffeeGrams}
                onChange={(e) => setCoffeeGrams(Number(e.target.value))}
                aria-label="Gramos de café seco"
                className="w-full accent-[#8f461e] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8c7e72]">
                <span>10g (1 taza ligera)</span>
                <span>20g (2 tazas)</span>
                <span>40g (Jarra Chemex)</span>
              </div>

              {/* Calculated Results Box */}
              <div className="p-4 rounded-xl bg-[#faf7f2] border border-[#e8dfd3] text-center space-y-1">
                <span className="text-[11px] text-[#706154] block uppercase font-medium">
                  {selectedMethod === 'Espresso'
                    ? 'Rendimiento Líquido en Taza (Ratio 1:2):'
                    : `Agua Caliente Requerida (${guide.waterTemp}):`}
                </span>
                <span className="font-serif text-3xl font-extrabold text-[#261f1a]">
                  {calculatedWater} ml / gramos
                </span>
                {selectedMethod !== 'Espresso' && (
                  <span className="text-[11px] text-[#33683f] font-medium block">
                    ✓ Pre-infusión sugerida: primeros {calculatedBloom} ml durante 40s
                  </span>
                )}
              </div>

              {/* Interactive Brew Timer */}
              <div className="p-3.5 rounded-xl bg-[#faf7f2] border border-[#e8dfd3] flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#7d6f62] block">
                    Cronómetro Barista ({guide.brewTime})
                  </span>
                  <span className="font-mono text-2xl font-bold text-[#261f1a]">
                    {formatTime(timerSeconds)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRunning((r) => !r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs ${
                      isRunning
                        ? 'bg-[#f0e4d5] text-[#8f461e] border border-[#d8c5b0]'
                        : 'bg-[#8f461e] text-white hover:bg-[#783916]'
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
                    className="p-1.5 rounded-lg bg-white hover:bg-[#f2ece2] text-[#6b5c4f] border border-[#ded5c6] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Ask Don Aurelio CTA */}
            <Button
              onClick={() => openSommelierWithCoffee()}
              className="w-full bg-[#8f461e] hover:bg-[#783916] text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-[#783916]"
            >
              <MessageSquareQuote className="w-4 h-4 text-amber-200" />
              <span>Pedir Receta Personalizada a Don Aurelio</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
