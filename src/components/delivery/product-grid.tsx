'use client';

import React from 'react';
import { useProducts } from '@/hooks/use-products';
import { useCart } from '@/context/cart-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ProductCard } from './product-card';
import { useDoc, useFirestore } from '@/firebase';
import { SupplierProfile } from '@/types/data';
import { doc } from 'firebase/firestore';

interface ProductGridProps {
    supplierId: string;
    supplierName: string;
    supplierPhone: string;
}

export function ProductGrid({ supplierId, supplierName, supplierPhone }: ProductGridProps) {
    const firestore = useFirestore();
    const { data: products, isLoading } = useProducts(supplierId, true);
    const { data: supplierProfile } = useDoc<SupplierProfile>(supplierId ? doc(firestore, 'roles_supplier', supplierId) : null);
    
    const { addItem } = useCart();
    const { toast } = useToast();

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full rounded-[2rem]" />)}
            </div>
        );
    }

    if (!products || products.length === 0) {
        return null;
    }

    const renderProduct = (product: any) => (
        <ProductCard 
            key={product.id} 
            product={product} 
            onAdd={() => {
                addItem({
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                    imageUrl: product.imageUrl
                }, { id: supplierId, name: supplierName, phone: supplierPhone });
                toast({ title: "Añadido al carrito", description: product.name });
            }}
        />
    );

    const sections = supplierProfile?.menuSections || [];
    const hasSections = sections.length > 0;
    const unassignedProducts = products.filter(p => !p.menuSection || !sections.includes(p.menuSection));

    if (!hasSections) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
                {products.map(renderProduct)}
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {sections.map(section => {
                const sectionProducts = products.filter(p => p.menuSection === section);
                if (sectionProducts.length === 0) return null;
                
                return (
                    <div key={section} className="space-y-4">
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-foreground border-b border-white/5 pb-2">
                            {section}
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {sectionProducts.map(renderProduct)}
                        </div>
                    </div>
                );
            })}
            
            {unassignedProducts.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg md:text-xl font-black uppercase tracking-[0.2em] text-foreground border-b border-white/5 pb-2 opacity-70">
                        Más Productos
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {unassignedProducts.map(renderProduct)}
                    </div>
                </div>
            )}
        </div>
    );
}

