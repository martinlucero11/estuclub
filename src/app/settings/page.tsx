
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
            <div className="flex-1 space-y-8 p-4 md:p-8">
                <PageHeader title="Ajustes" />
                <p className="text-muted-foreground -mt-8 mb-8">
                    Personaliza tu experiencia en la aplicación.
                </p>
                <div className="grid gap-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Notificaciones</CardTitle>
                            <CardDescription>
                                Gestiona cómo recibes las notificaciones de la aplicación.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Button onClick={handleNotificationRequest} disabled={isRequesting}>
                                <BellRing className="mr-2 h-4 w-4" />
                                {isRequesting ? 'Procesando...' : 'Activar Notificaciones'}
                           </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tema</CardTitle>
                            <CardDescription>
                                Elige cómo se ve la aplicación.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <Button variant="outline" onClick={() => setTheme('light')}>Claro</Button>
                                <Button variant="outline" onClick={() => setTheme('dark')}>Oscuro</Button>
                                <Button variant="outline" onClick={() => setTheme('system')}>Sistema</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
