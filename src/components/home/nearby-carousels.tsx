'use client';

import React, { useMemo, useEffect } from 'react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import type { Benefit, SupplierProfile, SerializableBenefit } from '@/types/data';
import { makeBenefitSerializable } from '@/lib/data';
import { BenefitsCarousel, SuppliersCarousel } from './carousels';
import { calculateDistance } from '@/lib/geo-utils';
import { MapPin } from 'lucide-react';
import { useCincoDosStatus } from '@/firebase/auth/use-cinco-dos';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

export function NearbySuppliersCarousel() {
  const { userLocation, requestLocation } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (!userLocation) {
        requestLocation();
    }
  }, [userLocation, requestLocation]);

  const suppliersQuery = useMemo(() => {
// ...
    if (!firestore) return null;
    return query(
      collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()),
      where('isVisible', '==', true),
      limit(20)
    );
  }, [firestore]);

  const { data: suppliers, isLoading: isSuppliersLoading } = useCollection(suppliersQuery);

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

  if (!userLocation || isSuppliersLoading) {
      return (
        <div className="flex gap-4 overflow-hidden py-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="min-w-[140px] space-y-3">
                    <Skeleton className="aspect-square rounded-[2.5rem]" />
                    <Skeleton className="h-3 w-3/4 mx-auto" />
                </div>
            ))}
        </div>
      );
  }

  if (sortedSuppliers.length === 0) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
        <SuppliersCarousel items={sortedSuppliers} />
    </div>
  );
}

export function NearbyBenefitsCarousel() {
  const { userLocation, requestLocation } = useUser();
  const firestore = useFirestore();
  const { isApproved: isCincoDos } = useCincoDosStatus();

  useEffect(() => {
    if (!userLocation) {
        requestLocation();
    }
  }, [userLocation, requestLocation]);

  // Fetch benefits
  const benefitsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'benefits').withConverter(createConverter<Benefit>()),
      where('isVisible', '==', true),
      limit(40)
    );
  }, [firestore]);

  const { data: benefits, isLoading: isBenefitsLoading } = useCollection(benefitsQuery);

  // Fetch all suppliers to get their locations (small scale join)
  const suppliersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()));
  }, [firestore]);

  const { data: suppliers, isLoading: isSuppliersLoading } = useCollection(suppliersQuery);

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

  if (!userLocation || isBenefitsLoading || isSuppliersLoading) {
      return (
        <div className="flex gap-4 overflow-hidden py-2">
            {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-48 min-w-[280px] rounded-[2.5rem]" />
            ))}
        </div>
      );
  }

  if (sortedBenefits.length === 0) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-200">
        <BenefitsCarousel items={sortedBenefits} />
    </div>
  );
}

