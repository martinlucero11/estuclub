'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCollectionOnce, useFirestore } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import MainLayout from '@/components/layout/main-layout';
import BenefitsGrid from '@/components/perks/perks-grid';
import { makeBenefitSerializable } from '@/lib/data';
import type { Benefit, SupplierProfile, SerializableBenefit } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Building, Ticket } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q')?.toLowerCase() || '';
  const firestore = useFirestore();

  // Memoize queries and limit results for performance
  const benefitsQuery = useMemo(() => 
    query(collection(firestore, 'benefits').withConverter(createConverter<Benefit>()), where('isVisible', '==', true), limit(50)),
    [firestore]
  );
  const suppliersQuery = useMemo(() => 
    query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()), limit(50)),
    [firestore]
  );

  const { data: benefits, isLoading: benefitsLoading } = useCollectionOnce(benefitsQuery);
  const { data: suppliers, isLoading: suppliersLoading } = useCollectionOnce(suppliersQuery);

  const filteredBenefits = useMemo(() => {
    if (!benefits || !q) return [];
    return benefits
      .filter(b => 
        b.title.toLowerCase().includes(q) || 
        b.description?.toLowerCase().includes(q) || 
        b.category?.toLowerCase().includes(q)
      )
      .map(makeBenefitSerializable);
  }, [benefits, q]);

  const filteredSuppliers = useMemo(() => {
    if (!suppliers || !q) return [];
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.description?.toLowerCase().includes(q) || 
      s.type?.toLowerCase().includes(q)
    );
  }, [suppliers, q]);

  const isNoResults = !benefitsLoading && !suppliersLoading && filteredBenefits.length === 0 && filteredSuppliers.length === 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Search className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
            {q ? `Resultados para "${q}"` : "Buscar en EstuClub"}
        </h1>
      </div>

      {(benefitsLoading || suppliersLoading) ? (
        <div className="space-y-12">
           <section className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
           </section>
           <section className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
              </div>
           </section>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Suppliers Results */}
          {filteredSuppliers.length > 0 && (
            <section>
              <div className="mb-6 flex items-center gap-2 text-muted-foreground border-b pb-2">
                <Building className="h-5 w-5" />
                <h2 className="text-lg font-semibold text-foreground">Clubers ({filteredSuppliers.length})</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers.map(supplier => (
                  <Link 
                    key={supplier.id} 
                    href={`/proveedores/${supplier.slug}`}
                    className="flex items-center p-4 rounded-2xl border bg-card hover:bg-accent hover:border-primary/30 transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <Avatar className="h-12 w-12 mr-4 overflow-hidden rounded-full border-2 border-background group-hover:border-primary/20 transition-colors">
                        <AvatarImage src={supplier.logoUrl || undefined} className="object-cover" />
                        <AvatarFallback className="bg-muted text-lg font-bold">
                            {getInitials(supplier.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <h3 className="font-bold truncate text-foreground group-hover:text-primary transition-colors">
                            {supplier.name}
                        </h3>
                        <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                            {supplier.type}
                        </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Benefits Results */}
          <section>
            <div className="mb-6 flex items-center gap-2 text-muted-foreground border-b pb-2">
              <Ticket className="h-5 w-5" />
              <h2 className="text-lg font-semibold text-foreground">Beneficios ({filteredBenefits.length})</h2>
            </div>
            {filteredBenefits.length > 0 ? (
              <BenefitsGrid benefits={filteredBenefits} />
            ) : (
              <div className="text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center space-y-3">
                <Search className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground font-medium">No encontramos beneficios que coincidan.</p>
                <Link href="/benefits" className="text-primary hover:underline text-sm font-semibold">
                    Ver todos los beneficios
                </Link>
              </div>
            )}
          </section>

          {isNoResults && q && (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold">Sin resultados para "{q}"</h2>
                <p className="text-muted-foreground mt-2">Intenta con otras palabras clave o explora las categorías.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <MainLayout>
      <Suspense fallback={
        <div className="container p-8 space-y-12">
            <Skeleton className="h-10 w-64 mb-8"/>
            <Skeleton className="h-20 w-full rounded-2xl"/>
            <Skeleton className="h-64 w-full rounded-2xl"/>
        </div>
      }>
        <SearchResults />
      </Suspense>
    </MainLayout>
  );
}
