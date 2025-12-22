
'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
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
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc, writeBatch, increment, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { SerializablePerk } from '@/lib/data';
import { CheckCircle, CalendarDays, Award } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface RedeemPerkDialogProps {
  perk: SerializablePerk;
  children?: React.ReactNode;
  isCarouselTrigger?: boolean;
}

interface UserProfile {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    dni: string;
    phone: string;
    gender: string;
    dateOfBirth: string;
    university: string;
    major: string;
    points: number;
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
    if (!redemptionId || typeof window === 'undefined') return;
    
    const qrCodeValue = JSON.stringify({ redemptionId: redemptionId });

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
  }, [redemptionId]);


  const handleRedeem = async () => {
    if (!user || !userProfile || !firestore) {
      toast({ 
          variant: 'destructive', 
          title: 'Error de datos',
          description: 'No se pudo cargar la información completa para el canje. Inténtalo de nuevo.' 
      });
      return;
    }

    setIsRedeeming(true);
    setError(null);
    setRedemptionId(null);
    setQrCodeUrl(null);

    const pointsToGrant = perk.points || 0;

    try {
      const today = new Date();
      const todayDayString = today.toLocaleDateString('es-ES', { weekday: 'long' });
      const capitalizedDay = todayDayString.charAt(0).toUpperCase() + todayDayString.slice(1);

      if (perk.availableDays && perk.availableDays.length > 0 && !perk.availableDays.includes(capitalizedDay)) {
        throw new Error(`Este beneficio solo está disponible los días: ${perk.availableDays.join(', ')}.`);
      }
      
      if (perk.validUntil && new Date(perk.validUntil) < new Date()) {
        throw new Error("Este beneficio ha expirado y ya no se puede canjear.");
      }
      
      const redemptionsRef = collection(firestore, 'benefitRedemptions');
      
      if (perk.redemptionLimit && perk.redemptionLimit > 0) {
        const q = query(
          redemptionsRef, 
          where("benefitId", "==", perk.id),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.size >= perk.redemptionLimit) {
          throw new Error(`Has alcanzado el límite de canje (${perk.redemptionLimit}) para este beneficio.`);
        }
      }
      
      const batch = writeBatch(firestore);
      const newRedemptionRef = doc(redemptionsRef);
      const qrCodeValue = JSON.stringify({ redemptionId: newRedemptionRef.id });
      
      const redemptionData = {
        id: newRedemptionRef.id,
        benefitId: perk.id,
        benefitTitle: perk.title,
        userId: user.uid,
        userName: `${userProfile.firstName} ${userProfile.lastName}`,
        userDni: userProfile.dni,
        supplierId: perk.ownerId,
        redeemedAt: serverTimestamp(),
        qrCodeValue: qrCodeValue,
        status: 'pending' as const,
        pointsGranted: pointsToGrant
      };
      batch.set(newRedemptionRef, redemptionData);
      
      if (pointsToGrant > 0 && userProfileRef) {
        batch.update(userProfileRef, { points: increment(pointsToGrant) });
      }

      await batch.commit();

      setRedemptionId(newRedemptionRef.id);
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
                <img src={qrCodeUrl} alt="Código QR de canje" />
            ) : (
                <Skeleton className="h-64 w-64 rounded-lg" />
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
                    <Button type="button" onClick={handleRedeem} disabled={isRedeeming || isLoading || !user}>
                        {isRedeeming ? 'Procesando...' : (isLoading ? 'Cargando...' : <> <Award className='mr-2 h-4 w-4'/>Confirmar Canje</>)}
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
