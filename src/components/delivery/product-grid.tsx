'use client';

import React from 'react';
import { useProducts } from '@/hooks/use-products';
import { useCart } from '@/context/cart-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ProductCard } from './product-card';

interface ProductGridProps {
    supplierId: string;
    supplierName: string;
    supplierPhone: string;
}

export function ProductGrid({ supplierId, supplierName, supplierPhone }: ProductGridProps) {
    const { data: products, isLoading } = useProducts(supplierId, true);
    const { addItem } = useCart();
    const { toast } = useToast();

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
            </div>
        );
    }

    if (!products || products.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
                <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAdd={() => {
                        addItem({
                            productId: product.id,
                            name: product.name,
                            price: product.price,
                            quantity: 1
                        }, { id: supplierId, name: supplierName, phone: supplierPhone });
                        toast({ title: "Añadido al carrito", description: product.name });
                    }}
                />
            ))}
        </div>
    );
}
