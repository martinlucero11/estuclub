'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';

export default function SeedPage() {
    const { roles } = useUser();
    const firestore = useFirestore();
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const collectionsToSeed = [
        'roles_admin',
        'roles_supplier',
        'roles_rider',
        'roles_cluber',
        'suppliers',
        'benefits',
        'benefitRedemptions',
        'orders',
        'rider_applications',
        'supplier_requests',
        'categories',
        'home_sections',
        'banners',
        'announcements'
    ];

    const handleSeed = async () => {
        if (!roles.includes('admin')) {
            setStatus('error');
            setMessage('No tenés permisos de Overlord para ejecutar este comando.');
            return;
        }

        setStatus('loading');
        try {
            // 1. Inicializar la estructura base
            for (const coll of collectionsToSeed) {
                const dummyRef = doc(collection(firestore, coll), 'init_check');
                await setDoc(dummyRef, { 
                    initialized: true, 
                    createdAt: new Date().toISOString(),
                    note: 'Documento de inicialización automática de Estuclub' 
                });
            }

            // 2. Crear Categorías por defecto
            const categories = ['Comida', 'Ropa', 'Entretenimiento', 'Servicios', 'Tecnología'];
            for (const cat of categories) {
                await setDoc(doc(firestore, 'categories', cat.toLowerCase()), {
                    name: cat,
                    icon: 'ShoppingBag',
                    order: 0
                });
            }

            // 3. Crear Home Sections básicas
            await setDoc(doc(firestore, 'home_sections', 'destacados'), {
                title: 'Beneficios Destacados',
                type: 'benefits',
                order: 1,
                isVisible: true
            });

            setStatus('success');
            setMessage('Ecosistema de colecciones inicializado exitosamente en Firestore.');
        } catch (error: any) {
            console.error(error);
            setStatus('error');
            setMessage(`Error al inicializar: ${error.message}`);
        }
    };

    return (
        <MainLayout>
            <div className="container max-w-2xl py-20">
                <Card className="border-primary/20 bg-white/50 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <Database className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-black font-montserrat italic uppercase tracking-tighter">
                            Ecosistema de <span className="text-primary">Datos</span>
                        </CardTitle>
                        <CardDescription className="text-base">
                            Este comando inicializará todas las colecciones necesarias en tu Firebase para que la app funcione correctamente.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-6">
                            <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-[#d93b64]">Colecciones a crear:</h4>
                            <div className="flex flex-wrap gap-2">
                                {collectionsToSeed.map(c => (
                                    <Badge key={c} variant="outline" className="bg-white/50 border-primary/20 font-mono text-[10px]">
                                        {c}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {status === 'success' && (
                            <div className="flex items-center gap-3 rounded-xl bg-green-500/10 p-4 text-green-600 border border-green-500/20">
                                <CheckCircle2 className="h-5 w-5 shrink-0" />
                                <p className="text-sm font-bold">{message}</p>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="flex items-center gap-3 rounded-xl bg-red-500/10 p-4 text-red-600 border border-red-500/20">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <p className="text-sm font-bold">{message}</p>
                            </div>
                        )}

                        <Button 
                            className="w-full h-16 text-lg font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20" 
                            size="lg"
                            disabled={status === 'loading'}
                            onClick={handleSeed}
                        >
                            {status === 'loading' ? (
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            ) : (
                                "Inicializar Base de Datos"
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
