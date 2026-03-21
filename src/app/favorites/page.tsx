'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollectionOnce } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import MainLayout from '@/components/layout/main-layout';
import BenefitsGrid from '@/components/perks/perks-grid';
import { makeBenefitSerializable } from '@/lib/data';
import type { Benefit, SupplierProfile, SerializableBenefit } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Building, Ticket, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';

function FavoritesContent() {
  const { user, userData, isUserLoading } = useUser();
  const firestore = useFirestore();

  const favoriteBenefitIds = userData?.favoriteBenefits || [];
  const favoriteSupplierIds = userData?.favoriteSuppliers || [];

  // Firestore "in" query limits to 10-30 items depending on version. 
  // For simplicity, we fetch them if IDs are present.
  const benefitsQuery = useMemo(() => {
    if (favoriteBenefitIds.length === 0) return null;
    // Limit to 30 for safety with Firestore "in" query
    return query(
      collection(firestore, 'benefits').withConverter(createConverter<Benefit>()), 
      where(documentId(), 'in', favoriteBenefitIds.slice(0, 30))
    );
  }, [firestore, favoriteBenefitIds]);

  const suppliersQuery = useMemo(() => {
    if (favoriteSupplierIds.length === 0) return null;
    return query(
      collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()), 
      where(documentId(), 'in', favoriteSupplierIds.slice(0, 30))
    );
  }, [firestore, favoriteSupplierIds]);

  const { data: benefits, isLoading: benefitsLoading } = useCollectionOnce(benefitsQuery);
  const { data: suppliers, isLoading: suppliersLoading } = useCollectionOnce(suppliersQuery);

  const serializableBenefits = useMemo(() => {
    if (!benefits) return [];
    return benefits.map(makeBenefitSerializable);
  }, [benefits]);

  if (isUserLoading) {
    return (
      <div className="container p-8 space-y-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container flex flex-col items-center justify-center py-20 text-center">
        <Heart className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-bold">Inicia sesión</h2>
        <p className="text-muted-foreground mt-2">Debes estar registrado para guardar tus favoritos.</p>
        <Button asChild className="mt-6">
          <Link href="/login">Iniciar Sesión</Link>
        </Button>
      </div>
    );
  }

  const hasNoFavorites = favoriteBenefitIds.length === 0 && favoriteSupplierIds.length === 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400">
            <Heart className="h-6 w-6 fill-current" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Mis Favoritos</h1>
      </div>

      {hasNoFavorites ? (
        <div className="text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center space-y-4">
          <Heart className="h-12 w-12 text-muted-foreground/30" />
          <div>
            <h3 className="text-lg font-semibold">Aún no tienes favoritos</h3>
            <p className="text-muted-foreground mt-1 text-sm">Guarda los beneficios que más te gusten para verlos aquí.</p>
          </div>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/benefits" className="flex items-center gap-2">
                Explorar Beneficios <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-12">
          {favoriteSupplierIds.length > 0 && (
            <section>
              <div className="mb-6 flex items-center gap-2 border-b pb-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Mis Clubers</h2>
              </div>
              {suppliersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-20 w-full rounded-2xl" />
                  <Skeleton className="h-20 w-full rounded-2xl" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suppliers?.map(supplier => (
                    <Link 
                      key={supplier.id} 
                      href={`/proveedores/${supplier.slug}`}
                      className="flex items-center p-4 rounded-2xl border bg-card hover:bg-accent transition-all duration-200 group shadow-sm hover:shadow-md"
                    >
                      <Avatar className="h-12 w-12 mr-4 overflow-hidden rounded-full border-2 border-background">
                          <AvatarImage src={supplier.logoUrl || undefined} className="object-cover" />
                          <AvatarFallback className="bg-muted text-lg font-bold">
                              {getInitials(supplier.name)}
                          </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                          <h3 className="font-bold truncate text-foreground group-hover:text-primary transition-colors">
                              {supplier.name}
                          </h3>
                          <p className="text-xs text-muted-foreground capitalize">
                              {supplier.type}
                          </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          <section>
            <div className="mb-6 flex items-center gap-2 border-b pb-2">
              <Ticket className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Mis Beneficios</h2>
            </div>
            {benefitsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
              </div>
            ) : (
              <BenefitsGrid benefits={serializableBenefits} />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <MainLayout>
      <FavoritesContent />
    </MainLayout>
  );
}
