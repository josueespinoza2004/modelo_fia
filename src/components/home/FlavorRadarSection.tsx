'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { FlavorCategory } from '@/types/coffee';
import { Sparkles, Compass, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CategoryTab {
  id: FlavorCategory | 'todos';
  title: string;
  emoji: string;
  description: string;
  notes: string[];
}

const CATEGORIES: CategoryTab[] = [
  {
    id: 'todos',
    title: 'Todos los Perfiles',
    emoji: '☕',
    description: 'Nuestra colección completa de microlotes arábica de estricta altura.',
    notes: ['Florales', 'Frutales', 'Chocolates', 'Descafeinado'],
  },
  {
    id: 'floral-citrico',
    title: 'Florales & Cítricos',
    emoji: '🌸',
    description: 'Acidez brillante, aromas de jazmín blanco y notas cítricas de bergamota.',
    notes: ['Jazmín Silvestre', 'Bergamota', 'Pomelo Rubí', 'Miel de Azahar'],
  },
  {
    id: 'frutal-exotico',
    title: 'Frutales & Exóticos',
    emoji: '🍓',
    description: 'Fruto de fermentaciones anaeróbicas y procesos naturales intensos.',
    notes: ['Arándano Silvestre', 'Frambuesa Madura', 'Mandarina Dulce', 'Cacao Ruby'],
  },
  {
    id: 'chocolate-caramelo',
    title: 'Chocolate & Especias',
    emoji: '🍫',
    description: 'Cuerpo licoroso, dulzura densa de panela, cacao belga y toques de canela.',
    notes: ['Manzana Caramelizada', 'Canela en Rama', 'Panela', 'Chocolate Belga'],
  },
  {
    id: 'dulce-sedoso',
    title: 'Dulces & Sedosos',
    emoji: '🍯',
    description: 'Baja acidez, perfil cremoso y dulzura natural ideal para cualquier hora.',
    notes: ['Toffee', 'Vainilla Tostada', 'Almendra Horneada', 'Manzana Roja'],
  },
];

interface FlavorRadarSectionProps {
  selectedFilter?: FlavorCategory | 'todos';
  onSelectFilter?: (cat: FlavorCategory | 'todos') => void;
}

export function FlavorRadarSection({
  selectedFilter,
  onSelectFilter,
}: FlavorRadarSectionProps) {
  const { products, openSommelierWithCoffee } = useCart();
  const [internalCategory, setInternalCategory] = useState<FlavorCategory | 'todos'>('todos');

  const activeCategory = selectedFilter !== undefined ? selectedFilter : internalCategory;

  const handleSelect = (id: FlavorCategory | 'todos') => {
    setInternalCategory(id);
    if (onSelectFilter) {
      onSelectFilter(id);
    }
  };

  const activeInfo = CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];
  const matchingCoffees =
    activeCategory === 'todos'
      ? products
      : products.filter((c) => c.flavorCategory === activeCategory);

  return (
    <section id="perfil-sensorial" className="py-16 bg-[#0f0c0a] border-y border-amber-600/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Compass className="w-4 h-4" />
            <span>Navegación Sensorial</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-amber-100">
            Encuentra tu Café por Familia de Sabor
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Así como el vino responde a su uva y terruño, cada grano de especialidad despliega una constelación de notas aromáticas naturales.
          </p>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat.id)}
              className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer border ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                  : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-amber-500/40 hover:text-white'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.title}</span>
            </button>
          ))}
        </div>

        {/* Selected Category Highlight Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950/80 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2.5 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-2xl">{activeInfo.emoji}</span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-amber-200">
                {activeInfo.title}
              </h3>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                {matchingCoffees.length}{' '}
                {matchingCoffees.length === 1 ? 'microlote disponible' : 'microlotes disponibles'}
              </Badge>
            </div>
            <p className="text-sm text-zinc-300 max-w-xl">{activeInfo.description}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
              <span className="text-xs text-zinc-500 mr-1">Notas dominantes:</span>
              {activeInfo.notes.map((note) => (
                <span
                  key={note}
                  className="text-xs px-2 py-0.5 rounded-md bg-zinc-900 text-amber-300 border border-zinc-700 font-medium"
                >
                  {note}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              <span className="text-xs text-zinc-500">Granos en esta familia:</span>
              {matchingCoffees.map((c) => (
                <a
                  key={c.id}
                  href="#catalogo"
                  className="text-xs text-amber-400 hover:underline font-medium"
                >
                  • {c.name}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href="#catalogo"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Ver Granos Filtrados ({matchingCoffees.length})</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              onClick={() => openSommelierWithCoffee()}
              className="px-4 py-2.5 rounded-xl border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Preguntar a Don Aurelio</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
