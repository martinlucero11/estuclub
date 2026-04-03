'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShieldCheck, Wallet, ExternalLink, Loader2 } from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { getMPOAuthUrl } from '@/lib/mercadopago';

/**
 * MPLinkCard Component
 * UI for linking Mercado Pago accounts (Marketplace flow).
 */
export default function MPLinkCard() {
    const { user, userData, isUserLoading } = useUser();
    const [isRedirecting, setIsRedirecting] = React.useState(false);

    const isLinked = userData?.mp_linked || false;

    const handleLink = () => {
        if (!user) return;
        setIsRedirecting(true);
        // OAuth URL generates with the userId as state to identify the user on callback
        const authUrl = getMPOAuthUrl(user.uid);
        window.location.href = authUrl;
    };

    if (isUserLoading) {
        return <div className="h-48 w-full bg-background animate-pulse rounded-[2.5rem]" />;
    }

    return (
        <Card className="rounded-[2.5rem] border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white overflow-hidden group">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
                        isLinked ? "bg-emerald-500/10 text-emerald-500" : "bg-background text-foreground"
                    )}>
                        <Wallet className="h-6 w-6" />
                    </div>
                </div>
                <CardTitle className="text-xl font-black italic uppercase tracking-tight mt-4">Mercado Pago</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-foreground">Estado de la Pasarela</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className={cn(
                    "p-6 rounded-2xl border-2 transition-all flex items-center justify-between gap-4",
                    isLinked ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-background text-foreground border-foreground"
                )}>
                    <div className="flex items-center gap-3">
                        {isLinked ? <CheckCircle2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5 opacity-40" />}
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest">{isLinked ? 'VINVULADO CON ÉXITO' : 'SIN VINCULAR'}</p>
                            <p className="text-[10px] font-medium opacity-60">
                                {isLinked ? 'Listo para cobrar tus ventas netas' : 'Enlazá tu cuenta para cobrar tus pagos'}
                            </p>
                        </div>
                    </div>
                </div>

                {!isLinked ? (
                    <Button 
                        onClick={handleLink}
                        disabled={isRedirecting}
                        className="w-full h-16 bg-[#cb465a] hover:bg-[#cb465a]/90 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-[#cb465a]/20 group transition-all"
                    >
                        {isRedirecting ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <>Vincular con Mercado Pago <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                        )}
                    </Button>
                ) : (
                    <div className="text-center">
                        <p className="text-[9px] font-bold text-foreground uppercase tracking-widest italic">Tu cuenta MP ya se encuentra enlazada a Estuclub.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

