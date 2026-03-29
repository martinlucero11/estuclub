
'use client';
import type { SerializableBenefit } from '@/types/data';
import PerkCard from './perk-card';
import { Archive } from 'lucide-react';
import { PremiumEmptyState } from '../ui/premium-empty-state';

interface PerksGridProps {
  perks: SerializableBenefit[];
}

export default function PerksGrid({ perks }: PerksGridProps) {
  if (!perks || perks.length === 0) {
    return (
      <div className="py-10 max-w-4xl mx-auto w-full">
        <PremiumEmptyState 
          icon={Archive}
          title="Nada por aquí todavía"
          description="Lo sentimos, pero no encontramos beneficios en esta categoría o búsqueda. Mientras tanto, ¡ayuda a nuestro gatito!"
          showGame={true}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {perks.map((perk) => (
        <PerkCard key={perk.id} perk={perk} variant="grid" />
      ))}
    </div>
  );
}
