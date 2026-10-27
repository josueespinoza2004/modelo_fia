'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { BREWING_GUIDES } from '@/data/coffeeCatalog';
import { BrewMethod } from '@/types/coffee';
import { Droplet, Flame, Timer, Sparkles, Sliders, Calculator, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BrewGuideSection() {
  const { openSommelierWithCoffee } = useCart();
  const [selectedMethod, setSelectedMethod] = useState<BrewMethod>('V60');
  const [coffeeGrams, setCoffeeGrams] = useState<number>(18);

  const guide = BREWING_GUIDES.find((g) => g.id === selectedMethod) || BREWING_GUIDES[0];

  // Cálculo de ratio dinámico
  const ratioMultiplier =
    selectedMethod === 'Espresso' ? 2 : selectedMethod === 'Aeropress' ? 14 : selectedMethod === 'Chemex' ? 15 : 16;
  const calculatedWater = Math.round(coffeeGrams * ratioMultiplier);

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
          {BREWING_GUIDES.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedMethod(g.id)}
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
          {/* Left: Guide Parameters */}
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
              <p className="text-sm text-zinc-300 mt-1 italic">
                &quot;{guide.tagline}&quot;
              </p>
            </div>

            {/* 4 Tech metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <Droplet className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-[10px] text-zinc-400 uppercase font-medium block">Ratio Base</span>
                <span className="text-xs sm:text-sm font-bold text-zinc-100">{guide.ratio}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <Flame className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-[10px] text-zinc-400 uppercase font-medium block">Temp. Agua</span>
                <span className="text-xs sm:text-sm font-bold text-zinc-100">{guide.waterTemp}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <Timer className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-[10px] text-zinc-400 uppercase font-medium block">Tiempo Total</span>
                <span className="text-xs sm:text-sm font-bold text-zinc-100">{guide.brewTime}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <Sliders className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-[10px] text-zinc-400 uppercase font-medium block">Molienda</span>
                <span className="text-xs sm:text-sm font-bold text-zinc-100">{guide.grind}</span>
              </div>
            </div>

            {/* Pro Barista Tip */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-600/30">
              <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> Secreto de Barra:
              </h5>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {guide.tips}
              </p>
            </div>
          </div>

          {/* Right: Interactive Ratio Calculator */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-zinc-950 to-[#140f0c] border border-amber-500/40 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-5 h-5 text-amber-400" />
                <h4 className="font-serif text-lg font-bold text-amber-100">
                  Calculadora de Ratio en Vivo
                </h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ajusta la cantidad de café que tienes en casa para obtener la cantidad exacta de agua para tu {guide.name}.
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
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>10g (1 taza ligera)</span>
                <span>20g (2 tazas)</span>
                <span>40g (Jarrita Chemex)</span>
              </div>

              {/* Calculated Results Box */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-amber-500/30 text-center space-y-1">
                <span className="text-[11px] text-zinc-400 block uppercase font-medium">
                  Agua Caliente Requerida ({guide.waterTemp}):
                </span>
                <span className="font-serif text-3xl font-extrabold text-amber-300">
                  {calculatedWater} ml / gramos
                </span>
                <span className="text-[10px] text-emerald-400 block">
                  ✓ Pre-infusión sugerida con los primeros {Math.round(coffeeGrams * 2.5)} ml
                </span>
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
