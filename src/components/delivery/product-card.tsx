'use client';

import React from 'react';
import { Product, SupplierProfile } from '@/types/data';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/haptics';
import { optimizeImage, getInitials } from '@/lib/utils';
import Image from 'next/image';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCart } from '@/context/cart-context';

interface ProductCardProps {
    product: Product;
    onAdd?: () => void;
    variant?: 'default' | 'carousel';
}

export function ProductCard({ product, onAdd, variant = 'default' }: ProductCardProps) {
    const firestore = useFirestore();
    const { addItem } = useCart();
    const { data: supplier } = useDoc<SupplierProfile>(product.supplierId ? doc(firestore, 'roles_supplier', product.supplierId) : null);

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        haptic.vibrateSubtle();
        
        if (onAdd) {
            onAdd();
        } else if (supplier) {
            addItem({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                imageUrl: product.imageUrl
            }, {
                id: supplier.id,
                name: supplier.name,
                phone: supplier.whatsappContact || ''
            });
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5 }}
            className={`group relative bg-card glass glass-dark border border-white/10 rounded-[1.5rem] p-3 flex flex-col h-full hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 ${variant === 'carousel' ? 'w-full' : ''}`}
        >
            {product.imageUrl && (
                <div className="aspect-square w-full rounded-xl overflow-hidden mb-3 bg-muted relative shadow-inner">
                    <Image 
                        src={optimizeImage(product.imageUrl, 400)} 
                        alt={product.name} 
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    {product.originalPrice && product.originalPrice > product.price && (
                        <div className="absolute top-2 left-2 bg-primary text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-xl z-10 animate-pulse">
                            {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                        </div>
                    )}
                </div>
            )}
            
            <div className="space-y-1.5 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <h4 className="font-black text-xs leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">{product.name}</h4>
                </div>
                
                {/* Supplier Info (Comercio) */}
                <div className="flex items-center gap-2 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Avatar className="h-4 w-4 border border-primary/20">
                        <AvatarImage src={supplier?.logoUrl} />
                        <AvatarFallback className="text-[6px]">{getInitials(supplier?.name || 'S')}</AvatarFallback>
                    </Avatar>
                    <span className="text-[9px] font-bold truncate text-muted-foreground uppercase tracking-wider">{supplier?.name || 'Cargando...'}</span>
                </div>

                <p className="text-[9px] text-muted-foreground font-medium italic line-clamp-1 opacity-70 group-hover:opacity-100 transition-opacity">{product.description}</p>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex flex-col">
                    {product.originalPrice && product.originalPrice > product.price && (
                        <p className="text-[9px] text-muted-foreground line-through decoration-primary/40 leading-none mb-0.5">$ {product.originalPrice.toLocaleString()}</p>
                    )}
                    <p className="font-black text-primary text-sm tracking-tighter">$ {product.price.toLocaleString()}</p>
                </div>
                
                <Button 
                    size="icon" 
                    variant="default"
                    className="h-8 w-8 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-110 active:scale-90" 
                    onClick={handleAdd}
                    disabled={!product.stockAvailable}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            
            {!product.stockAvailable && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center rounded-[1.5rem] z-20">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-destructive text-white px-3 py-1.5 rounded-full shadow-2xl">Sin Stock</span>
                </div>
            )}
        </motion.div>
    );
}
