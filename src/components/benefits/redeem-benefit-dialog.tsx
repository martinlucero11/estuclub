
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useCollectionOnce } from '@/firebase';
import { collection, serverTimestamp, doc, writeBatch, query, where, documentId, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { SerializableBenefit, UserProfile } from '@/types/data';
import { CheckCircle, CalendarDays, Award, Loader2, Lock, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { BrandSkeleton } from '../ui/brand-skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/haptics';
import { triggerSuccessEffect } from '../ui/success-animation';
import { MagneticButton } from '../ui/magnetic-button';
import { getLevelInfo } from '@/lib/gamification';
import { useCart } from '@/context/cart-context';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface RedeemBenefitDialogProps {
  benefit: SerializableBenefit;
  children?: React.ReactNode;
  isCarouselTrigger?: boolean;
}

const daysOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const dayAbbreviations: { [key: string]: string } = {
  "Lunes": "L",
  "Martes": "M",
  "Miércoles": "M",
  "Jueves": "J",
  "Viernes": "V",
  "Sábado": "S",
  "Domingo": "D"
};

export default function RedeemBenefitDialog({ benefit, children, isCarouselTrigger = false }: RedeemBenefitDialogProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { addItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redemptionId, setRedemptionId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const userProfileRef = useMemo(() => {
    if (user && isOpen) return doc(firestore, 'users', user.uid);
    return null;
  }, [user, firestore, isOpen]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  // OWNER (Supplier) Data for Cart
  const ownerRef = useMemo(() => {
    if (!benefit?.ownerId || !isOpen) return null;
    return doc(firestore, 'roles_supplier', benefit.ownerId);
  }, [benefit, firestore, isOpen]);
  const { data: owner } = useDoc<any>(ownerRef);

  // Delivery Products Query
  const deliveryProductsQuery = useMemo(() => {
    if (!benefit?.linkedProductIds || benefit.linkedProductIds.length === 0 || !firestore || !isOpen) return null;
    const chunk = benefit.linkedProductIds.slice(0, 10);
    return query(collection(firestore, 'products'), where(documentId(), 'in', chunk), where('isActive', '==', true));
  }, [benefit, firestore, isOpen]);
  const { data: linkedProducts } = useCollectionOnce(deliveryProductsQuery);

  useEffect(() => {
    if (!redemptionId || typeof window === 'undefined') return;
    const qrCodeValue = JSON.stringify({ redemptionId: redemptionId });
    import('qrcode').then(QRCode => {
        QRCode.toDataURL(qrCodeValue, {
            errorCorrectionLevel: 'H',
            width: 256,
        })
        .then(url => {
            setQrCodeUrl(url);
        })
        .catch(err => {
            console.error("QR Code Generation Error:", err);
            setError("No se pudo generar el código QR.");
        });
    });
  }, [redemptionId]);

  const handleAddComboToCart = () => {
    if (!linkedProducts || linkedProducts.length === 0) {
        toast({ title: "Error", description: "No hay productos vinculados al beneficio." });
        return;
    }

    const fallbackSupplierId = benefit?.ownerId || linkedProducts[0]?.supplierId || 'estuclub-comercio';
    let itemsAdded = 0;

    linkedProducts.forEach((product: any) => {
        const originalPrice = Number(product.price || 0);
        let finalPrice = originalPrice;

        if (benefit?.discountPercentage && Number(benefit.discountPercentage) > 0) {
            finalPrice = finalPrice * (1 - Number(benefit.discountPercentage) / 100);
        }
        if (benefit?.discountAmount && Number(benefit.discountAmount) > 0) {
            finalPrice = Math.max(0, finalPrice - Number(benefit.discountAmount));
        }
        finalPrice = Math.round(finalPrice);

        addItem({
            productId: String(product.id || product.name),
            name: String(product.name || 'Combo Benefit'),
            price: finalPrice,
            originalPrice: originalPrice,
            quantity: 1,
            imageUrl: product.imageUrl || ''
        }, {
            id: fallbackSupplierId,
            name: owner?.name || benefit?.supplierName || 'Comercio',
            phone: owner?.whatsappContact || owner?.whatsapp || ''
        });
        itemsAdded++;
    });
    
    if (itemsAdded > 0) {
        haptic.vibrateSuccess();
        toast({ title: "¡Combo añadido al carrito!", description: "Revisa tu pedido en la sección de Delivery." });
        setIsOpen(false); // Close on success
    }
  };

  const handleRedeem = async () => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      toast({ variant: 'destructive', title: 'Sin conexión', description: 'Se requiere una conexión a internet activa.' });
      return;
    }
    if (!user || !userProfile || !firestore || !benefit.ownerId) {
      toast({ variant: 'destructive', title: 'Error de datos', description: 'No se pudo cargar la información.' });
      return;
    }

    setIsRedeeming(true);
    haptic.vibrateImpact();
    setError(null);

    const pointsToGrant = benefit.points || 0;

    try {
      const todayDayString = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
      if (benefit.availableDays && benefit.availableDays.length > 0 && !benefit.availableDays.some(d => d.toLowerCase() === todayDayString)) {
        throw new Error(`Este beneficio solo está disponible los días: ${benefit.availableDays.join(', ')}.`);
      }
      
      const userLevel = getLevelInfo(userProfile.points || 0).level;
      if (benefit.minLevel && userLevel < benefit.minLevel && userProfile.role !== 'admin' && userProfile.role !== 'supplier') {
        throw new Error(`Este beneficio requiere Nivel ${benefit.minLevel}.`);
      }
      
      const redemptionIdToSet = doc(collection(firestore, 'redemptions')).id;
      const rootRedemptionRef = doc(firestore, "redemptions", redemptionIdToSet);
      const userRedemptionRef = doc(firestore, 'users', user.uid, 'redemptions', redemptionIdToSet);
      
      const redemptionData = {
        id: redemptionIdToSet,
        perkId: benefit.id,
        perkTitle: benefit.title || 'Beneficio',
        perpDescription: benefit.description || '',
        userId: user.uid,
        userName: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || userProfile.username || 'Usuario',
        supplierId: benefit.ownerId,
        supplierName: benefit.supplierName || 'Proveedor',
        redeemedAt: serverTimestamp(),
        status: 'pending' as const,
        pointsGranted: pointsToGrant
      };

      await setDoc(rootRedemptionRef, redemptionData);
      await setDoc(userRedemptionRef, redemptionData);

      setRedemptionId(redemptionIdToSet);
      haptic.vibrateSuccess();
      triggerSuccessEffect();
      toast({ title: '¡Beneficio Canjeado!', description: `Muestra el código QR al proveedor.` });
    } catch (e: any) {
        setError(e.message || 'No se pudo canjear.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setError(null);
      setIsRedeeming(false);
      setRedemptionId(null);
      setQrCodeUrl(null);
    }
  }

  const TriggerWrapper = ({ children }: { children: React.ReactNode }) => (
    isCarouselTrigger ? (
      <div className="h-full w-full cursor-pointer" onClick={(e) => { e.preventDefault(); setIsOpen(true); }}>
        {children}
      </div>
    ) : (
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
    )
  );

  const RedemptionSuccessView = () => (
      <div className='text-center space-y-4 flex flex-col items-center py-4'>
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h3 className="text-lg font-black uppercase tracking-tighter">¡Beneficio Pre-canjeado!</h3>
          <p className='text-xs text-foreground max-w-[250px]'>Muestra el código QR al proveedor para completar la validación.</p>
          <div className="my-2 flex justify-center">
            {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Código QR de canje" className="rounded-2xl border-4 border-background shadow-xl w-48 h-48" />
            ) : (
                <BrandSkeleton className="h-48 w-48 rounded-2xl" />
            )}
          </div>
      </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <TriggerWrapper>
        {children}
      </TriggerWrapper>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 rounded-[2.5rem] border-none bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
            <DialogTitle>{benefit.title}</DialogTitle>
            <DialogDescription>{benefit.content || benefit.description}</DialogDescription>
        </DialogHeader>
        {!redemptionId ? (
            <div className="flex flex-col">
                <div className="relative w-full aspect-video overflow-hidden">
                    <Image
                        src={benefit.imageUrl || benefit.image}
                        alt={benefit.title}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-6 right-6">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 text-[10px] font-black text-white shadow-2xl mb-2">
                             <Award className="h-3 w-3 text-primary" />
                             <span>{benefit.points || 0} PUNTOS XP</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase text-white leading-none line-clamp-2">
                            {benefit.title}
                        </h2>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                            {benefit.content || benefit.description}
                        </p>
                    </div>

                    {benefit.availableDays && benefit.availableDays.length > 0 && (
                        <div className="flex items-center gap-3 rounded-2xl bg-background p-3 border-2 border-black">
                            <CalendarDays className="h-5 w-5 text-primary flex-shrink-0" />
                            <div className='flex-1'>
                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Días disponibles</p>
                                <div className="flex flex-wrap gap-x-2 pt-0.5 font-black text-sm text-foreground">
                                    {daysOrder.map(day => (
                                        <span key={day} className={benefit.availableDays?.includes(day) ? 'text-primary' : 'text-foreground'}>
                                            {dayAbbreviations[day]}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Linked Products Section */}
                    {linkedProducts && linkedProducts.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                                <Package className="h-4 w-4" />
                                <span>Combo Incluido</span>
                            </div>
                            <div className="flex flex-col gap-2 p-3 rounded-2xl bg-background border-2 border-black">
                                {linkedProducts.map((p: any) => {
                                    let finalPrice = Number(p.price || 0);
                                    if (benefit.discountPercentage) finalPrice = finalPrice * (1 - Number(benefit.discountPercentage)/100);
                                    if (benefit.discountAmount) finalPrice = Math.max(0, finalPrice - Number(benefit.discountAmount));
                                    finalPrice = Math.round(finalPrice);
                                    
                                    return (
                                        <div key={p.id} className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-black/10 shadow-sm">
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-foreground">{p.name}</p>
                                            </div>
                                            <div className="text-right">
                                                {finalPrice < p.price && (
                                                    <span className="text-[10px] text-foreground line-through mr-1.5">${p.price}</span>
                                                )}
                                                <span className="text-lg font-black text-primary">${finalPrice}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {error && (
                        <Alert variant="destructive" className="rounded-2xl">
                            <AlertTitle className="font-black uppercase tracking-tighter text-xs">Error</AlertTitle>
                            <AlertDescription className="text-xs">{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex flex-col gap-3 pt-2">
                         {linkedProducts && linkedProducts.length > 0 && (
                            <Button 
                                onClick={handleAddComboToCart}
                                className="h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-orange-500/20 group"
                            >
                                Pedir por Delivery
                                <ShoppingBag className="ml-2 h-4 w-4 transition-transform group-hover:scale-110" />
                            </Button>
                         )}

                        <Button 
                            variant={linkedProducts && linkedProducts.length > 0 ? "outline" : "default"}
                            onClick={handleRedeem}
                            disabled={isRedeeming || isProfileLoading || !user}
                            className={cn(
                                "h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl",
                                !(linkedProducts && linkedProducts.length > 0) && "bg-primary shadow-primary/20"
                            )}
                        >
                            {isRedeeming ? <Loader2 className="animate-spin h-4 w-4" /> : (
                                <span className="flex items-center">
                                    Canjear Presencial
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </span>
                            )}
                        </Button>
                        
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground hover:text-foreground transition-colors py-2"
                        >
                            Cerrar detalle
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            <div className="p-6 pt-10">
                <RedemptionSuccessView />
                <Button 
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs mt-4" 
                    variant="secondary" 
                    onClick={() => setIsOpen(false)}
                >
                    Entendido
                </Button>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

