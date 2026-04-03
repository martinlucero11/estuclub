'use client';
import { useState, useMemo } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { BellPlus, BellOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
            <Button disabled className="h-14 px-6 rounded-2xl font-black uppercase tracking-widest bg-background/20 opacity-50 border-2 border-dashed">
                <BellPlus className="mr-2 h-5 w-5" />
                Login para suscribirte
            </Button>
        );
    }
    
    if (isLoading || isProcessing) {
         return (
            <Button disabled className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest bg-background/20 border-2 border-primary/20">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Cargando...
            </Button>
        );
    }

    if (isSubscribed) {
        return (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="h-14">
                <Button 
                    variant="outline" 
                    onClick={handleUnsubscribe}
                    className="h-full px-8 rounded-2xl font-extrabold uppercase tracking-widest bg-primary/10 border-2 border-primary/40 text-primary shadow-xl hover:bg-primary/20 transition-all duration-300"
                >
                    <BellOff className="mr-2 h-5 w-5" />
                    Suscrito
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="h-14">
            <Button 
                onClick={handleSubscribe}
                className="h-full px-8 rounded-2xl font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground shadow-premium-pink border-2 border-white/20 transition-all duration-300"
            >
                <BellPlus className="mr-2 h-5 w-5" />
                Suscribirse
            </Button>
        </motion.div>
    );
}

