'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { Sparkles, MessageSquare, Coffee, X } from 'lucide-react';

export function SommelierWidget() {
  const { isSommelierOpen, openSommelierWithCoffee } = useCart();
  const [showTooltip, setShowTooltip] = useState(false);

  // Mostrar mensaje de invitación a los 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 3200);
    return () => clearTimeout(timer);
  }, []);

  if (isSommelierOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-end gap-3 select-none">
      {/* Interactive Tooltip bubble */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2.5 p-3.5 pr-4 rounded-2xl bg-zinc-950/95 border border-amber-500/40 shadow-2xl backdrop-blur-md text-xs text-zinc-200 max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>
          <div className="flex-1">
            <span className="font-semibold text-amber-300 block">¿Dudas con tu café?</span>
            <span className="text-zinc-400 text-[11px] leading-tight block">
              Don Aurelio te ayuda a elegir el grano según tu método de cafetera.
            </span>
          </div>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-zinc-500 hover:text-zinc-300 p-1"
            title="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setShowTooltip(false);
          openSommelierWithCoffee();
        }}
        id="floating-sommelier-btn"
        aria-label="Abrir Sommelier Virtual Don Aurelio"
        className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-zinc-950 shadow-2xl shadow-amber-600/40 hover:scale-108 transition-all duration-300 cursor-pointer border-2 border-amber-300/40"
      >
        <span className="absolute -inset-1 rounded-full bg-amber-500/30 animate-ping opacity-70 group-hover:opacity-100" />
        
        <div className="relative flex flex-col items-center justify-center">
          <Sparkles className="w-5 h-5 text-zinc-950" />
          <span className="text-[9px] font-extrabold uppercase tracking-tighter text-zinc-950">
            Sommelier
          </span>
        </div>

        {/* Status Dot */}
        <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-950 flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
        </span>
      </button>
    </div>
  );
}
