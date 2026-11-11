'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { fetchCoffees } from '@/lib/api';
import { CoffeeProduct, FlavorCategory, CartItem, BrewMethod } from '@/types/coffee';
import {
  Sparkles,
  ShoppingBag,
  Award,
  Mountain,
  Search,
  SlidersHorizontal,
  Eye,
  User,
  Sprout,
  Layers,
  Quote,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ProductCatalogProps {
  initialFilter?: FlavorCategory | 'todos';
  onFilterChange?: (filter: FlavorCategory | 'todos') => void;
}

type SortOption = 'featured' | 'sca-desc' | 'price-asc' | 'price-desc';

function SensoryBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-zinc-400 font-medium">{label}</span>
        <span className="text-amber-300 font-mono font-semibold">{value}/5</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step <= value ? 'bg-amber-500' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function ProductCatalog({ initialFilter = 'todos', onFilterChange }: ProductCatalogProps) {
  const {
    products: catalogProducts,
    isCatalogLoading,
    catalogError,
    reloadCatalog,
    addItem,
    openSommelierWithCoffee,
  } = useCart();
  const [internalFilter, setInternalFilter] = useState<FlavorCategory | 'todos'>(initialFilter);
  const [selectedMethod, setSelectedMethod] = useState<BrewMethod | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [remoteProducts, setRemoteProducts] = useState<CoffeeProduct[] | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [selectedGrinds, setSelectedGrinds] = useState<Record<string, CartItem['grindOption']>>({});
  const [detailCoffee, setDetailCoffee] = useState<CoffeeProduct | null>(null);

  const selectedFilter = onFilterChange ? initialFilter : internalFilter;
  const isDefaultQuery =
    selectedFilter === 'todos' &&
    selectedMethod === 'todos' &&
    !searchQuery.trim() &&
    sortBy === 'featured';

  const handleCategoryChange = (cat: FlavorCategory | 'todos') => {
    setInternalFilter(cat);
    if (onFilterChange) {
      onFilterChange(cat);
    }
  };

  useEffect(() => {
    if (isDefaultQuery) return;

    let cancelled = false;
    const timer = setTimeout(
      async () => {
        setIsFiltering(true);
        try {
          const result = await fetchCoffees({
            category: selectedFilter,
            method: selectedMethod,
            search: searchQuery,
            sort: sortBy,
          });
          if (!cancelled) {
            setRemoteProducts(result);
          }
        } catch {
          // Mantener última lista si falla una petición de búsqueda
        } finally {
          if (!cancelled) {
            setIsFiltering(false);
          }
        }
      },
      searchQuery ? 200 : 0
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isDefaultQuery, selectedFilter, selectedMethod, searchQuery, sortBy]);

  const filteredProducts = isDefaultQuery
    ? catalogProducts
    : remoteProducts ?? catalogProducts;

  const handleGrindChange = (productId: string, grind: CartItem['grindOption']) => {
    setSelectedGrinds((prev) => ({ ...prev, [productId]: grind }));
  };

  const resetAllFilters = () => {
    handleCategoryChange('todos');
    setSelectedMethod('todos');
    setSearchQuery('');
    setSortBy('featured');
  };

  return (
    <section id="catalogo" className="py-20 bg-[#0d0a09]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
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

          {/* Quick Category Filter Buttons */}
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'floral-citrico', label: '🌸 Florales' },
              { id: 'frutal-exotico', label: '🍓 Frutales' },
              { id: 'chocolate-caramelo', label: '🍫 Chocolatados' },
              { id: 'dulce-sedoso', label: '🍯 Descafeinado' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleCategoryChange(tab.id as FlavorCategory | 'todos')}
                className={`px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                  selectedFilter === tab.id
                    ? 'bg-amber-500 text-zinc-950 border-amber-400 font-semibold shadow-sm shadow-amber-500/20'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search, Brew Method Filter & Sort Toolbar */}
        <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 mb-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por origen, nota de cata (ej. jazmín, cacao, Panamá)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Brew Method */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 hidden sm:inline">Cafetera:</span>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value as BrewMethod | 'todos')}
                aria-label="Filtrar por método de preparación"
                className="text-xs bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="todos">Todos los métodos</option>
                <option value="V60">V60 / Goteo</option>
                <option value="Chemex">Chemex</option>
                <option value="Aeropress">AeroPress</option>
                <option value="Espresso">Espresso / Moka</option>
                <option value="Prensa Francesa">Prensa Francesa</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 hidden sm:inline" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Ordenar catálogo"
                className="text-xs bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="featured">Ordenar: Destacados</option>
                <option value="sca-desc">Mayor Puntaje SCA</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Backend Error / Loading / Empty State */}
        {catalogError && filteredProducts.length === 0 ? (
          <div className="p-10 rounded-2xl bg-red-950/20 border border-red-500/30 text-center space-y-3">
            <p className="font-serif text-lg text-red-200">{catalogError}</p>
            <Button
              onClick={reloadCatalog}
              variant="outline"
              className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs cursor-pointer"
            >
              Reintentar Conexión
            </Button>
          </div>
        ) : (isCatalogLoading || isFiltering) && filteredProducts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[480px] rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-center space-y-4">
            <p className="font-serif text-xl text-amber-100">
              No encontramos microlotes que coincidan con esos filtros exactos.
            </p>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
              Prueba limpiando los filtros o pregúntale directamente a Don Aurelio para que te recomiende el grano más cercano.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                onClick={resetAllFilters}
                variant="outline"
                className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Filtros</span>
              </Button>
              <Button
                onClick={() => openSommelierWithCoffee()}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Consultar a Don Aurelio</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((coffee) => {
              const currentGrind = selectedGrinds[coffee.id] || 'Grano Entero';

              return (
                <Card
                  key={coffee.id}
                  className="bg-[#140f0c] border-amber-600/20 hover:border-amber-500/50 transition-all duration-300 flex flex-col overflow-hidden group shadow-xl"
                >
                  {/* Image & Header Badges */}
                  <div
                    onClick={() => setDetailCoffee(coffee)}
                    className="relative w-full aspect-[4/3] bg-zinc-900 overflow-hidden cursor-pointer"
                  >
                    <Image
                      src={coffee.image}
                      alt={coffee.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

                    {/* Quick view hint on hover */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-lg bg-zinc-950/85 border border-amber-500/40 text-[10px] text-amber-300 font-medium flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Ficha Técnica
                    </div>

                    {/* Origin Tag on Bottom Left of Image */}
                    <div className="absolute bottom-3 left-4 right-28 text-left">
                      <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <Mountain className="w-3 h-3 shrink-0" /> {coffee.country} • {coffee.region}
                      </span>
                      <h3 className="font-serif text-lg font-bold text-amber-100 leading-snug">
                        {coffee.name}
                      </h3>
                    </div>
                  </div>

                  <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {/* Farm, Variety & Altitude details */}
                    <div className="text-xs text-zinc-400 flex items-center justify-between border-b border-zinc-800 pb-3">
                      <span className="truncate pr-2">
                        Finca: <strong className="text-zinc-200">{coffee.farm}</strong>
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-amber-300/90">
                        {coffee.altitude}
                      </span>
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

                    {/* Visual Sensory Bars (Acidez, Cuerpo, Dulzura) */}
                    <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                      <SensoryBar label="Acidez" value={coffee.acidity} />
                      <SensoryBar label="Cuerpo" value={coffee.body} />
                      <SensoryBar label="Dulzura" value={coffee.sweetness} />
                    </div>

                    {/* Description excerpt */}
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {coffee.description}
                    </p>

                    {/* Recommended Brew Methods */}
                    <div className="text-[11px] text-zinc-400 flex items-center justify-between gap-1.5">
                      <div>
                        <span className="text-zinc-500 font-medium">Ideal para: </span>
                        <span className="text-amber-200 font-semibold">
                          {coffee.recommendedBrews.join(', ')}
                        </span>
                      </div>
                      <button
                        onClick={() => setDetailCoffee(coffee)}
                        className="text-[11px] text-amber-400 hover:underline font-medium shrink-0 cursor-pointer"
                      >
                        Ver ficha →
                      </button>
                    </div>

                    {/* Grind Selector Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                        Preferencia de Molienda:
                      </label>
                      <select
                        value={currentGrind}
                        onChange={(e) =>
                          handleGrindChange(coffee.id, e.target.value as CartItem['grindOption'])
                        }
                        aria-label={`Seleccionar molienda para ${coffee.name}`}
                        className="w-full text-xs bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="Grano Entero">Grano Entero (Para moler en casa)</option>
                        <option value="Molienda Media (V60 / Filtro)">
                          Molienda Media (V60 / Chemex / Goteo)
                        </option>
                        <option value="Molienda Fina (Espresso)">
                          Molienda Fina (Espresso / Moka)
                        </option>
                        <option value="Molienda Gruesa (Prensa Francesa)">
                          Molienda Gruesa (Prensa Francesa / Cold Brew)
                        </option>
                      </select>
                    </div>

                    {/* Price & Action Buttons */}
                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Bolsa {coffee.weightGrams}g</span>
                        <span className="font-serif text-xl font-bold text-amber-400">
                          ${coffee.price.toFixed(2)}{' '}
                          <span className="text-xs font-sans font-normal text-zinc-400">USD</span>
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
        )}
      </div>

      {/* Modal de Ficha Técnica Completa */}
      <Dialog open={!!detailCoffee} onOpenChange={(open) => !open && setDetailCoffee(null)}>
        <DialogContent className="bg-[#140f0c] border-amber-500/40 text-zinc-100 sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {detailCoffee && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-amber-500 text-zinc-950 font-bold text-xs">
                    SCA {detailCoffee.scaScore} pts
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 text-amber-300 text-xs"
                  >
                    Tueste {detailCoffee.roastLevel}
                  </Badge>
                  <span className="text-xs text-zinc-400">
                    {detailCoffee.origin}, {detailCoffee.country}
                  </span>
                </div>
                <DialogTitle className="font-serif text-2xl font-bold text-amber-100">
                  {detailCoffee.name}
                </DialogTitle>
                <DialogDescription className="text-amber-300/90 text-xs italic">
                  {detailCoffee.subtitle}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-2">
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {detailCoffee.description}
                </p>

                {/* Traceability Grid */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs">
                  <div className="flex items-start gap-2">
                    <Mountain className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">Finca y Altitud</span>
                      <span className="text-zinc-200 font-medium">
                        {detailCoffee.farm} ({detailCoffee.altitude})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">Caficultor</span>
                      <span className="text-zinc-200 font-medium">{detailCoffee.producer}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sprout className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">Variedad Botánica</span>
                      <span className="text-zinc-200 font-medium">{detailCoffee.variety}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Layers className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">Beneficio / Proceso</span>
                      <span className="text-zinc-200 font-medium">{detailCoffee.process}</span>
                    </div>
                  </div>
                </div>

                {/* Full 4-Sensory Bars */}
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 block">
                    Mapa Sensorial Q-Grader
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <SensoryBar label="Intensidad Aromática" value={detailCoffee.aromaIntensity} />
                    <SensoryBar label="Acidez Brillante" value={detailCoffee.acidity} />
                    <SensoryBar label="Cuerpo en Boca" value={detailCoffee.body} />
                    <SensoryBar label="Dulzura Residual" value={detailCoffee.sweetness} />
                  </div>
                </div>

                {/* Sommelier Quote */}
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex gap-3 items-start">
                  <Quote className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-100 italic">
                      &quot;{detailCoffee.sommelierQuote}&quot;
                    </p>
                    <span className="text-[10px] text-amber-400 font-semibold mt-1 block">
                      — Don Aurelio, Maestro Tostador
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">
                      Presentación {detailCoffee.weightGrams}g con válvula desgasificadora
                    </span>
                    <span className="font-serif text-2xl font-bold text-amber-400">
                      ${detailCoffee.price.toFixed(2)} USD
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      onClick={() => {
                        const chosen = detailCoffee;
                        setDetailCoffee(null);
                        openSommelierWithCoffee(chosen);
                      }}
                      variant="outline"
                      className="flex-1 sm:flex-initial border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Preguntar a Don Aurelio</span>
                    </Button>

                    <Button
                      onClick={() => {
                        const grind = selectedGrinds[detailCoffee.id] || 'Grano Entero';
                        addItem(detailCoffee, grind);
                        setDetailCoffee(null);
                      }}
                      className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Añadir a la Cesta</span>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
