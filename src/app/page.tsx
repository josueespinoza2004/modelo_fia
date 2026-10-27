'use client';

import React, { useState } from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { FlavorRadarSection } from '@/components/home/FlavorRadarSection';
import { ProductCatalog } from '@/components/home/ProductCatalog';
import { BrewGuideSection } from '@/components/home/BrewGuideSection';
import { OriginPhilosophy } from '@/components/home/OriginPhilosophy';
import { FlavorCategory } from '@/types/coffee';

export default function HomePage() {
  const [activeFlavorFilter, setActiveFlavorFilter] = useState<FlavorCategory | 'todos'>('todos');

  return (
    <div className="w-full min-h-screen">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Flavor Radar & Sensory Navigator */}
      <FlavorRadarSection onSelectFilter={(cat) => setActiveFlavorFilter(cat)} />

      {/* 3. Product Catalog Grid with filter sync */}
      <ProductCatalog initialFilter={activeFlavorFilter} />

      {/* 4. Precision Brewing Guide & Ratio Calculator */}
      <BrewGuideSection />

      {/* 5. Origin Philosophy & Roasting Manifesto */}
      <OriginPhilosophy />
    </div>
  );
}
