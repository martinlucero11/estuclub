
'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import type { Benefit, SerializableHomeSection } from '@/types/data';
import BenefitsGrid from '../benefits/benefits-grid';
import { makeBenefitSerializable } from '@/lib/data';

export function FeaturedBenefits({ sections }: { sections: SerializableHomeSection[] }) {
  const firestore = useFirestore();

  const benefitsQuery = useMemo(() => 
    query(
      collection(firestore, 'benefits').withConverter(createConverter<Benefit>()),
      where('isFeatured', '==', true),
      where('isVisible', '==', true),
      orderBy('featuredRank', 'asc'),
      limit(4)
    ), 
    [firestore]
  );

  const { data: benefits, isLoading, error } = useCollection(benefitsQuery);

  const serializableBenefits = useMemo(() => {
    if (!benefits) return [];
    return benefits.map(makeBenefitSerializable);
  }, [benefits]);

  if (isLoading) {
    // You can return a skeleton loader here
    return <div>Cargando beneficios destacados...</div>;
  }

  if (error) {
    return <p className="text-destructive">Error al cargar beneficios.</p>;
  }

  return <BenefitsGrid benefits={serializableBenefits} />;
}

