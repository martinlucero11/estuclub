
'use client';
import type { SerializableBenefit } from '@/types/data';
import BenefitCard from './perk-card';
import { Archive } from 'lucide-react';
import { PremiumEmptyState } from '../ui/premium-empty-state';

interface BenefitsGridProps {
  benefits: SerializableBenefit[];
}

export default function BenefitsGrid({ benefits }: BenefitsGridProps) {
  if (!benefits || benefits.length === 0) {
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
      {benefits.map((benefit) => (
        <BenefitCard key={benefit.id} benefit={benefit} variant="grid" />
      ))}
    </div>
  );
}
