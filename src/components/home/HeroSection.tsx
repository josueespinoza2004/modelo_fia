'use client';

import React from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { ArrowDown, Sprout, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function HeroSection() {
  const { openSommelierWithCoffee } = useCart();

  return (
    <section className="relative overflow-hidden pt-10 pb-20 lg:pt-16 lg:pb-28 bg-[#fbf9f5]">
      {/* Background warm wash */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#f3ede3] rounded-full blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#f4ece1] rounded-full blur-3xl opacity-60 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Top pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f2ece2] border border-[#e4dacb] text-[#755943] text-xs font-semibold">
              <Sprout className="w-3.5 h-3.5 text-[#8f461e]" />
              <span>Tostaduría Artesanal • Cosechas de Origen 2026</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#261f1a] leading-[1.15]">
              El café no se bebe con prisa,{' '}
              <span className="text-[#8f461e] italic font-normal">
                se descubre en cada taza.
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#615347] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Microlotes arábica de estricta altura, tostados lentamente por convección y calificados con más de{' '}
              <strong className="text-[#261f1a] font-semibold">86 puntos SCA</strong>. 
              Conversa con <span className="text-[#8f461e] font-semibold">Don Aurelio</span>, nuestro maestro barista, para elegir el grano perfecto según tu cafetera y tus notas preferidas.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Button
                onClick={() => openSommelierWithCoffee(undefined, 'quiz')}
                id="hero-sommelier-quiz-btn"
                className="w-full sm:w-auto bg-[#8f461e] hover:bg-[#783916] text-white font-medium px-7 py-6 rounded-full text-base shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer border border-[#783916]"
              >
                <Compass className="w-5 h-5 text-amber-200" />
                <span>Test de Paladar (30s)</span>
              </Button>

              <a
                href="#catalogo"
                className="w-full sm:w-auto px-7 py-3 rounded-full border border-[#ded5c6] bg-white hover:bg-[#f6f1e9] text-[#3d3126] font-medium text-base transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Ver Cosecha de Granos</span>
                <ArrowDown className="w-4 h-4 text-[#8f461e]" />
              </a>
            </div>

            {/* Trust Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[#e8dfd2] max-w-lg mx-auto lg:mx-0 text-left">
              <div>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#261f1a] block">
                  91.5
                </span>
                <span className="text-xs text-[#756658] font-medium">Puntaje Máx. SCA</span>
              </div>
              <div>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#261f1a] block">
                  100%
                </span>
                <span className="text-xs text-[#756658] font-medium">Arábica de Altura</span>
              </div>
              <div>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#261f1a] block">
                  72 hrs
                </span>
                <span className="text-xs text-[#756658] font-medium">Frescura de Tueste</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Hero Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Clean Image Container with Natural Shadow */}
              <div className="relative rounded-2xl overflow-hidden border border-[#e4dacf] shadow-xl bg-[#f2ece2] aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]">
                <Image
                  src="/images/hero-coffee.jpg"
                  alt="Extracción artesanal de café de especialidad V60"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />

                {/* Gentle natural vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                {/* Floating Card at bottom of hero */}
                <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-[#e8dfd2] shadow-md text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#8f461e] uppercase tracking-wider flex items-center gap-1.5">
                      Microlote de la Semana
                    </span>
                    <Badge className="bg-[#f0e8db] text-[#5e4936] font-bold text-[10px] border border-[#ded4c4]">
                      SCA 91.5
                    </Badge>
                  </div>
                  <h4 className="font-serif text-base font-bold text-[#261f1a]">
                    Geisha Finca La Esmeralda (Panamá)
                  </h4>
                  <p className="text-xs text-[#6e5f52] line-clamp-1 mt-0.5">
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
