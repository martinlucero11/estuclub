

'use client';
import type { SerializablePerk } from '@/lib/data';
import PerkCard from './perk-card';
import { Archive } from 'lucide-react';
import { EmptyState } from '../ui/empty-state';

interface PerksGridProps {
  perks: SerializablePerk[];
}

export default function PerksGrid({ perks }: PerksGridProps) {
  if (!perks || perks.length === 0) {
    return (
      <EmptyState 
        icon={Archive}
        title="Nada por aquí..."
        description="Parece que no hay beneficios que coincidan con tu búsqueda. ¡Vuelve en un rato!"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {perks.map((perk) => (
        <PerkCard key={perk.id} perk={perk} />
      ))}
    </div>
  );
}
