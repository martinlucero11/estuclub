'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import type { Benefit, SupplierProfile, SerializableBenefit } from '@/types/data';
import { makeBenefitSerializable } from '@/lib/data';
import { BenefitsCarousel, SuppliersCarousel } from './carousels';
import { calculateDistance } from '@/lib/geo-utils';
import { MapPin } from 'lucide-react';
import { useCincoDosStatus } from '@/firebase/auth/use-cinco-dos';

export function NearbySuppliersCarousel() {
  const { userLocation } = useUser();
  const firestore = useFirestore();

  const suppliersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()),
      where('isVisible', '==', true),
      limit(20)
    );
  }, [firestore]);

  const { data: suppliers, isLoading } = useCollection(suppliersQuery);

  const sortedSuppliers = useMemo(() => {
    if (!suppliers || !userLocation) return [];
    
    return [...suppliers]
      .filter(s => s.location)
      .sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.location!.lat, a.location!.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.location!.lat, b.location!.lng);
        return distA - distB;
      });
  }, [suppliers, userLocation]);

  if (!userLocation || sortedSuppliers.length === 0) return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="flex items-center gap-2 px-1">
            <MapPin className="h-3 w-3 text-primary animate-pulse" />
            <h2 className="text-lg font-extrabold tracking-tight text-foreground uppercase text-[10px] sm:text-xs text-muted-foreground/80 tracking-[0.2em]">
                Clubers Cerca de ti
            </h2>
        </div>
        <SuppliersCarousel items={sortedSuppliers} />
    </div>
  );
}

export function NearbyBenefitsCarousel() {
  const { userLocation } = useUser();
  const firestore = useFirestore();
  const { isApproved: isCincoDos } = useCincoDosStatus();

  // Fetch benefits
  const benefitsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'benefits').withConverter(createConverter<Benefit>()),
      where('isVisible', '==', true),
      limit(40)
    );
  }, [firestore]);

  const { data: benefits } = useCollection(benefitsQuery);

  // Fetch all suppliers to get their locations (small scale join)
  const suppliersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()));
  }, [firestore]);

  const { data: suppliers } = useCollection(suppliersQuery);

  const sortedBenefits = useMemo(() => {
    if (!benefits || !suppliers || !userLocation) return [];
    
    const supplierMap = new Map(suppliers.map(s => [s.id, s]));

    return [...benefits]
      .map(b => {
        const supplier = supplierMap.get(b.ownerId);
        const distance = (userLocation && supplier?.location) 
            ? calculateDistance(userLocation.lat, userLocation.lng, supplier.location.lat, supplier.location.lng)
            : Infinity;
        
        return {
            ...makeBenefitSerializable(b),
            supplierName: supplier?.name,
            supplierLocation: supplier?.location,
            distance
        };
      })
      .filter((b: any) => b.targetAudience !== 'cinco_dos' || isCincoDos)
      .filter(b => b.distance !== Infinity)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);
  }, [benefits, suppliers, userLocation]);

  if (!userLocation || sortedBenefits.length === 0) return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-200">
        <div className="flex items-center gap-2 px-1">
            <MapPin className="h-3 w-3 text-primary animate-pulse" />
            <h2 className="text-lg font-extrabold tracking-tight text-foreground uppercase text-[10px] sm:text-xs text-muted-foreground/80 tracking-[0.2em]">
                Beneficios Imperdibles cerca de ti
            </h2>
        </div>
        <BenefitsCarousel items={sortedBenefits} />
    </div>
  );
}
