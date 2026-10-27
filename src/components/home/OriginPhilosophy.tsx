'use client';

import React from 'react';
import { HeartHandshake, ShieldCheck, Sparkles, MapPin, Coffee } from 'lucide-react';

export function OriginPhilosophy() {
  return (
    <section id="filosofia" className="py-20 bg-[#0d0a09] border-t border-amber-600/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <MapPin className="w-4 h-4" />
              <span>Trazabilidad 100% Transparente</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-50 leading-tight">
              Del Cafetal a Tu Taza, <br />
              <span className="text-amber-400 italic">Sin Intermediarios Oscuros.</span>
            </h2>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
              En AURA creemos que un café verdaderamente excepcional no puede existir a expensas de quienes lo cosechan. Por eso practicamos el <strong className="text-amber-200">Comercio Directo de Relación</strong>: visitamos las fincas, conocemos a las familias caficultoras y pagamos primas de calidad muy por encima del precio de bolsa internacional.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100">Cosecha Manual Selectiva</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Solo se recolectan cerezas en su punto óptimo de maduración Brix (medido con refractómetro en campo).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100">Primas de Sostenibilidad a Productores</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Garantizamos ingresos dignos que financian escuelas locales y prácticas de conservación de fuentes hídricas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100">Curaduría por Catadores Q-Grader</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Cada lote es catado a ciegas siguiendo los protocolos estrictos de la Specialty Coffee Association (SCA).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual Stats Card */}
          <div className="lg:col-span-6">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-zinc-950 via-[#18120e] to-zinc-950 border border-amber-500/30 shadow-2xl space-y-6">
              <div className="border-b border-zinc-800 pb-6">
                <span className="text-xs font-serif italic text-amber-300 block mb-2">
                  Manifiesto de Tueste:
                </span>
                <blockquote className="font-serif text-xl sm:text-2xl text-zinc-100 font-medium leading-relaxed">
                  &quot;El tostador no inventa los sabores del café; su deber sagrado es no destruirlos en el fuego.&quot;
                </blockquote>
                <p className="text-xs text-amber-400 font-semibold mt-3">
                  — Don Aurelio, Maestro Tostador & Q-Grader en AURA
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
                  <span className="font-serif text-3xl font-bold text-amber-300 block">4</span>
                  <span className="text-xs text-zinc-400 mt-1 block">Países de Origen Exclusivo</span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
                  <span className="font-serif text-3xl font-bold text-amber-300 block">&gt; 1,500m</span>
                  <span className="text-xs text-zinc-400 mt-1 block">Altitud Media de Cosecha</span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
                  <span className="font-serif text-3xl font-bold text-amber-300 block">12 kg</span>
                  <span className="text-xs text-zinc-400 mt-1 block">Capacidad Máx. por Batch</span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-center">
                  <span className="font-serif text-3xl font-bold text-amber-300 block">100%</span>
                  <span className="text-xs text-zinc-400 mt-1 block">Empaques Biodegradables</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
