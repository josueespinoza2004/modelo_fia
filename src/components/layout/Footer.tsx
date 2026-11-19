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
    <footer className="w-full bg-[#231c17] border-t border-[#3b2f27] pt-16 pb-12 text-[#c2b4a7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value props banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-[#3b2f27] mb-12">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#332922] border border-[#47392e] text-[#b86a3d]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[#f5ede3] font-semibold mb-1">Calidad SCA 86+ Puntos</h4>
              <p className="text-xs text-[#a39487] leading-relaxed">
                Únicamente tostamos microlotes certificados por Q-Graders independientes. Cero defectos primarios.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#332922] border border-[#47392e] text-[#b86a3d]">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[#f5ede3] font-semibold mb-1">Comercio Directo y Justo</h4>
              <p className="text-xs text-[#a39487] leading-relaxed">
                Pagamos hasta 2.8x sobre el precio de bolsa internacional directamente a las familias caficultoras.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#332922] border border-[#47392e] text-[#b86a3d]">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[#f5ede3] font-semibold mb-1">Tueste Fresco Bajo Demanda</h4>
              <p className="text-xs text-[#a39487] leading-relaxed">
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
              <div className="w-10 h-10 rounded-full bg-[#8f461e] flex items-center justify-center text-white font-bold">
                <Coffee className="w-5 h-5" />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-[#f5ede3]">
                AURA
              </span>
            </div>
            <p className="text-sm text-[#a39487] max-w-sm leading-relaxed">
              Tostaduría boutique y laboratorio de café de especialidad. Conectamos apasionados del buen café con los terruños más extraordinarios a través del tueste artesanal y la dedicación en barra.
            </p>
            <div className="text-xs text-[#d18e66] font-medium">
              ✦ Perfiles de tueste por convección limpia y aire caliente.
            </div>
          </div>

          {/* Nav Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-[#e6d8cb]">
              Navegación
            </h5>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#catalogo" className="hover:text-white transition-colors">
                  Microlotes de Origen
                </a>
              </li>
              <li>
                <a href="#perfil-sensorial" className="hover:text-white transition-colors">
                  Rueda de Sabores y Notas
                </a>
              </li>
              <li>
                <a href="#guia-extraccion" className="hover:text-white transition-colors">
                  Ratios V60, Chemex y Espresso
                </a>
              </li>
              <li>
                <a href="#filosofia" className="hover:text-white transition-colors">
                  Trazabilidad de Fincas
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="md:col-span-4 space-y-4">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-[#e6d8cb]">
              Club de Catadores AURA
            </h5>
            <p className="text-sm text-[#a39487]">
              Suscríbete para recibir invitaciones a catas privadas, avisos de nuevos microlotes y un 15% de descuento en tu primer pedido.
            </p>
            {subscribed ? (
              <div className="p-3.5 rounded-xl bg-[#253828] border border-[#3e6344] text-xs text-[#b0e0b6] flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <span className="font-semibold block text-white">
                    ¡Bienvenido al Club de Catadores!
                  </span>
                  <span>
                    Usa el código <strong className="font-mono text-[#f3caa1]">{couponCode}</strong> en tu cesta para un 15% de descuento.
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
                    className="bg-[#2d241e] border-[#47392e] text-[#f5ede3] text-sm focus:border-[#8f461e] rounded-lg placeholder:text-[#8a7b6d]"
                  />
                  <Button
                    type="submit"
                    aria-label="Suscribirse al Club de Catadores"
                    className="bg-[#8f461e] hover:bg-[#783916] text-white font-medium px-4 rounded-lg cursor-pointer border border-[#783916]"
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
        <div className="pt-8 border-t border-[#3b2f27] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#807062]">
          <p>© 2026 AURA Specialty Coffee Roasters. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <span className="hover:text-[#c2b4a7] cursor-pointer">Términos de Servicio</span>
            <span className="hover:text-[#c2b4a7] cursor-pointer">
              Política de Envío de Café Fresco
            </span>
            <span className="hover:text-[#c2b4a7] cursor-pointer">Certificaciones SCA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
