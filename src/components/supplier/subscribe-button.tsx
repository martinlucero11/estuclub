'use client';
import { useState, useMemo } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { BellPlus, BellOff, CircleNotch } from '@phosphor-icons/react';
import { useToast } from '@/hooks/use-toast';

interface SubscribeButtonProps {
    supplierId: string;
}

export default function SubscribeButton({ supplierId }: SubscribeButtonProps) {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const subscriptionRef = useMemo(() => {
        if (!user || !supplierId || isUserLoading) return null;
        return doc(firestore, 'roles_supplier', supplierId, 'subscribers', user.uid);
    }, [user, supplierId, firestore, isUserLoading]);

    const { data: subscription, isLoading: isSubscriptionLoading } = useDoc(subscriptionRef);
    const isSubscribed = !!subscription;
    
    const handleSubscribe = async () => {
        if (!subscriptionRef) return;
        setIsProcessing(true);
        try {
            await setDoc(subscriptionRef, { subscribedAt: serverTimestamp() });
            toast({ title: "¡Suscrito!", description: "Recibirás notificaciones de este Cluber." });
        } catch (error) {
            console.error("Error subscribing:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo completar la suscripción." });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUnsubscribe = async () => {
        if (!subscriptionRef) return;
        setIsProcessing(true);
        try {
            await deleteDoc(subscriptionRef);
            toast({ title: "Suscripción cancelada" });
        } catch (error) {
            console.error("Error unsubscribing:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo cancelar la suscripción." });
        } finally {
            setIsProcessing(false);
        }
    };
    
    const isLoading = isUserLoading || isSubscriptionLoading;

    if (!user) {
        return (
            <Button disabled>
                <BellPlus className="mr-2 h-4 w-4" />
                Inicia sesión para suscribirte
            </Button>
        );
    }
    
    if (isLoading || isProcessing) {
         return (
            <Button disabled>
                <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
            </Button>
        );
    }

    if (isSubscribed) {
        return (
            <Button variant="outline" onClick={handleUnsubscribe}>
                <BellOff className="mr-2 h-4 w-4" />
                Suscrito
            </Button>
        );
    }

    return (
        <Button onClick={handleSubscribe}>
            <BellPlus className="mr-2 h-4 w-4" />
            Suscribirse
        </Button>
    );
}
