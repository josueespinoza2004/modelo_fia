'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { FlavorCategory } from '@/types/coffee';
import { Compass, ArrowRight, MessageSquareQuote } from 'lucide-react';
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
    description: 'Acidez brillante, aromas de jazmín silvestre y notas cítricas de bergamota.',
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
    <section id="perfil-sensorial" className="py-16 bg-[#f5f0e8] border-y border-[#e6dfd4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eae2d5] border border-[#dcd3c3] text-[#6d5743] text-xs font-semibold">
            <Compass className="w-3.5 h-3.5 text-[#8f461e]" />
            <span>Guía de Sabores & Aromas</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#261f1a]">
            Encuentra tu Café por Familia de Sabor
          </h2>
          <p className="text-sm sm:text-base text-[#66574a]">
            Así como el vino responde a su uva y terruño, cada grano de especialidad despliega una armonía de notas aromáticas naturales.
          </p>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat.id)}
              className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer border ${
                activeCategory === cat.id
                  ? 'bg-[#8f461e] text-white border-[#7a3915] shadow-xs'
                  : 'bg-white text-[#4f4337] border-[#ded5c6] hover:border-[#8f461e] hover:text-[#8f461e]'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.title}</span>
            </button>
          ))}
        </div>

        {/* Selected Category Highlight Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#e2d8ca] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2.5 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-2xl">{activeInfo.emoji}</span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#261f1a]">
                {activeInfo.title}
              </h3>
              <Badge className="bg-[#f2ece2] text-[#6d5845] border border-[#ded4c4] text-xs">
                {matchingCoffees.length}{' '}
                {matchingCoffees.length === 1 ? 'microlote disponible' : 'microlotes disponibles'}
              </Badge>
            </div>
            <p className="text-sm text-[#5c4e43] max-w-xl">{activeInfo.description}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
              <span className="text-xs text-[#7d6e61] mr-1">Notas dominantes:</span>
              {activeInfo.notes.map((note) => (
                <span
                  key={note}
                  className="text-xs px-2.5 py-0.5 rounded-md bg-[#f6f1ea] text-[#3d3126] border border-[#e3dacc] font-medium"
                >
                  {note}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              <span className="text-xs text-[#7d6e61]">Granos en esta familia:</span>
              {matchingCoffees.map((c) => (
                <a
                  key={c.id}
                  href="#catalogo"
                  className="text-xs text-[#8f461e] hover:underline font-medium"
                >
                  • {c.name}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href="#catalogo"
              className="px-5 py-2.5 rounded-xl bg-[#8f461e] hover:bg-[#783916] text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <span>Ver Granos ({matchingCoffees.length})</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              onClick={() => openSommelierWithCoffee()}
              className="px-4 py-2.5 rounded-xl border border-[#cbbfae] text-[#5e4f42] hover:bg-[#fbf7f1] text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquareQuote className="w-4 h-4 text-[#8f461e]" />
              <span>Preguntar a Don Aurelio</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
