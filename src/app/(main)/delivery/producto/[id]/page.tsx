'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDocOnce, useUser } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { Product, SupplierProfile } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import MainLayout from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ShoppingBag, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/haptics';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { optimizeImage } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const firestore = useFirestore();
    const { addItem } = useCart();
    const { toast } = useToast();

    const productRef = React.useMemo(() => {
        if (!id || !firestore) return null;
        return doc(firestore, 'products', id).withConverter(createConverter<Product>());
    }, [id, firestore]);

    const { data: product, isLoading: productLoading } = useDocOnce<Product>(productRef);

    const supplierRef = React.useMemo(() => {
        if (!product?.supplierId || !firestore) return null;
        return doc(firestore, 'roles_supplier', product.supplierId).withConverter(createConverter<SupplierProfile>());
    }, [product, firestore]);

    const { data: supplier, isLoading: supplierLoading } = useDocOnce<SupplierProfile>(supplierRef);

    const { roles } = useUser();

    React.useEffect(() => {
        if (id && firestore && !roles?.includes('admin')) {
            // Telemetry: track view intention, exclude admin tests
            const ref = doc(firestore, 'products', id);
            updateDoc(ref, { viewsCount: increment(1) }).catch(console.error);
        }
    }, [id, firestore, roles]);

    const isLoading = productLoading || (product && supplierLoading);

    const handleAddToCart = () => {
        if (!product || !supplier) return;
        
        haptic.vibrateSuccess();
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

        toast({
            title: "¡Añadido al carrito!",
            description: `${product.name} se agregó a tu pedido.`,
        });
    };

    if (isLoading) {
        return (
            <MainLayout>
                <div className="container max-w-xl mx-auto p-4 py-8 md:py-12 min-h-screen">
                    <Skeleton className="h-4 w-32 mb-6" />
                    <Skeleton className="w-full aspect-square md:aspect-video rounded-[2rem] mb-6" />
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-6" />
                </div>
            </MainLayout>
        );
    }

    if (!product) {
        return (
            <MainLayout>
                <div className="container max-w-xl mx-auto p-4 py-12 text-center text-foreground">
                    <ShoppingBag className="mx-auto h-12 w-12 opacity-20 mb-4" />
                    <p>Producto no encontrado.</p>
                    <Button variant="ghost" className="mt-4" onClick={() => router.push('/delivery')}>
                        Volver al inicio
                    </Button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="container max-w-xl mx-auto p-4 py-6 md:py-12 min-h-screen pb-32">
                <button 
                    onClick={() => router.back()} 
                    className="inline-flex items-center gap-2 mb-6 text-xs font-black uppercase tracking-[0.2em] text-foreground hover:text-primary transition-colors group"
                >
                    <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Volver
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="overflow-hidden rounded-[2rem] border-primary/5 glass glass-dark shadow-premium relative">
                        {product.imageUrl ? (
                            <div className="relative w-full aspect-square md:aspect-video bg-background">
                                <Image
                                    src={optimizeImage(product.imageUrl, 800)}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                                {product.originalPrice && product.originalPrice > product.price && (
                                    <div className="absolute top-4 left-4 bg-primary text-white text-[12px] font-black px-3 py-1.5 rounded-xl shadow-2xl animate-pulse">
                                        {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full aspect-square md:aspect-video bg-background flex items-center justify-center">
                                <ShoppingBag className="h-16 w-16 opacity-10" />
                            </div>
                        )}

                        <CardContent className="p-6 md:p-8 space-y-6">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground leading-tight mb-2">
                                    {product.name}
                                </h1>
                                <p className="text-foreground italic font-medium leading-relaxed">
                                    {product.description}
                                </p>
                            </div>

                            {supplier && (
                                <div 
                                    className="flex items-center gap-3 p-4 rounded-[1.5rem] bg-secondary/10 border border-secondary/20 cursor-pointer hover:bg-secondary/20 transition-colors"
                                    onClick={() => router.push(`/proveedores/view?slug=${supplier.slug}`)}
                                >
                                    <Avatar className="h-10 w-10 border-2 border-primary/20 bg-background">
                                        <AvatarImage src={supplier.logoUrl} alt={supplier.name} className="object-cover" />
                                        <AvatarFallback><Store className="h-5 w-5 text-foreground" /></AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground">Vendido por</p>
                                        <p className="font-extrabold text-foreground">{supplier.name}</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/10 flex items-end justify-between">
                                <div className="flex flex-col">
                                    {product.originalPrice && product.originalPrice > product.price && (
                                        <span className="text-foreground line-through text-sm font-medium mb-1 decoration-primary/40">
                                            $ {product.originalPrice.toLocaleString()}
                                        </span>
                                    )}
                                    <span className="text-3xl md:text-4xl font-black text-primary tracking-tighter">
                                        $ {product.price.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="fixed bottom-20 left-4 right-4 md:static md:mt-8 md:px-0 z-40 max-w-xl mx-auto">
                        <Button 
                            className="w-full h-16 rounded-[1.5rem] bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase tracking-widest shadow-2xl shadow-orange-500/30 transition-all active:scale-95 border-none" 
                            onClick={handleAddToCart}
                            disabled={!product.stockAvailable}
                        >
                            {!product.stockAvailable ? (
                                'Sin Stock'
                            ) : (
                                <span className="flex items-center justify-center gap-3">
                                    Agregar al Pedido <ShoppingBag className="h-5 w-5" />
                                </span>
                            )}
                        </Button>
                    </div>

                </motion.div>
            </div>
        </MainLayout>
    );
}
