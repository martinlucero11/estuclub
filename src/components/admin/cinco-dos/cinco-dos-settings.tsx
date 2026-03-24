'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Instagram, FloppyDiskBack, CircleNotch } from '@phosphor-icons/react';
import { useToast } from '@/hooks/use-toast';

export function CincoDosSettings() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const settingsRef = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'settings', 'cinco_dos');
    }, [firestore]);
    
    const { data: settings, isLoading } = useDoc(settingsRef);
    
    const [urls, setUrls] = useState({
        instagramCincoDos: '',
        instagramCda: ''
    });

    useEffect(() => {
        if (settings) {
            setUrls({
                instagramCincoDos: settings.instagramCincoDos || '',
                instagramCda: settings.instagramCda || ''
            });
        }
    }, [settings]);

    const handleSave = async () => {
        if (!settingsRef) return;
        setIsSaving(true);
        try {
            await setDoc(settingsRef, urls, { merge: true });
            toast({ title: 'Configuración guardada', description: 'Los enlaces de Instagram han sido actualizados.' });
        } catch (error) {
            console.error('Error saving settings:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la configuración.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="animate-pulse h-32 bg-muted rounded-xl w-full mb-8" />;
    }

    return (
        <Card className="mb-8 border-primary/20 shadow-premium">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-primary" />
                    Redes Sociales (Página Pública)
                </CardTitle>
                <CardDescription>
                    Estos enlaces aparecerán como botones inmersivos en la página de inicio de Cinco.Dos.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="ig-cincodos" className="font-bold">Instagram Cinco.Dos (URL)</Label>
                        <Input 
                            id="ig-cincodos" 
                            placeholder="https://instagram.com/cinco.dos" 
                            value={urls.instagramCincoDos}
                            onChange={(e) => setUrls({...urls, instagramCincoDos: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ig-cda" className="font-bold">Instagram Casa del Alfarero (URL)</Label>
                        <Input 
                            id="ig-cda" 
                            placeholder="https://instagram.com/casadelalfarero" 
                            value={urls.instagramCda}
                            onChange={(e) => setUrls({...urls, instagramCda: e.target.value})}
                        />
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={isSaving} className="shadow-premium-glow group">
                        {isSaving ? <CircleNotch className="w-4 h-4 mr-2 animate-spin" /> : <FloppyDiskBack className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />}
                        Guardar Enlaces
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
