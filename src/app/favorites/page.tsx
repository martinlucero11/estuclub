'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollectionOnce } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import MainLayout from '@/components/layout/main-layout';
import BenefitsGrid from '@/components/perks/perks-grid';
import { makeBenefitSerializable } from '@/lib/data';
import type { Benefit, SupplierProfile, SerializableBenefit } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { BrandSkeleton } from '@/components/ui/brand-skeleton';
import { Heart, Building, Ticket, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';

function FavoritesContent() {
  const { user, userData, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const favoriteBenefitIds = userData?.favoriteBenefits || [];
  const favoriteSupplierIds = userData?.favoriteSuppliers || [];

  const benefitsQuery = useMemo(() => {
    if (favoriteBenefitIds.length === 0) return null;
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
      <div className="container p-8 space-y-8 min-h-screen">
        <BrandSkeleton className="h-10 w-48 rounded-xl" />
        <BrandSkeleton className="h-64 w-full rounded-[2rem]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container flex flex-col items-center justify-center py-20 text-center">
        <Heart className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-bold">Inicia sesión</h2>
        <p className="text-muted-foreground mt-2">Debes estar registrado para guardar tus favoritos.</p>
        <Button onClick={() => router.push('/login')} className="mt-6">
          Iniciar Sesión
        </Button>
      </div>
    );
  }

  const hasNoFavorites = favoriteBenefitIds.length === 0 && favoriteSupplierIds.length === 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen">
      <div className="mb-10 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="p-4 rounded-[2rem] glass glass-dark shadow-premium border-primary/10">
            <Heart className="h-8 w-8 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.4)] fill-current" />
        </div>
        <div>
            <h1 className="text-3xl font-black tracking-tight uppercase text-foreground leading-tight">Mis Favoritos</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Tu selección exclusiva</p>
        </div>
      </div>

      {hasNoFavorites ? (
        <div className="py-10 animate-in fade-in scale-95 duration-700 fill-mode-both">
            <PremiumEmptyState 
                icon={Heart}
                title="Aún no tienes favoritos"
                description="Guarda los beneficios que más te gusten para verlos aquí. Mientras tanto, ¡diviértete un poco!"
                actionLabel="Explorar Beneficios"
                onAction={() => router.push('/benefits')}
                showGame={true}
            />
        </div>
      ) : (
        <div className="space-y-12 animate-in fade-in duration-1000">
          {favoriteSupplierIds.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-primary/5 pb-3">
                <Building className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">Mis Clubers</h2>
              </div>
              {suppliersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <BrandSkeleton className="h-24 w-full rounded-[2rem]" />
                  <BrandSkeleton className="h-24 w-full rounded-[2rem]" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suppliers?.map((supplier, idx) => (
                    <Link 
                      key={supplier.id} 
                      href={`/proveedores/view?slug=${supplier.slug}`}
                      className={cn(
                        "flex items-center p-5 rounded-[2rem] border-primary/5 transition-all duration-500 group",
                        "glass glass-dark shadow-premium hover:scale-[1.02] hover:border-primary/20",
                        "animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                      )}
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <Avatar className="h-14 w-14 mr-4 overflow-hidden rounded-2xl border-2 border-background shadow-md shadow-black/5">
                          <AvatarImage src={supplier.logoUrl || undefined} className="object-cover transition-transform duration-500 group-hover:scale-110" />
                          <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
                              {getInitials(supplier.name)}
                          </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                          <h3 className="font-black text-base truncate text-foreground group-hover:text-primary transition-colors leading-tight">
                              {supplier.name}
                          </h3>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mt-0.5">
                              {supplier.type}
                          </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-primary/5 pb-3">
              <Ticket className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">Mis Beneficios</h2>
            </div>
            {benefitsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <BrandSkeleton className="h-64 w-full rounded-[2rem]" />
                <BrandSkeleton className="h-64 w-full rounded-[2rem]" />
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
