'use client';

import React from 'react';
import { ProductManager } from '@/components/delivery/product-manager';
import { useUser } from '@/firebase';
import { Package, Search, ShoppingBag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SupplierProductsPage() {
    const { supplierData, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                <Skeleton className="h-12 w-64 rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-[2.5rem]" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-[2.5rem]" />)}
                </div>
            </div>
        );
    }

    if (!supplierData) return null;

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <header className="space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-2xl border border-primary/20">
                    <Package className="h-5 w-5 text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-primary">Inventario</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
                    Tus <span className="text-primary">Productos</span>
                </h1>
                <p className="text-lg text-muted-foreground font-medium max-w-2xl leading-relaxed italic opacity-80">
                    Gestiona tu catálogo, actualiza precios y controla el stock en tiempo real.
                </p>
            </header>

            <div className="rounded-[2.5rem] border-white/5 bg-card/50 backdrop-blur-sm p-8 shadow-premium overflow-hidden">
                <ProductManager supplierId={supplierData.id} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-transparent border border-white/5 space-y-4">
                    <ShoppingBag className="h-8 w-8 text-primary" />
                    <h3 className="text-xl font-bold tracking-tight">Visto Público</h3>
                    <p className="text-sm text-muted-foreground font-medium">Los productos que marques como activos aparecerán automáticamente en tu perfil público para que los alumnos puedan pedirlos.</p>
                 </div>
                 <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-500/10 to-transparent border border-white/5 space-y-4">
                    <Search className="h-8 w-8 text-blue-500" />
                    <h3 className="text-xl font-bold tracking-tight">SEO & Descubrimiento</h3>
                    <p className="text-sm text-muted-foreground font-medium">Usa descripciones claras y nombres precisos para que tus productos aparezcan primero en las búsquedas del club.</p>
                 </div>
            </div>
        </div>
    );
}
