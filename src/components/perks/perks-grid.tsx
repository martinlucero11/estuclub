

'use client';
import type { SerializablePerk } from '@/lib/data';
import PerkCard from './perk-card';
import { Archive } from 'lucide-react';

interface PerksGridProps {
  perks: SerializablePerk[];
}

export default function PerksGrid({ perks }: PerksGridProps) {
  if (!perks || perks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
         <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">Nada por aquí...</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Parece que no hay beneficios que coincidan con tu búsqueda. ¡Vuelve en un rato!
        </p>
      </div>
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
