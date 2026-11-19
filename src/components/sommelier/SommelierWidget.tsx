'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { Coffee, X } from 'lucide-react';

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
        <div className="hidden sm:flex items-center gap-3 p-3.5 pr-4 rounded-2xl bg-white border border-[#e2d8ca] shadow-lg backdrop-blur-md text-xs text-[#29211b] max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-8 h-8 rounded-full bg-[#f4ece1] text-[#8f461e] border border-[#e3d7c7] flex items-center justify-center shrink-0">
            <Coffee className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <span className="font-semibold text-[#29211b] block">¿Dudas con tu café?</span>
            <span className="text-[#695a4e] text-[11px] leading-tight block">
              Don Aurelio te ayuda a elegir el grano según tu cafetera preferida.
            </span>
          </div>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-[#9e8f82] hover:text-[#29211b] p-1 cursor-pointer"
            title="Cerrar sugerencia"
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
        aria-label="Consultar al Maestro Barista Don Aurelio"
        className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#8f461e] hover:bg-[#783916] text-white shadow-lg shadow-[#8f461e]/25 hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-white"
      >
        <div className="relative flex flex-col items-center justify-center">
          <Coffee className="w-5 h-5 text-amber-100" />
          <span className="text-[9px] font-semibold tracking-tight text-white mt-0.5">
            Barista
          </span>
        </div>

        {/* Status Dot */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center" />
      </button>
    </div>
  );
}
