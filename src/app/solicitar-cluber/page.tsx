'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { useUser } from '@/firebase';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle2, Buildings, ArrowRight, CircleNotch, Sparkles, SquaresFour } from '@phosphor-icons/react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { haptic } from '@/lib/haptics';

export default function SolicitarCluberPage() {
    const { user, roles, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasPendingRequest, setHasPendingRequest] = useState(false);
    const [isLoadingRequest, setIsLoadingRequest] = useState(true);

    const isSupplier = roles.includes('supplier');

    useEffect(() => {
        const checkPendingRequest = async () => {
            if (!user) return;
            try {
                const q = query(
                    collection(firestore, 'supplier_requests'),
                    where('userId', '==', user.uid),
                    where('status', '==', 'pending')
                );
                const querySnapshot = await getDocs(q);
                setHasPendingRequest(!querySnapshot.empty);
            } catch (error) {
                console.error("Error checking pending request:", error);
            } finally {
                setIsLoadingRequest(false);
            }
        };

        if (user) {
            checkPendingRequest();
        } else if (!isUserLoading) {
            setIsLoadingRequest(false);
        }
    }, [user, firestore, isUserLoading]);

    const handleRequest = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        setIsSubmitting(true);
        try {
            const requestRef = doc(collection(firestore, 'supplier_requests'));
            await setDoc(requestRef, {
                userId: user.uid,
                userEmail: user.email,
                userName: user.displayName || 'Usuario Estuclub',
                status: 'pending',
                createdAt: serverTimestamp(),
                requestedAt: serverTimestamp(),
            });

            setHasPendingRequest(true);
            haptic.vibrateSuccess();
            toast({
                title: "Solicitud enviada",
                description: "Revisaremos tu perfil y te avisaremos pronto.",
            });
        } catch (error) {
            console.error("Error submitting request:", error);
            haptic.vibrateError();
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo enviar la solicitud. Inténtalo más tarde.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isUserLoading || isLoadingRequest) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <CircleNotch className="h-8 w-8 text-primary animate-spin" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
                <PageHeader title="Únete como Cluber" />
                
                <Card className="rounded-[2rem] border-primary/10 glass glass-dark shadow-premium overflow-hidden">
                    <CardHeader className="pt-10 px-8 text-center">
                        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-4 border border-primary/20 shadow-xl shadow-primary/5">
                            <Buildings className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tighter uppercase text-foreground">
                            {isSupplier ? 'Ya eres un Cluber' : 'Haz crecer tu comercio'}
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-muted-foreground italic">
                            La red de beneficios estudiantiles más grande de la región.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 pb-8 space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { title: "Visibilidad Total", desc: "Aparece ante miles de estudiantes en el mapa interactivo." },
                                { title: "Gestión de Beneficios", desc: "Crea descuentos y promociones exclusivas en tiempo real." },
                                { title: "Analíticas Premium", desc: "Mide el impacto de tus promociones con datos detallados." },
                                { title: "Ecosistema Digital", desc: "Digitaliza tus canjes con códigos QR sin costos extras." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                                    <div className="h-8 w-8 shrink-0 bg-primary/20 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                        <CheckCircle2 className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">{item.title}</h4>
                                        <p className="text-[11px] font-bold text-muted-foreground/70">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {hasPendingRequest && (
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-3 animate-pulse">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <span className="text-xs font-black uppercase tracking-widest text-primary">
                                    Tu solicitud está siendo revisada
                                </span>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="px-8 pb-10">
                        {isSupplier ? (
                            <Button 
                                onClick={() => router.push('/panel-cluber')}
                                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                            >
                                <SquaresFour className="mr-2 h-4 w-4" />
                                Ir al Panel de Cluber
                            </Button>
                        ) : hasPendingRequest ? (
                            <Button 
                                disabled
                                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-muted text-muted-foreground border border-border/20"
                            >
                                Solicitud Enviada
                            </Button>
                        ) : (
                            <Button 
                                onClick={handleRequest}
                                disabled={isSubmitting}
                                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 group hover:scale-[1.02] transition-all"
                            >
                                {isSubmitting ? (
                                    <CircleNotch className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        Enviar Solicitud
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </MainLayout>
    );
}
