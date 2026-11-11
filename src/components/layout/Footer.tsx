'use client';

import React, { useState } from 'react';
import { Coffee, ShieldCheck, HeartHandshake, Leaf, ArrowRight, CheckCircle2 } from 'lucide-react';
import { subscribeNewsletter } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [couponCode, setCouponCode] = useState('AURA15');
  const [subError, setSubError] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubError('');
    try {
      const res = await subscribeNewsletter(email);
      if (res.success) {
        if (res.couponCode) setCouponCode(res.couponCode);
        setSubscribed(true);
        setEmail('');
      } else {
        setSubError(res.error || 'No se pudo completar la suscripción');
      }
    } catch {
      setSubError('Error conectando con el servidor');
    }
  };

  return (
    <footer className="w-full bg-[#0a0807] border-t border-amber-600/20 pt-16 pb-12 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value props banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-zinc-800/80 mb-12">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-zinc-100 font-semibold mb-1">Calidad SCA 86+ Puntos</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Únicamente tostamos microlotes certificados por Q-Graders independientes. Cero defectos primarios.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-zinc-100 font-semibold mb-1">Comercio Directo y Justo</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Pagamos hasta 2.8x sobre el precio de bolsa internacional directamente a las familias caficultoras.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-zinc-100 font-semibold mb-1">Tueste Fresco Bajo Demanda</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tostamos semanalmente en lotes pequeños (máximo 12kg) y despachamos dentro de las 72 horas del tueste.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-zinc-950 font-bold">
                <Coffee className="w-5 h-5 fill-zinc-950" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-wider text-amber-100">
                AURA
              </span>
            </div>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              Tostaduría boutique y laboratorio de café de especialidad. Conectamos amantes del café con los terruños más extraordinarios del mundo a través de la ciencia, el tueste artesanal y la inteligencia sensorial.
            </p>
            <div className="text-xs text-amber-400/90 font-mono">
              ✦ Temperatura de tueste controlada por perfiles térmicos de convección limpia.
            </div>
          </div>

          {/* Nav Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
              Navegación
            </h5>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#catalogo" className="hover:text-amber-400 transition-colors">
                  Microlotes de Origen
                </a>
              </li>
              <li>
                <a href="#perfil-sensorial" className="hover:text-amber-400 transition-colors">
                  Rueda de Sabores y Notas
                </a>
              </li>
              <li>
                <a href="#guia-extraccion" className="hover:text-amber-400 transition-colors">
                  Ratios V60, Chemex y Espresso
                </a>
              </li>
              <li>
                <a href="#filosofia" className="hover:text-amber-400 transition-colors">
                  Trazabilidad de Fincas
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="md:col-span-4 space-y-4">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-amber-200">
              Club de Catadores AURA
            </h5>
            <p className="text-sm text-zinc-400">
              Suscríbete para recibir invitaciones a catas privadas, alertas de nuevos microlotes y un 15% de descuento en tu primer pedido.
            </p>
            {subscribed ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <span className="font-semibold block text-emerald-200">
                    ¡Bienvenido al Club de Catadores!
                  </span>
                  <span>
                    Usa el código <strong className="font-mono text-amber-300">{couponCode}</strong> en tu cesta para un 15% de descuento.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 text-sm focus:border-amber-500 rounded-lg"
                  />
                  <Button
                    type="submit"
                    aria-label="Suscribirse al Club de Catadores"
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-4 rounded-lg cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
                {subError && <p className="text-xs text-red-400">{subError}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© 2026 AURA Specialty Coffee Roasters. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <span className="hover:text-zinc-400 cursor-pointer">Términos de Servicio</span>
            <span className="hover:text-zinc-400 cursor-pointer">
              Política de Envío de Café Fresco
            </span>
            <span className="hover:text-zinc-400 cursor-pointer">Certificaciones SCA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
