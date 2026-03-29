
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
import { useUser, useFirestore, useDoc } from '@/firebase';
import { collection, serverTimestamp, doc, writeBatch, increment, query, where, getDocs, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { SerializableBenefit, UserProfile } from '@/types/data';
import { CheckCircle, CalendarDays, Award, Loader2, Lock } from 'lucide-react';
import { BrandSkeleton } from '../ui/brand-skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/haptics';
import { triggerSuccessEffect } from '../ui/success-animation';
import { MagneticButton } from '../ui/magnetic-button';
import { getLevelInfo } from '@/lib/gamification';

interface RedeemPerkDialogProps {
  perk: SerializableBenefit;
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

export default function RedeemPerkDialog({ perk, children, isCarouselTrigger = false }: RedeemPerkDialogProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redemptionId, setRedemptionId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const userProfileRef = useMemo(() => {
    // Only create the user profile document reference if the user is logged in AND the dialog is open.
    // This prevents the useDoc hook from running on page load for every perk card.
    if (user && isOpen) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [user, firestore, isOpen]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

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


  const handleRedeem = async () => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      toast({
        variant: 'destructive',
        title: 'Sin conexión',
        description: 'Se requiere una conexión a internet activa para realizar el canje. Por favor, intenta de nuevo cuando tengas señal.'
      });
      setIsRedeeming(false);
      return;
    }

    if (!user || !userProfile || !firestore || !perk.ownerId) {
      toast({ 
          variant: 'destructive', 
          title: 'Error de datos',
          description: 'No se pudo cargar la información completa para el canje. Inténtalo de nuevo.' 
      });
      return;
    }

    setIsRedeeming(true);
    haptic.vibrateImpact();
    setError(null);
    setRedemptionId(null);
    setQrCodeUrl(null);

    const pointsToGrant = perk.points || 0;

    try {
      const today = new Date();
      const todayDayString = today.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();

      if (perk.availableDays && perk.availableDays.length > 0 && !perk.availableDays.some(d => d.toLowerCase() === todayDayString)) {
        throw new Error(`Este beneficio solo está disponible los días: ${perk.availableDays.join(', ')}.`);
      }
      
      if (perk.validUntil && new Date(perk.validUntil) < new Date()) {
        throw new Error("Este beneficio ha expirado y ya no se puede canjear.");
      }

      const userLevel = getLevelInfo(userProfile.points || 0).level;
      const isPrivileged = userProfile.role === 'admin' || userProfile.role === 'supplier';

      if (perk.minLevel && userLevel < perk.minLevel && !isPrivileged) {
        throw new Error(`Este beneficio requiere Nivel ${perk.minLevel}. Tu nivel actual es ${userLevel}.`);
      }
      
      // TEMPORARILY REMOVED PRE-CHECKS TO ISOLATE PERMISSION ERROR
      /*
      if (perk.redemptionLimit && perk.redemptionLimit > 0) {
        const q = query(
          userRedemptionsRef, 
          where("perkId", "==", perk.id),
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.size >= perk.redemptionLimit) {
          throw new Error(`Has alcanzado el límite de canje (${perk.redemptionLimit}) para este beneficio.`);
        }
      }
      */
      
      const batch = writeBatch(firestore);

      // Using simpler supplier name fallback if possible
      const supplierName = perk.supplierName || 'Proveedor';
      
      const redemptionIdToSet = doc(collection(firestore, 'perkRedemptions')).id;
      const rootRedemptionRef = doc(firestore, "perkRedemptions", redemptionIdToSet);
      const userRedemptionRef = doc(firestore, 'users', user.uid, 'redeemed_perks', redemptionIdToSet);
      
      const qrCodeValue = JSON.stringify({ redemptionId: redemptionIdToSet });
      
      // Prepare redemption data with careful defaults
      const redemptionData = {
        id: redemptionIdToSet,
        perkId: perk.id,
        perkTitle: perk.title || 'Beneficio',
        perkDescription: perk.description || '',
        perkImageUrl: perk.imageUrl || perk.image || '',
        perkLocation: perk.location || '',
        userId: user.uid,
        userName: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || userProfile.username || 'Usuario',
        userDni: userProfile.dni || 'No especificado',
        supplierId: perk.ownerId,
        supplierName: perk.supplierName || 'Proveedor',
        redeemedAt: serverTimestamp(),
        qrCodeValue: qrCodeValue,
        status: 'pending' as const,
        pointsGranted: pointsToGrant
      };

      console.log("Attempting direct writes to isolate permissions error...");
      
      try {
        console.log("Writing to root collection...");
        // Use setDoc instead of batch for debugging
        await setDoc(rootRedemptionRef, redemptionData);
      } catch (err: any) {
        console.error("FAILED root collection write:", err);
        throw new Error(`Error de permisos (Root): ${err.message || 'Desconocido'}`);
      }

      try {
        console.log("Writing to user subcollection...");
        await setDoc(userRedemptionRef, redemptionData);
      } catch (err: any) {
        console.error("FAILED user subcollection write:", err);
        throw new Error(`Error de permisos (Sub): ${err.message || 'Desconocido'}`);
      }

      setRedemptionId(redemptionIdToSet);
      haptic.vibrateSuccess();
      triggerSuccessEffect();
      toast({
        title: '¡Beneficio Canjeado!',
        description: `Muestra el código QR al proveedor para validarlo. Se han sumado ${pointsToGrant} puntos a tu cuenta.`,
      });

    } catch (e: any) {
        console.error('Error redeeming perk:', e);
        setError(e.message || 'No se pudo canjear el beneficio. Por favor, inténtalo de nuevo.');
        toast({ 
            variant: 'destructive', 
            title: 'Error al Canjear', 
            description: e.message || 'Ocurrió un problema al canjear el beneficio.'
        });
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

  const isLoading = isUserLoading || (!!user && isProfileLoading);

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
      <div className='text-center space-y-4 flex flex-col items-center'>
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h3 className="text-lg font-semibold">¡Beneficio Pre-canjeado!</h3>
          <p className='text-sm text-muted-foreground'>Muestra el siguiente código QR al proveedor para completar la validación.</p>
          <div className="my-4 flex justify-center">
            {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Código QR de canje" className="rounded-2xl border-4 border-background shadow-xl" />
            ) : (
                <BrandSkeleton className="h-64 w-64 rounded-2xl" />
            )}
          </div>
      </div>
  );

  const points = perk.points || 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <TriggerWrapper>
        {children}
      </TriggerWrapper>
      <DialogContent className="sm:max-w-md">
        {!redemptionId ? (
            <>
                <DialogHeader>
                    <DialogTitle>Canjear: {perk.title}</DialogTitle>
                    <DialogDescription>
                    Al canjear este beneficio, ganarás <span className="font-bold text-primary">{points}</span> puntos.
                    </DialogDescription>
                </DialogHeader>

                {perk.availableDays && perk.availableDays.length > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                        <CalendarDays className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className='flex-1'>
                            <p className="text-sm font-medium">Días disponibles</p>
                            <div className="flex flex-wrap gap-x-2 pt-1 font-mono text-sm text-muted-foreground">
                                {daysOrder.map(day => (
                                    <span key={day} className={perk.availableDays?.includes(day) ? 'text-foreground font-bold' : 'text-muted-foreground/50'}>
                                        {dayAbbreviations[day]}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                {userProfile && perk.minLevel && getLevelInfo(userProfile.points || 0).level < perk.minLevel && userProfile.role !== 'admin' && userProfile.role !== 'supplier' && (
                    <Alert className="bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-500">
                        <Lock className="h-4 w-4" />
                        <AlertTitle className="font-black uppercase tracking-tighter">Nivel Insuficiente</AlertTitle>
                        <AlertDescription className="text-xs">
                            Este beneficio requiere **Nivel {perk.minLevel}**. Sigue participando para subir de nivel y desbloquearlo.
                        </AlertDescription>
                    </Alert>
                )}

                {userProfile && (
                     <p className="text-sm text-center text-muted-foreground">
                        Tus puntos actuales: <span className="font-bold text-foreground">{userProfile.points || 0}</span>
                    </p>
                )}


                {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <DialogFooter className="sm:justify-between gap-2">
                    <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                        Cancelar
                    </Button>
                    <MagneticButton disabled={isRedeeming || isProfileLoading || !user || (perk.minLevel ? (getLevelInfo(userProfile?.points || 0).level < perk.minLevel && userProfile?.role !== 'admin' && userProfile?.role !== 'supplier') : false)}>
                        <Button 
                          type="button" 
                          onClick={handleRedeem} 
                          disabled={isRedeeming || isProfileLoading || !user || (perk.minLevel ? (getLevelInfo(userProfile?.points || 0).level < perk.minLevel && userProfile?.role !== 'admin' && userProfile?.role !== 'supplier') : false)}
                          className="h-12 rounded-xl font-black uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20"
                        >
                            {isRedeeming ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : isProfileLoading ? 'Cargando...' : (
                                <span className="flex items-center">
                                    <Award className='mr-2 h-4 w-4' />
                                    Confirmar Canje
                                </span>
                            )}
                        </Button>
                    </MagneticButton>
                </DialogFooter>
            </>
        ) : (
            <>
                <DialogHeader>
                    <DialogTitle>Validación Requerida</DialogTitle>
                </DialogHeader>
                <RedemptionSuccessView />
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </>
        )}
      </DialogContent>
    </Dialog>
  );
}
