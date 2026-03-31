'use client';

import { useDocOnce, useFirestore, useUser, useCollectionOnce } from '@/firebase';
import { doc, query, collection, where } from 'firebase/firestore';
import { useMemo } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { notFound, useSearchParams } from 'next/navigation';
import type { SerializableBenefit } from '@/types/data';
import BenefitDetailSkeleton from '@/components/perks/perk-detail-skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Award, Flame, Star, ChevronLeft, Package, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { makeBenefitSerializable } from '@/lib/data';
import { createConverter } from '@/lib/firestore-converter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/haptics';
import Link from 'next/link';

const RedeemPerkDialog = dynamic(() => import('@/components/perks/redeem-perk-dialog'), {
  ssr: false,
  loading: () => <Button className="w-full h-12 rounded-xl" disabled>Cargando...</Button>
});

export default function BenefitDetailPage() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    const benefitRef = useMemo(() => {
        if (!id) return null;
        return doc(firestore, 'perks', id).withConverter(createConverter<SerializableBenefit>());
    }, [id, firestore]);
    
    const { data: benefit, isLoading, error } = useDocOnce(benefitRef);
    
    const ownerRef = useMemo(() => {
        if (!benefit?.ownerId) return null;
        return doc(firestore, 'roles_supplier', benefit.ownerId);
    }, [benefit, firestore]);
    const { data: owner } = useDocOnce(ownerRef);

    const deliveryProductsQuery = useMemo(() => {
        if (!benefit?.linkedProductIds || benefit.linkedProductIds.length === 0 || !firestore) return null;
        const chunk = benefit.linkedProductIds.slice(0, 10);
        return query(collection(firestore, 'products'), where('id', 'in', chunk), where('isActive', '==', true));
    }, [benefit, firestore]);
    const { data: linkedProducts } = useCollectionOnce(deliveryProductsQuery);

    const { addItem } = useCart();
    const { toast } = useToast();

    const handleAddComboToCart = () => {
        if (!linkedProducts || !owner) return;
        linkedProducts.forEach((product: any) => {
            let finalPrice = product.price;
            const isSameSupplier = benefit?.ownerId === product.supplierId;

            if (isSameSupplier) {
                if (benefit?.discountPercentage && benefit.discountPercentage > 0) {
                    finalPrice = finalPrice * (1 - benefit.discountPercentage / 100);
                }
                if (benefit?.discountAmount && benefit.discountAmount > 0) {
                    finalPrice = Math.max(0, finalPrice - benefit.discountAmount);
                }
                finalPrice = Math.round(finalPrice);
            }

            addItem({
                productId: product.id,
                name: product.name,
                price: finalPrice,
                quantity: 1,
                imageUrl: product.imageUrl
            }, {
                id: owner.id,
                name: owner.name,
                phone: owner.whatsapp || ''
            });
        });
        haptic.vibrateSuccess();
        toast({ title: "¡Combo añadido al carrito!", description: "Revisa tu pedido en la sección de Delivery." });
    };

    if (isLoading || isUserLoading) {
        return <BenefitDetailSkeleton />;
    }

    if (!id || error) {
        return (
            <MainLayout>
                <div className="p-8">
                     <Alert variant="destructive" className="rounded-2xl border-destructive/20 bg-destructive/5">
                        <AlertTitle className="font-black uppercase tracking-tight">Error al cargar el beneficio</AlertTitle>
                        <AlertDescription>{error?.message || 'ID de beneficio no proporcionado'}</AlertDescription>
                    </Alert>
                </div>
            </MainLayout>
        );
    }
    
    if (!benefit) {
        notFound();
    }

    const serializableBenefit = makeBenefitSerializable(benefit as any);

    return (
        <MainLayout>
            <div className="container max-w-2xl mx-auto p-4 py-8 md:py-12 min-h-screen">
                <Link 
                    href="/benefits" 
                    className="inline-flex items-center gap-2 mb-6 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors group"
                >
                    <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Volver a beneficios
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <Card className="overflow-hidden rounded-[2rem] border-primary/5 glass glass-dark shadow-premium relative">
                        <div className="relative w-full aspect-[4/3] md:aspect-video">
                            <Image
                                src={serializableBenefit.imageUrl}
                                alt={serializableBenefit.title}
                                fill
                                className="object-cover transition-transform duration-1000 hover:scale-105"
                                priority
                                sizes="(max-width: 768px) 100vw, 800px"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            
                            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                {serializableBenefit.isFeatured && (
                                    <div className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                                        <Flame className="h-3 w-3" />
                                        <span>Destacado</span>
                                    </div>
                                )}
                                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 backdrop-blur-md border border-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                                    <Star className="h-3 w-3 fill-current" />
                                    <span>{serializableBenefit.category}</span>
                                </div>
                            </div>

                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 text-sm font-black text-white shadow-2xl mb-4">
                                    <Award className="h-5 w-5 text-primary" />
                                    <span className="tracking-tight">{serializableBenefit.points} PUNTOS XP</span>
                                </div>
                                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-white drop-shadow-lg leading-[0.9]">
                                    {serializableBenefit.title}
                                </h1>
                            </div>
                        </div>

                        <div className='flex flex-col p-8 md:p-10'>
                            <CardContent className="p-0 space-y-8">
                                <div className="space-y-4">
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">Descripción del beneficio</h2>
                                    <p className="text-lg font-medium text-foreground/80 leading-relaxed italic">
                                        "{serializableBenefit.description}"
                                    </p>
                                </div>

                                {serializableBenefit.location && (
                                    <div className="flex items-center gap-4 p-4 rounded-3xl bg-primary/5 border border-primary/10">
                                        <div className="h-10 w-10 rounded-2xl bg-background flex items-center justify-center shadow-sm">
                                            <MapPin className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Ubicación</p>
                                            <p className="text-sm font-bold text-foreground truncate">{serializableBenefit.location}</p>
                                        </div>
                                    </div>
                                )}

                                {serializableBenefit.linkedProductIds && serializableBenefit.linkedProductIds.length > 0 && linkedProducts && linkedProducts.length > 0 && (
                                    <div className="mt-8 flex flex-col gap-4">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                                                <Package className="h-4 w-4" /> Combo Exclusivo Estuclub
                                            </h3>
                                        </div>
                                        <div className="flex flex-col gap-3 p-4 rounded-[1.5rem] bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 shadow-inner">
                                            {linkedProducts.map((p: any) => {
                                                let finalPrice = p.price;
                                                const isSameSupplier = serializableBenefit.ownerId === p.supplierId;

                                                if (isSameSupplier) {
                                                    if (serializableBenefit.discountPercentage && serializableBenefit.discountPercentage > 0) {
                                                        finalPrice = finalPrice * (1 - serializableBenefit.discountPercentage / 100);
                                                    }
                                                    if (serializableBenefit.discountAmount && serializableBenefit.discountAmount > 0) {
                                                        finalPrice = Math.max(0, finalPrice - serializableBenefit.discountAmount);
                                                    }
                                                    finalPrice = Math.round(finalPrice);
                                                }
                                                const hasDiscount = finalPrice < p.price;
                                                
                                                return (
                                                    <div key={p.id} className="flex justify-between items-center text-sm font-bold text-foreground bg-background/50 rounded-xl p-3 shadow-sm border border-white/5">
                                                        <span className="truncate pr-2">{p.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            {hasDiscount && (
                                                                <span className="text-muted-foreground line-through text-xs font-medium">${p.price}</span>
                                                            )}
                                                            <span className="text-primary flex-shrink-0">${finalPrice}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="flex flex-col gap-3 p-0 mt-10">
                                {serializableBenefit.linkedProductIds && serializableBenefit.linkedProductIds.length > 0 && linkedProducts && linkedProducts.length > 0 ? (
                                    <Button 
                                        className="w-full h-16 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-base shadow-2xl shadow-orange-500/30 bg-orange-500 hover:bg-orange-600 transition-all hover:scale-[1.02] active:scale-95" 
                                        onClick={() => {
                                            if (!isUserLoading && user) {
                                                handleAddComboToCart();
                                            }
                                        }}
                                        disabled={isUserLoading || !user}
                                    >
                                        {isUserLoading ? 'Procesando...' : (
                                            <span className="flex items-center justify-center gap-3">
                                                Agregar al Carrito <ShoppingBag className="h-5 w-5" />
                                            </span>
                                        )}
                                    </Button>
                                ) : (
                                    <RedeemPerkDialog perk={serializableBenefit}>
                                        <Button 
                                            className="w-full h-16 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-base shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" 
                                            onClick={() => haptic.vibrateImpact()}
                                            disabled={isUserLoading || !user}
                                        >
                                            {isUserLoading ? 'Procesando...' : (
                                                <span className="flex items-center justify-center gap-3">
                                                    Canjear ahora <ArrowRight className="h-5 w-5" />
                                                </span>
                                            )}
                                        </Button>
                                    </RedeemPerkDialog>
                                )}
                            </CardFooter>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </MainLayout>
    );
}
