
'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import MainLayout from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/ui/page-header';
import { getMessaging, getToken } from 'firebase/messaging';
import { useFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BellRing } from 'lucide-react';

export default function SettingsPage() {
    const { toast } = useToast();
    const { setTheme } = useTheme();
    const { firebaseApp, user, firestore } = useFirebase();
    const [isRequesting, setIsRequesting] = useState(false);

    const handleNotificationRequest = async () => {
        if (!firebaseApp || !user || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Debes iniciar sesión para activar las notificaciones.',
            });
            return;
        }

        setIsRequesting(true);

        try {
            const messaging = getMessaging(firebaseApp);
            const permission = await Notification.requestPermission();

            if (permission === 'granted') {
                const currentToken = await getToken(messaging, {
                    vapidKey: 'YOUR_VAPID_KEY_HERE',
                });

                if (currentToken) {
                    const tokenRef = doc(firestore, 'userTokens', user.uid);
                    await setDoc(tokenRef, {
                        token: currentToken,
                        uid: user.uid,
                        platform: 'web',
                        updatedAt: serverTimestamp(),
                    }, { merge: true });

                    toast({
                        title: '¡Notificaciones activadas!',
                        description: 'Recibirás las últimas novedades.',
                    });
                } else {
                    throw new Error('No se pudo obtener el token de registro.');
                }
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Permiso denegado',
                    description: 'No se pudieron activar las notificaciones.',
                });
            }
        } catch (err) {
            console.error('An error occurred while retrieving token.', err);
            toast({
                variant: 'destructive',
                title: 'Error de notificación',
                description: 'No se pudo completar la solicitud. Inténtalo de nuevo.',
            });
        } finally {
            setIsRequesting(false);
        }
    };


    return (
        <MainLayout>
            <div className="flex-1 space-y-12 p-4 md:p-12 mb-12 max-w-4xl mx-auto animate-fade-in">
                <header className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
                        Configuración
                    </h1>
                    <p className="text-lg text-foreground font-medium max-w-2xl leading-relaxed">
                        Personaliza tu experiencia y ajusta tus preferencias en EstuClub.
                    </p>
                </header>

                <div className="grid gap-8">
                     <Card className="glass glass-dark shadow-premium border-0 rounded-[2rem] overflow-hidden group">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-black tracking-tight uppercase text-xs text-foreground/80 tracking-[0.2em]">Notificaciones</CardTitle>
                            <CardDescription className="text-sm font-medium">
                                Gestiona cómo recibes las alertas y novedades del Club.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Button 
                             onClick={handleNotificationRequest} 
                             disabled={isRequesting}
                             className="h-12 px-6 rounded-xl font-bold active:scale-95 transition-all shadow-md hover:shadow-primary/20"
                           >
                                <BellRing className="mr-2 h-5 w-5" />
                                {isRequesting ? 'PROCESANDO...' : 'ACTIVAR NOTIFICACIONES'}
                           </Button>
                        </CardContent>
                    </Card>

                    <Card className="glass glass-dark shadow-premium border-0 rounded-[2rem] overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-black tracking-tight uppercase text-xs text-foreground/80 tracking-[0.2em]">Apariencia</CardTitle>
                            <CardDescription className="text-sm font-medium">
                                Elige el estilo visual que mejor se adapte a vos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Button variant="outline" className="h-14 rounded-xl font-bold border-primary/10 hover:bg-primary/5 active:scale-95 transition-all" onClick={() => setTheme('light')}>CLARO</Button>
                                <Button variant="outline" className="h-14 rounded-xl font-bold border-primary/10 hover:bg-primary/5 active:scale-95 transition-all" onClick={() => setTheme('dark')}>OSCURO</Button>
                                <Button variant="outline" className="h-14 rounded-xl font-bold border-primary/10 hover:bg-primary/5 active:scale-95 transition-all" onClick={() => setTheme('system')}>SISTEMA</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}

