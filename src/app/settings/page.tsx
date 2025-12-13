'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
    const [notificationStatus, setNotificationStatus] = useState(true);
    const { setTheme } = useTheme();
    const { toast } = useToast();
    
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
                <header className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        Ajustes
                    </h1>
                    <p className="text-muted-foreground">
                        Personaliza tu experiencia en la aplicación.
                    </p>
                </header>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Apariencia</CardTitle>
                            <CardDescription>
                                Personaliza la apariencia de la aplicación.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className='space-y-0.5'>
                                        <Label htmlFor="theme-select">Tema</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Selecciona el tema para la aplicación.
                                        </p>
                                    </div>
                                    <Select onValueChange={(theme) => setTheme(theme)} defaultValue="system">
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Tema del Sistema" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">
                                                <div className='flex items-center gap-2'>
                                                   <Sun className='h-4 w-4'/> Claro
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="dark">
                                                <div className='flex items-center gap-2'>
                                                   <Moon className='h-4 w-4'/> Oscuro
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="system">
                                                <div className='flex items-center gap-2'>
                                                   <Monitor className='h-4 w-4'/> Sistema
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

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
                </div>
            </div>
        </MainLayout>
    );
}