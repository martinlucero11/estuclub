
'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc, writeBatch, increment, query, where, getDocs, Timestamp, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Perk } from '@/lib/data';
import { ArrowRight, CheckCircle, CalendarDays } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';

interface RedeemPerkDialogProps {
  perk: Perk;
  children?: React.ReactNode;
  isCarouselTrigger?: boolean;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  dni: string;
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

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (!redemptionId || !user || typeof window === 'undefined') return;

    const validationUrl = `${window.location.origin}/redeem?redemptionId=${redemptionId}&userId=${user.uid}`;
    QRCode.toDataURL(validationUrl, {
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
  }, [redemptionId, user]);


  const handleRedeem = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: 'Debes iniciar sesión para canjear un beneficio.',
      });
      return;
    }
     if (!userProfile || !userProfileRef) {
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: 'No se pudo cargar tu perfil. Inténtalo de nuevo.',
      });
      return;
    }

    setIsRedeeming(true);
    setError(null);
    setRedemptionId(null);
    setQrCodeUrl(null);

    try {
      const today = new Date();
      const todayDayString = today.toLocaleDateString('es-ES', { weekday: 'long' });
      const capitalizedDay = todayDayString.charAt(0).toUpperCase() + todayDayString.slice(1);

      if (perk.availableDays && perk.availableDays.length > 0 && !perk.availableDays.includes(capitalizedDay)) {
        setError(`Este beneficio solo está disponible los días: ${perk.availableDays.join(', ')}.`);
        setIsRedeeming(false);
        return;
      }
      
      if (perk.validUntil && (perk.validUntil as Timestamp).toDate() < new Date()) {
        setError("Este beneficio ha expirado y ya no se puede canjear.");
        setIsRedeeming(false);
        return;
      }
      
      // Use the root collection now
      const redeemedBenefitsRef = collection(firestore, 'redeemed_benefits');
      
      if (perk.redemptionLimit && perk.redemptionLimit > 0) {
        const q = query(
          redeemedBenefitsRef, 
          where("benefitId", "==", perk.id),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.size >= perk.redemptionLimit) {
          setError(`Has alcanzado el límite de canje (${perk.redemptionLimit}) para este beneficio.`);
          setIsRedeeming(false);
          return;
        }
      }

      const newRedemptionRef = doc(collection(firestore, 'redeemed_benefits'));
      const benefitRef = doc(firestore, 'benefits', perk.id);

      const redemptionData = {
        id: newRedemptionRef.id,
        userId: user.uid,
        ownerId: perk.ownerId, // IMPORTANT: Save the supplier's ID
        userName: `${userProfile.firstName} ${userProfile.lastName}`,
        userDni: userProfile.dni,
        benefitId: perk.id,
        benefitTitle: perk.title,
        redeemedAt: serverTimestamp(),
        status: 'valid',
        points: perk.points || 0,
      };
      
      const batch = writeBatch(firestore);
      batch.set(newRedemptionRef, redemptionData);

      if (perk.points && perk.points > 0) {
        batch.update(userProfileRef, {
          points: increment(perk.points),
        });
      }
      
      batch.update(benefitRef, { redemptionCount: increment(1) });

      await batch.commit(); 

      setRedemptionId(newRedemptionRef.id);
      toast({
        title: '¡Beneficio Canjeado!',
        description: `Muestra el código QR al proveedor para validarlo.`,
      });

    } catch (e: any) {
        console.error('Error redeeming perk:', e);
        setError('No se pudo canjear el beneficio. Por favor, inténtalo de nuevo.');
        toast({
            variant: 'destructive',
            title: 'Error al Canjear',
            description: e.message || 'Ocurrió un problema al canjear el beneficio.',
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

  const isLoading = isUserLoading || (user && isProfileLoading);

  const triggerButton = (
      <Button className="w-full" variant="outline" onClick={() => setIsOpen(true)} disabled={isLoading || !user}>
        {isLoading ? 'Cargando...' : 'Canjear Beneficio'}
        {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
  );
  
  const RedemptionSuccessView = () => (
      <div className='text-center space-y-4 flex flex-col items-center'>
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h3 className="text-lg font-semibold">¡Beneficio Pre-canjeado!</h3>
          <p className='text-sm text-muted-foreground'>Muestra el siguiente código QR al proveedor para completar la validación.</p>
          <div className="my-4 flex justify-center">
            {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Código QR de canje" />
            ) : (
                <Skeleton className="h-64 w-64 rounded-lg" />
            )}
          </div>
      </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
            {isCarouselTrigger ? (
                 <div className="h-full w-full cursor-pointer" onClick={() => setIsOpen(true)}>
                    {children}
                </div>
            ) : triggerButton}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
            {!redemptionId ? (
                <>
                    <DialogHeader>
                        <DialogTitle>Canjear: {perk.title}</DialogTitle>
                        <DialogDescription>
                        Confirma para canjear este beneficio y ganar {perk.points || 0} puntos.
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
                        <Button type="button" onClick={handleRedeem} disabled={isRedeeming || isLoading}>
                            {isRedeeming ? 'Validando...' : (isLoading ? 'Cargando perfil...' : <> <CheckCircle className='mr-2'/>Confirmar Canje</>)}
                        </Button>
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
