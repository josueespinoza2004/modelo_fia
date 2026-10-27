'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { COFFEE_PRODUCTS } from '@/data/coffeeCatalog';
import { CoffeeProduct, FlavorCategory, CartItem } from '@/types/coffee';
import { Sparkles, ShoppingBag, Award, Mountain, Flame, Check, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ProductCatalogProps {
  initialFilter?: FlavorCategory | 'todos';
}

export function ProductCatalog({ initialFilter = 'todos' }: ProductCatalogProps) {
  const { addItem, openSommelierWithCoffee } = useCart();
  const [selectedFilter, setSelectedFilter] = useState<FlavorCategory | 'todos'>(initialFilter);
  const [selectedGrinds, setSelectedGrinds] = useState<Record<string, CartItem['grindOption']>>({});

  const filteredProducts =
    selectedFilter === 'todos'
      ? COFFEE_PRODUCTS
      : COFFEE_PRODUCTS.filter((p) => p.flavorCategory === selectedFilter);

  const handleGrindChange = (productId: string, grind: CartItem['grindOption']) => {
    setSelectedGrinds((prev) => ({ ...prev, [productId]: grind }));
  };

  return (
    <section id="catalogo" className="py-20 bg-[#0d0a09]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-3">
              <Award className="w-4 h-4" />
              <span>Cosecha 2026 • Microlotes Numerados</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-50">
              Colección de Cafés de Especialidad
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mt-2 max-w-xl">
              Cada bolsa contiene 250g de granos seleccionados a mano, tostados por convección lenta y empaquetados con válvula de frescura.
            </p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'floral-citrico', label: 'Florales' },
              { id: 'frutal-exotico', label: 'Frutales' },
              { id: 'chocolate-caramelo', label: 'Chocolatados' },
              { id: 'dulce-sedoso', label: 'Descafeinado' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                  selectedFilter === tab.id
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 font-semibold'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((coffee) => {
            const currentGrind = selectedGrinds[coffee.id] || 'Grano Entero';

            return (
              <Card
                key={coffee.id}
                className="bg-[#140f0c] border-amber-600/20 hover:border-amber-500/50 transition-all duration-300 flex flex-col overflow-hidden group shadow-xl"
              >
                {/* Image & Header Badges */}
                <div className="relative w-full aspect-[4/3] bg-zinc-900 overflow-hidden">
                  <Image
                    src={coffee.image}
                    alt={coffee.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#140f0c] via-transparent to-black/40" />

                  {/* SCA Score Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950/90 border border-amber-500/40 backdrop-blur-md">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300">
                      SCA {coffee.scaScore}
                    </span>
                  </div>

                  {/* Roast Badge */}
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-600/40 text-[11px] font-semibold text-amber-200">
                    Tueste {coffee.roastLevel}
                  </div>

                  {/* Origin Tag on Bottom Left of Image */}
                  <div className="absolute bottom-3 left-4 text-left">
                    <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Mountain className="w-3 h-3" /> {coffee.country} • {coffee.region}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-amber-100 leading-snug">
                      {coffee.name}
                    </h3>
                  </div>
                </div>

                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Farm & Altitude details */}
                  <div className="text-xs text-zinc-400 flex items-center justify-between border-b border-zinc-800 pb-3">
                    <span>Finca: <strong className="text-zinc-200">{coffee.farm}</strong></span>
                    <span>{coffee.altitude}</span>
                  </div>

                  {/* Tasting Notes */}
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                      Notas de Cata:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {coffee.tastingNotes.map((note) => (
                        <Badge
                          key={note}
                          variant="secondary"
                          className="bg-zinc-900 border-zinc-800 text-amber-300 hover:bg-zinc-800 text-[11px] font-medium"
                        >
                          {note}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Description excerpt */}
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {coffee.description}
                  </p>

                  {/* Recommended Brew Methods */}
                  <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <span className="text-zinc-500 font-medium">Ideal para:</span>
                    <span className="text-amber-200 font-semibold">{coffee.recommendedBrews.join(', ')}</span>
                  </div>

                  {/* Grind Selector Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                      Preferencia de Molienda:
                    </label>
                    <select
                      value={currentGrind}
                      onChange={(e) => handleGrindChange(coffee.id, e.target.value as any)}
                      className="w-full text-xs bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="Grano Entero">Grano Entero (Para moler en casa)</option>
                      <option value="Molienda Media (V60 / Filtro)">Molienda Media (V60 / Chemex / Goteo)</option>
                      <option value="Molienda Fina (Espresso)">Molienda Fina (Espresso / Moka)</option>
                      <option value="Molienda Gruesa (Prensa Francesa)">Molienda Gruesa (Prensa Francesa / Cold Brew)</option>
                    </select>
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Bolsa 250g</span>
                      <span className="font-serif text-xl font-bold text-amber-400">
                        ${coffee.price.toFixed(2)} <span className="text-xs font-sans font-normal text-zinc-400">USD</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Ask Sommelier Button */}
                      <button
                        onClick={() => openSommelierWithCoffee(coffee)}
                        title="Preguntarle a Don Aurelio sobre este café"
                        className="p-2.5 rounded-xl bg-zinc-900 border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>

                      {/* Add to Cart Button */}
                      <Button
                        onClick={() => addItem(coffee, currentGrind)}
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/20"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Añadir</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
