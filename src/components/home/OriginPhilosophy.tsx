import React from 'react';
import { HeartHandshake, ShieldCheck, MapPin, Coffee } from 'lucide-react';

export function OriginPhilosophy() {
  return (
    <section id="filosofia" className="py-20 bg-[#fbf9f5] border-t border-[#e6dfd4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f1ebe0] border border-[#e1d7c7] text-[#785d47] text-xs font-semibold">
              <MapPin className="w-4 h-4 text-[#8f461e]" />
              <span>Trazabilidad 100% Transparente</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#261f1a] leading-tight">
              Del cafetal a tu taza, <br />
              <span className="text-[#8f461e] italic font-normal">con respeto por la tierra y el origen.</span>
            </h2>

            <p className="text-[#615347] text-sm sm:text-base leading-relaxed">
              En AURA creemos que un café verdaderamente excepcional no puede existir a expensas de quienes lo cosechan. Por eso practicamos el <strong className="text-[#261f1a] font-semibold">Comercio Directo de Relación</strong>: visitamos las fincas, conocemos a las familias caficultoras y pagamos primas de calidad muy por encima del precio de bolsa internacional.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-[#f2ece2] text-[#8f461e] shrink-0 mt-0.5 border border-[#e4dacf]">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#261f1a]">Cosecha Manual Selectiva</h4>
                  <p className="text-xs text-[#66574a] leading-relaxed">
                    Solo se recolectan cerezas en su punto óptimo de maduración Brix (medido con refractómetro en campo).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-[#f2ece2] text-[#8f461e] shrink-0 mt-0.5 border border-[#e4dacf]">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#261f1a]">Primas de Sostenibilidad a Productores</h4>
                  <p className="text-xs text-[#66574a] leading-relaxed">
                    Garantizamos ingresos dignos que financian escuelas locales y prácticas de conservación de fuentes hídricas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-[#f2ece2] text-[#8f461e] shrink-0 mt-0.5 border border-[#e4dacf]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#261f1a]">Curaduría por Catadores Q-Grader</h4>
                  <p className="text-xs text-[#66574a] leading-relaxed">
                    Cada lote es catado a ciegas siguiendo los protocolos estrictos de la Specialty Coffee Association (SCA).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual Stats Card */}
          <div className="lg:col-span-6">
            <div className="p-8 rounded-3xl bg-[#f5f0e8] border border-[#e2d8ca] shadow-sm space-y-6">
              <div className="border-b border-[#ded4c5] pb-6">
                <span className="text-xs font-serif italic text-[#8f461e] block mb-2 font-medium">
                  Manifiesto de Tueste:
                </span>
                <blockquote className="font-serif text-xl sm:text-2xl text-[#261f1a] font-medium leading-relaxed">
                  &quot;El tostador no inventa los sabores del café; su deber sagrado es no destruirlos en el fuego.&quot;
                </blockquote>
                <p className="text-xs text-[#736355] font-medium mt-3">
                  — Don Aurelio, Maestro Tostador & Q-Grader en AURA
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white border border-[#e4dacf] text-center shadow-xs">
                  <span className="font-serif text-3xl font-bold text-[#8f461e] block">5</span>
                  <span className="text-xs text-[#6e5f52] mt-1 block">Países de Origen Exclusivo</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#e4dacf] text-center shadow-xs">
                  <span className="font-serif text-3xl font-bold text-[#8f461e] block">&gt; 1,500m</span>
                  <span className="text-xs text-[#6e5f52] mt-1 block">Altitud Media de Cosecha</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#e4dacf] text-center shadow-xs">
                  <span className="font-serif text-3xl font-bold text-[#8f461e] block">12 kg</span>
                  <span className="text-xs text-[#6e5f52] mt-1 block">Capacidad Máx. por Batch</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#e4dacf] text-center shadow-xs">
                  <span className="font-serif text-3xl font-bold text-[#8f461e] block">100%</span>
                  <span className="text-xs text-[#6e5f52] mt-1 block">Empaques Biodegradables</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
