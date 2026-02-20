
'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import MainLayout from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/ui/page-header';

export default function SettingsPage() {
    const [notificationStatus, setNotificationStatus] = useState(true);
    const { toast } = useToast();
    const { setTheme } = useTheme();

    const handleNotificationToggle = (checked: boolean) => {
        setNotificationStatus(checked);
        toast({
            title: `Notificaciones ${checked ? 'activadas' : 'desactivadas'}`,
            description: `Has ${checked ? 'habilitado' : 'deshabilitado'} las notificaciones de la aplicación.`,
        });
    }

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
                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="notifications-switch">Recibir notificaciones</Label>
                                         <p className="text-xs text-muted-foreground">
                                            Activa o desactiva las notificaciones push.
                                        </p>
                                    </div>
                                    <Switch
                                        id="notifications-switch"
                                        checked={notificationStatus}
                                        onCheckedChange={handleNotificationToggle}
                                        aria-label="Toggle notifications"
                                    />
                                </div>
                            </div>
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
