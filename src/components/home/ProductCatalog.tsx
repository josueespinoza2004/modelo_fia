'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { fetchCoffees } from '@/lib/api';
import { CoffeeProduct, FlavorCategory, CartItem, BrewMethod } from '@/types/coffee';
import {
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
  MessageSquareQuote,
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
        <span className="text-[#706154] font-medium">{label}</span>
        <span className="text-[#8f461e] font-mono font-semibold">{value}/5</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step <= value ? 'bg-[#8f461e]' : 'bg-[#e8e0d4]'
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
    <section id="catalogo" className="py-20 bg-[#fbf9f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f1ebe0] border border-[#e1d7c7] text-[#785d47] text-xs font-semibold mb-3">
              <Award className="w-4 h-4 text-[#8f461e]" />
              <span>Cosecha 2026 • Microlotes Numerados</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#261f1a]">
              Colección de Cafés de Especialidad
            </h2>
            <p className="text-sm sm:text-base text-[#66574a] mt-2 max-w-xl">
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
                    ? 'bg-[#8f461e] text-white border-[#7a3915] font-semibold shadow-xs'
                    : 'bg-white text-[#524538] border-[#ded5c6] hover:text-[#8f461e] hover:border-[#8f461e]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search, Brew Method Filter & Sort Toolbar */}
        <div className="p-4 rounded-2xl bg-white border border-[#e2d8ca] mb-10 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8c7d6f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por origen, nota de cata (ej. jazmín, cacao, Panamá)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#faf7f2] border border-[#ded5c6] text-xs sm:text-sm text-[#29211b] placeholder:text-[#998b7c] focus:outline-none focus:border-[#8f461e] transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Brew Method */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#706154] hidden sm:inline">Cafetera:</span>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value as BrewMethod | 'todos')}
                aria-label="Filtrar por método de preparación"
                className="text-xs bg-[#faf7f2] border border-[#ded5c6] rounded-xl px-3 py-2 text-[#382b20] focus:outline-none focus:border-[#8f461e] cursor-pointer"
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
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#8f461e] hidden sm:inline" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Ordenar catálogo"
                className="text-xs bg-[#faf7f2] border border-[#ded5c6] rounded-xl px-3 py-2 text-[#382b20] focus:outline-none focus:border-[#8f461e] cursor-pointer"
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
          <div className="p-10 rounded-2xl bg-[#fdf2f2] border border-[#f5c6c6] text-center space-y-3">
            <p className="font-serif text-lg text-[#991b1b]">{catalogError}</p>
            <Button
              onClick={reloadCatalog}
              variant="outline"
              className="border-[#8f461e] text-[#8f461e] hover:bg-[#faf4ee] text-xs cursor-pointer"
            >
              Reintentar Conexión
            </Button>
          </div>
        ) : (isCatalogLoading || isFiltering) && filteredProducts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[480px] rounded-2xl bg-[#f2ece2] border border-[#e4dacf] animate-pulse"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white border border-[#e2d8ca] text-center space-y-4 shadow-xs">
            <p className="font-serif text-xl text-[#261f1a]">
              No encontramos microlotes que coincidan con esos filtros exactos.
            </p>
            <p className="text-xs sm:text-sm text-[#66574a] max-w-md mx-auto">
              Prueba limpiando los filtros o pregúntale directamente a Don Aurelio para que te recomiende el grano más cercano.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                onClick={resetAllFilters}
                variant="outline"
                className="border-[#ded5c6] text-[#4f4134] hover:bg-[#f6f1e9] text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Filtros</span>
              </Button>
              <Button
                onClick={() => openSommelierWithCoffee()}
                className="bg-[#8f461e] hover:bg-[#783916] text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageSquareQuote className="w-3.5 h-3.5 text-amber-200" />
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
                  className="bg-white border-[#e4dacf] hover:border-[#bdafa0] transition-all duration-300 flex flex-col overflow-hidden group shadow-xs hover:shadow-md rounded-2xl"
                >
                  {/* Image & Header Badges */}
                  <div
                    onClick={() => setDetailCoffee(coffee)}
                    className="relative w-full aspect-[4/3] bg-[#f0e9df] overflow-hidden cursor-pointer"
                  >
                    <Image
                      src={coffee.image}
                      alt={coffee.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-104 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                    {/* SCA Score Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border border-[#e2d8ca] backdrop-blur-md shadow-xs">
                      <Award className="w-3.5 h-3.5 text-[#8f461e]" />
                      <span className="text-xs font-bold text-[#29211b]">
                        SCA {coffee.scaScore}
                      </span>
                    </div>

                    {/* Roast Badge */}
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-[#29211b]/80 border border-white/20 text-[11px] font-medium text-white backdrop-blur-xs">
                      Tueste {coffee.roastLevel}
                    </div>

                    {/* Quick view hint on hover */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-lg bg-white/95 border border-[#ded5c6] text-[10px] text-[#3d3126] font-medium flex items-center gap-1 shadow-xs">
                      <Eye className="w-3 h-3 text-[#8f461e]" /> Ficha Técnica
                    </div>

                    {/* Origin Tag on Bottom Left of Image */}
                    <div className="absolute bottom-3 left-4 right-28 text-left">
                      <span className="text-[11px] font-semibold text-amber-200 uppercase tracking-wider flex items-center gap-1 drop-shadow-xs">
                        <Mountain className="w-3 h-3 shrink-0" /> {coffee.country} • {coffee.region}
                      </span>
                      <h3 className="font-serif text-lg font-bold text-white leading-snug drop-shadow-sm">
                        {coffee.name}
                      </h3>
                    </div>
                  </div>

                  <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {/* Farm, Variety & Altitude details */}
                    <div className="text-xs text-[#6e5f52] flex items-center justify-between border-b border-[#eee7dd] pb-3">
                      <span className="truncate pr-2">
                        Finca: <strong className="text-[#261f1a] font-medium">{coffee.farm}</strong>
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-[#8f461e] font-medium">
                        {coffee.altitude}
                      </span>
                    </div>

                    {/* Tasting Notes */}
                    <div>
                      <span className="text-[10px] font-semibold text-[#8a7b6f] uppercase tracking-wider block mb-1.5">
                        Notas de Cata:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {coffee.tastingNotes.map((note) => (
                          <Badge
                            key={note}
                            variant="secondary"
                            className="bg-[#f5efe7] border-[#e4d9cc] text-[#423326] hover:bg-[#eae1d3] text-[11px] font-medium"
                          >
                            {note}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Visual Sensory Bars (Acidez, Cuerpo, Dulzura) */}
                    <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-[#faf7f2] border border-[#e8dfd3]">
                      <SensoryBar label="Acidez" value={coffee.acidity} />
                      <SensoryBar label="Cuerpo" value={coffee.body} />
                      <SensoryBar label="Dulzura" value={coffee.sweetness} />
                    </div>

                    {/* Description excerpt */}
                    <p className="text-xs text-[#66574a] line-clamp-2 leading-relaxed">
                      {coffee.description}
                    </p>

                    {/* Recommended Brew Methods */}
                    <div className="text-[11px] text-[#6b5d51] flex items-center justify-between gap-1.5">
                      <div>
                        <span className="text-[#8c7e72]">Ideal para: </span>
                        <span className="text-[#261f1a] font-semibold">
                          {coffee.recommendedBrews.join(', ')}
                        </span>
                      </div>
                      <button
                        onClick={() => setDetailCoffee(coffee)}
                        className="text-[11px] text-[#8f461e] hover:underline font-medium shrink-0 cursor-pointer"
                      >
                        Ver ficha →
                      </button>
                    </div>

                    {/* Grind Selector Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-[#8a7a6c] font-medium">
                        Preferencia de Molienda:
                      </label>
                      <select
                        value={currentGrind}
                        onChange={(e) =>
                          handleGrindChange(coffee.id, e.target.value as CartItem['grindOption'])
                        }
                        aria-label={`Seleccionar molienda para ${coffee.name}`}
                        className="w-full text-xs bg-[#faf7f2] border border-[#ded5c6] rounded-lg p-2 text-[#2b221a] focus:outline-none focus:border-[#8f461e] cursor-pointer"
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
                    <div className="pt-2 border-t border-[#eee7dd] flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-[#8c7d6f] block">Bolsa {coffee.weightGrams}g</span>
                        <span className="font-serif text-xl font-bold text-[#261f1a]">
                          ${coffee.price.toFixed(2)}{' '}
                          <span className="text-xs font-sans font-normal text-[#756658]">USD</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Ask Barista Button */}
                        <button
                          onClick={() => openSommelierWithCoffee(coffee)}
                          title="Preguntarle a Don Aurelio sobre este café"
                          className="p-2.5 rounded-xl bg-[#faf7f2] border border-[#ded5c6] text-[#4f4033] hover:text-[#8f461e] hover:border-[#8f461e] transition-colors cursor-pointer"
                        >
                          <MessageSquareQuote className="w-4 h-4" />
                        </button>

                        {/* Add to Cart Button */}
                        <Button
                          onClick={() => addItem(coffee, currentGrind)}
                          className="bg-[#8f461e] hover:bg-[#783916] text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs border border-[#783916]"
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
        <DialogContent className="bg-[#fbf9f5] border-[#ded4c5] text-[#29211b] sm:max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
          {detailCoffee && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-[#8f461e] text-white font-semibold text-xs">
                    SCA {detailCoffee.scaScore} pts
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-[#ded5c6] text-[#5e4e41] text-xs"
                  >
                    Tueste {detailCoffee.roastLevel}
                  </Badge>
                  <span className="text-xs text-[#78695c]">
                    {detailCoffee.origin}, {detailCoffee.country}
                  </span>
                </div>
                <DialogTitle className="font-serif text-2xl font-bold text-[#261f1a]">
                  {detailCoffee.name}
                </DialogTitle>
                <DialogDescription className="text-[#8f461e] text-xs italic">
                  {detailCoffee.subtitle}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 my-2">
                <p className="text-xs sm:text-sm text-[#5c4e42] leading-relaxed">
                  {detailCoffee.description}
                </p>

                {/* Traceability Grid */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white border border-[#e4dacf] text-xs shadow-xs">
                  <div className="flex items-start gap-2">
                    <Mountain className="w-4 h-4 text-[#8f461e] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-[#8c7d6f] uppercase block">Finca y Altitud</span>
                      <span className="text-[#29211b] font-medium">
                        {detailCoffee.farm} ({detailCoffee.altitude})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-[#8f461e] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-[#8c7d6f] uppercase block">Caficultor</span>
                      <span className="text-[#29211b] font-medium">{detailCoffee.producer}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Sprout className="w-4 h-4 text-[#8f461e] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-[#8c7d6f] uppercase block">Variedad Botánica</span>
                      <span className="text-[#29211b] font-medium">{detailCoffee.variety}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Layers className="w-4 h-4 text-[#8f461e] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-[#8c7d6f] uppercase block">Beneficio / Proceso</span>
                      <span className="text-[#29211b] font-medium">{detailCoffee.process}</span>
                    </div>
                  </div>
                </div>

                {/* Full 4-Sensory Bars */}
                <div className="p-4 rounded-xl bg-white border border-[#e4dacf] space-y-2.5 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8f461e] block">
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
                <div className="p-3.5 rounded-xl bg-[#f5efe7] border border-[#e2d6c6] flex gap-3 items-start">
                  <Quote className="w-5 h-5 text-[#8f461e] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-[#3d3126] italic">
                      &quot;{detailCoffee.sommelierQuote}&quot;
                    </p>
                    <span className="text-[10px] text-[#8f461e] font-semibold mt-1 block">
                      — Don Aurelio, Maestro Tostador
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#eee7dd]">
                  <div>
                    <span className="text-[10px] text-[#807264] block">
                      Presentación {detailCoffee.weightGrams}g con válvula desgasificadora
                    </span>
                    <span className="font-serif text-2xl font-bold text-[#261f1a]">
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
                      className="flex-1 sm:flex-initial border-[#ded5c6] text-[#4f4134] hover:bg-[#f6f1e9] text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquareQuote className="w-3.5 h-3.5 text-[#8f461e]" />
                      <span>Preguntar a Don Aurelio</span>
                    </Button>

                    <Button
                      onClick={() => {
                        const grind = selectedGrinds[detailCoffee.id] || 'Grano Entero';
                        addItem(detailCoffee, grind);
                        setDetailCoffee(null);
                      }}
                      className="flex-1 sm:flex-initial bg-[#8f461e] hover:bg-[#783916] text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer border border-[#783916]"
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
