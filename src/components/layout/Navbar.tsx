'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Sparkles, ShoppingBag, Coffee, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const { totalItems, setIsCartOpen, openSommelierWithCoffee } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0d0a09]/80 border-b border-amber-600/20 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-600/30 group-hover:scale-105 transition-transform">
            <Coffee className="w-6 h-6 text-zinc-950 fill-zinc-950" />
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-wider text-amber-100 flex items-center gap-1.5">
              AURA
              <span className="text-xs font-sans px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold tracking-normal border border-amber-500/30">
                SCA 86+
              </span>
            </span>
            <p className="text-[10px] text-amber-400/80 uppercase tracking-widest font-medium">
              Specialty Coffee Roasters
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <a
            href="#catalogo"
            className="hover:text-amber-400 transition-colors py-1"
          >
            Colección de Granos
          </a>
          <a
            href="#perfil-sensorial"
            className="hover:text-amber-400 transition-colors py-1"
          >
            Selector Sensorial
          </a>
          <a
            href="#guia-extraccion"
            className="hover:text-amber-400 transition-colors py-1"
          >
            Guía de Extracción
          </a>
          <a
            href="#filosofia"
            className="hover:text-amber-400 transition-colors py-1"
          >
            Nuestros Orígenes
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Sommelier CTA Button */}
          <Button
            onClick={() => openSommelierWithCoffee()}
            id="navbar-sommelier-btn"
            className="relative bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-zinc-950 font-semibold px-4 py-2 rounded-full hover:brightness-110 shadow-lg shadow-amber-600/30 transition-all border border-amber-400/30 flex items-center gap-2 group cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-zinc-950 animate-pulse" />
            <span className="hidden sm:inline">Sommelier Virtual</span>
            <span className="sm:hidden">Sommelier</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </Button>

          {/* Cart Icon Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            id="navbar-cart-btn"
            aria-label="Abrir carrito"
            className="relative p-2.5 rounded-full bg-zinc-900 border border-amber-500/20 text-zinc-200 hover:text-amber-400 hover:border-amber-500/40 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[20px] h-5 bg-amber-500 text-zinc-950 text-xs font-bold flex items-center justify-center rounded-full border border-zinc-950">
                {totalItems}
              </Badge>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-950/95 border-b border-amber-500/20 px-6 py-5 space-y-4">
          <a
            href="#catalogo"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-zinc-200 hover:text-amber-400 font-medium"
          >
            Colección de Granos
          </a>
          <a
            href="#perfil-sensorial"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-zinc-200 hover:text-amber-400 font-medium"
          >
            Selector Sensorial
          </a>
          <a
            href="#guia-extraccion"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-zinc-200 hover:text-amber-400 font-medium"
          >
            Guía de Extracción
          </a>
          <a
            href="#filosofia"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-zinc-200 hover:text-amber-400 font-medium"
          >
            Nuestros Orígenes
          </a>
        </div>
      )}
    </header>
  );
}
