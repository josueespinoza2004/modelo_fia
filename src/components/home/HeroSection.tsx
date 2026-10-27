'use client';

import React from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { Sparkles, ArrowDown, Award, Flame, Droplet, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function HeroSection() {
  const { openSommelierWithCoffee } = useCart();

  return (
    <section className="relative overflow-hidden pt-8 pb-20 lg:pt-14 lg:pb-32">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Sommelier con IA & Tostaduría de Vanguardia</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-amber-50 leading-[1.1]">
              El Café No Se Toma, <br />
              <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent italic">
                Se Experimenta.
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Microlotes exclusivos de altura, tueste artesanal en pequeños lotes y puntuaciones superiores a <strong className="text-amber-300">86 puntos SCA</strong>. 
              Conversa con <span className="text-amber-300 font-semibold underline decoration-amber-500/60 underline-offset-4">Don Aurelio</span>, nuestro maestro sommelier virtual entrenado para calibrar el grano perfecto para tu paladar y tu cafetera.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Button
                onClick={() => openSommelierWithCoffee()}
                id="hero-sommelier-quiz-btn"
                className="w-full sm:w-auto bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-zinc-950 font-bold px-7 py-6 rounded-full text-base shadow-xl shadow-amber-600/30 hover:brightness-110 transition-all flex items-center justify-center gap-2.5 cursor-pointer group"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Test de Paladar en 30s</span>
              </Button>

              <a
                href="#catalogo"
                className="w-full sm:w-auto px-7 py-3 rounded-full border border-amber-500/30 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 hover:text-white font-medium text-base transition-colors flex items-center justify-center gap-2"
              >
                <span>Explorar Granos</span>
                <ArrowDown className="w-4 h-4 text-amber-400" />
              </a>
            </div>

            {/* Trust Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-zinc-800/80 max-w-lg mx-auto lg:mx-0 text-left">
              <div>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-amber-200 block">
                  91.5
                </span>
                <span className="text-xs text-zinc-400 font-medium">Puntaje Máx. SCA</span>
              </div>
              <div>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-amber-200 block">
                  100%
                </span>
                <span className="text-xs text-zinc-400 font-medium">Arábica Especialidad</span>
              </div>
              <div>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-amber-200 block">
                  72 hrs
                </span>
                <span className="text-xs text-zinc-400 font-medium">Frescura de Tueste</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Hero Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer decorative glow frame */}
              <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-b from-amber-500/40 via-amber-700/20 to-transparent blur-xl" />

              {/* Main Image Container */}
              <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl bg-zinc-950 aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]">
                <Image
                  src="/images/hero-coffee.jpg"
                  alt="Extracción artesanal de café de especialidad V60"
                  fill
                  priority
                  className="object-cover"
                />

                {/* Dark gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Floating Interactive Badge at bottom of hero */}
                <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-zinc-950/85 backdrop-blur-md border border-amber-500/40 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" /> Microlote de la Semana
                    </span>
                    <Badge className="bg-amber-500 text-zinc-950 font-bold text-[10px]">
                      SCA 91.5
                    </Badge>
                  </div>
                  <h4 className="font-serif text-base font-bold text-zinc-100">
                    Geisha Finca La Esmeralda (Panamá)
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                    Notas de jazmín blanco, bergamota y melocotón. Tueste ligero para goteo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
