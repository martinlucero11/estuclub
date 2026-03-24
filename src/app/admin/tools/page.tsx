'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser } from '@/firebase';
import { AlertTriangle, RotateCcw, Shield, CircleNotch } from '@phosphor-icons/react';

export default function AdminToolsPage() {
    const { roles, isUserLoading } = useUser();
    const [status, setStatus] = useState<string | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [confirmStep, setConfirmStep] = useState(0);

    const isAdmin = roles.includes('admin');

    if (isUserLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <CircleNotch className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </MainLayout>
        );
    }

    if (!isAdmin) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <Shield className="h-16 w-16 text-muted-foreground/30" />
                    <h1 className="text-2xl font-bold">Acceso denegado</h1>
                    <p className="text-muted-foreground">Solo administradores pueden acceder a esta página.</p>
                </div>
            </MainLayout>
        );
    }

    const handleResetRanking = async () => {
        if (confirmStep < 2) {
            setConfirmStep(confirmStep + 1);
            return;
        }

        setIsResetting(true);
        setStatus(null);
        try {
            const res = await fetch('/api/admin/reset-ranking', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setStatus(`✅ ${data.message}`);
            } else {
                setStatus(`❌ ${data.error || 'Error desconocido'}`);
            }
        } catch (error) {
            setStatus('❌ Error de conexión.');
        } finally {
            setIsResetting(false);
            setConfirmStep(0);
        }
    };

    const buttonLabels = [
        'Resetear Ranking',
        '¿Estás seguro?',
        '¡CONFIRMAR RESET!'
    ];

    return (
        <MainLayout>
            <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Herramientas de Admin</h1>
                    <p className="text-muted-foreground mt-1">Acciones administrativas para gestionar la plataforma.</p>
                </div>

                <Card className="border-destructive/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Resetear Ranking
                        </CardTitle>
                        <CardDescription>
                            Esto pondrá los puntos de <strong>todos los usuarios</strong> en 0. 
                            Esta acción no se puede deshacer. Usalo al inicio de cada temporada/periodo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button 
                            variant={confirmStep >= 1 ? 'destructive' : 'outline'}
                            className="w-full font-bold"
                            onClick={handleResetRanking}
                            disabled={isResetting}
                        >
                            {isResetting ? (
                                <CircleNotch className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <RotateCcw className="h-4 w-4 mr-2" />
                            )}
                            {isResetting ? 'Reseteando...' : buttonLabels[confirmStep]}
                        </Button>

                        {confirmStep > 0 && !isResetting && (
                            <Button 
                                variant="ghost" 
                                className="w-full text-muted-foreground"
                                onClick={() => setConfirmStep(0)}
                            >
                                Cancelar
                            </Button>
                        )}

                        {status && (
                            <p className={`text-sm font-medium p-3 rounded-lg ${status.startsWith('✅') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {status}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
