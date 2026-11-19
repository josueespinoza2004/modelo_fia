'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Coffee, Menu, X, MessageSquareQuote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const { totalItems, setIsCartOpen, openSommelierWithCoffee } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#fbf9f5]/92 border-b border-[#e6dfd4] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-full bg-[#8f461e] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#29211b] flex items-center gap-2">
              AURA
              <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-[#f1ebe0] text-[#785d47] font-semibold border border-[#e1d7c7]">
                SCA 86+
              </span>
            </span>
            <p className="text-[10px] text-[#8f461e] uppercase tracking-widest font-semibold">
              Tostaduría de Especialidad
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#5e5145]">
          <a
            href="#catalogo"
            className="hover:text-[#8f461e] transition-colors py-1"
          >
            Colección de Granos
          </a>
          <a
            href="#perfil-sensorial"
            className="hover:text-[#8f461e] transition-colors py-1"
          >
            Selector de Sabores
          </a>
          <a
            href="#guia-extraccion"
            className="hover:text-[#8f461e] transition-colors py-1"
          >
            Guía de Extracción
          </a>
          <a
            href="#filosofia"
            className="hover:text-[#8f461e] transition-colors py-1"
          >
            Nuestros Orígenes
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Barista Consultation CTA Button */}
          <Button
            onClick={() => openSommelierWithCoffee()}
            id="navbar-sommelier-btn"
            className="bg-[#8f461e] hover:bg-[#783916] text-white font-medium px-4 py-2 rounded-full shadow-sm transition-all border border-[#783916] flex items-center gap-2 cursor-pointer"
          >
            <MessageSquareQuote className="w-4 h-4 text-amber-200" />
            <span className="hidden sm:inline">Consultar Barista</span>
            <span className="sm:hidden">Barista</span>
          </Button>

          {/* Cart Icon Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            id="navbar-cart-btn"
            aria-label="Abrir cesta de compras"
            className="relative p-2.5 rounded-full bg-[#f3ede3] border border-[#e2d8c9] text-[#3d3126] hover:text-[#8f461e] hover:border-[#8f461e] transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <Badge className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[20px] h-5 bg-[#8f461e] text-white text-xs font-bold flex items-center justify-center rounded-full border border-white">
                {totalItems}
              </Badge>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#f3ede3] text-[#3d3126] hover:bg-[#e9e0d2]"
            aria-label="Menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#fbf9f5] border-b border-[#e6dfd4] px-6 py-5 space-y-4">
          <a
            href="#catalogo"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#3d3126] hover:text-[#8f461e] font-medium"
          >
            Colección de Granos
          </a>
          <a
            href="#perfil-sensorial"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#3d3126] hover:text-[#8f461e] font-medium"
          >
            Selector de Sabores
          </a>
          <a
            href="#guia-extraccion"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#3d3126] hover:text-[#8f461e] font-medium"
          >
            Guía de Extracción
          </a>
          <a
            href="#filosofia"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-[#3d3126] hover:text-[#8f461e] font-medium"
          >
            Nuestros Orígenes
          </a>
        </div>
      )}
    </header>
  );
}
