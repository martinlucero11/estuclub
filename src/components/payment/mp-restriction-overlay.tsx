'use client';

import React from 'react';
import { useUser } from '@/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Wallet, ArrowRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getMPOAuthUrl } from '@/lib/mercadopago';

/**
 * MPRestrictionOverlay Component
 * Blocks access to the dashboard if the grace period for Mercado Pago vinculation has expired.
 */
export default function MPRestrictionOverlay() {
    const { user, userData, isUserLoading } = useUser();

    if (isUserLoading || !userData) return null;

    const isLinked = userData.mp_linked || false;
    const gracePeriodEnd = userData.mp_grace_period_end?.toDate() || null;
    const now = new Date();

    const isGracePeriodExpired = gracePeriodEnd && now > gracePeriodEnd;
    const isRestricted = !isLinked && isGracePeriodExpired;

    if (!isRestricted) return null;

    const handleLink = () => {
        if (!user) return;
        window.location.href = getMPOAuthUrl(user.uid);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full"
            >
                <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
                    <div className="h-3 bg-[#d93b64] w-full" />
                    <CardContent className="p-10 text-center space-y-8">
                        <div className="relative mx-auto w-24 h-24">
                            <div className="absolute inset-0 bg-[#d93b64]/10 rounded-[2rem] animate-pulse" />
                            <div className="relative flex items-center justify-center h-full">
                                <ShieldAlert className="h-12 w-12 text-[#d93b64]" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Acceso <br/><span className="text-[#d93b64]">Restringido</span></h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
                                Tu plazo de gracia de 7 días ha finalizado. Para continuar operando en <b>Estuclub</b>, debes vincular tu cuenta de Mercado Pago.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4 text-left">
                            <Wallet className="h-10 w-10 text-slate-300 flex-shrink-0" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                Necesitamos tu cuenta vinculada para procesar tus pagos y comisiones de forma automática.
                            </p>
                        </div>

                        <Button 
                            onClick={handleLink}
                            className="w-full h-16 bg-[#d93b64] hover:bg-[#d93b64]/90 text-white font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-[#d93b64]/20"
                        >
                            VINCULAR AHORA <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>

                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic">
                            Proceso seguro vía Mercado Pago API
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
