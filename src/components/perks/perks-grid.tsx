

'use client';
import type { SerializableBenefit } from '@/types/data';
import BenefitCard from './perk-card';
import { Archive } from 'lucide-react';
import { EmptyState } from '../ui/empty-state';

interface BenefitsGridProps {
  benefits: SerializableBenefit[];
}

export default function BenefitsGrid({ benefits }: BenefitsGridProps) {
  if (!benefits || benefits.length === 0) {
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
      {benefits.map((benefit) => (
        <BenefitCard key={benefit.id} benefit={benefit} />
      ))}
    </div>
  );
}
