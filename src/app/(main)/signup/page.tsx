'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    GraduationCap, 
    Store, 
    Bike, 
    ChevronRight, 
    ArrowLeft,
    CheckCircle2,
    ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SignupForm from '@/components/auth/signup-form';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/layout/splash-screen';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Estuclub Signup Lobby

export default function SignupPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || user) {
        return <SplashScreen />;
    }

    return (
        <div className="relative flex min-h-[100dvh] flex-col items-center justify-start bg-white overflow-x-hidden pt-24 pb-safe selection:bg-[#d93b64]/10">
            {/* Premium Background */}
            <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[60%] bg-[#d93b64]/5 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-[-5%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full -z-10" />

            <div className="mobile-container z-10 py-10 w-full max-w-[450px]">
                <header className="mb-10 flex flex-col items-center text-center space-y-4">
                    <Link href="/" className="mb-2 transition-transform hover:scale-110 duration-500">
                         <Image 
                            src="/logo.svg" 
                            alt="EstuClub Logo" 
                            width={180} 
                            height={45} 
                            className="h-12 w-auto drop-shadow-[0_0_15px_rgba(255,0,127,0.2)]"
                        />
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic font-montserrat leading-tight">
                            Crear mi <br/><span className="text-[#d93b64] text-4xl">Cuenta</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] opacity-70 italic">
                            Solo te llevará 1 minuto sumarte al club
                        </p>
                    </div>
                </header>

                <div className="space-y-8">
                    {/* Primary Student Form */}
                    <SignupForm />

                    {/* Secondary Access (Lobby Style) */}
                    <div className="grid gap-4 pt-4 border-t border-slate-100">
                        <p className="text-center text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mb-2">OTRAS FORMAS DE UNIRTE</p>
                        
                        <Link href="/be-cluber" className="w-full">
                            <Button 
                                variant="outline" 
                                className="w-full h-16 rounded-[1.5rem] border-[#d93b64]/20 text-[#d93b64] font-black uppercase tracking-widest text-[11px] hover:bg-[#d93b64]/5 shadow-sm transition-all flex items-center justify-between px-8 group"
                            >
                                <div className="flex items-center gap-4">
                                    <Store className="h-5 w-5 opacity-60 group-hover:scale-110 transition-transform" />
                                    <span>¿Tenés un comercio? Sumá tu local</span>
                                </div>
                                <ChevronRight className="h-4 w-4 opacity-30" />
                            </Button>
                        </Link>

                        <Link href="/be-rider" className="w-full">
                            <Button 
                                variant="outline" 
                                className="w-full h-16 rounded-[1.5rem] border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 shadow-sm transition-all flex items-center justify-between px-8 group"
                            >
                                <div className="flex items-center gap-4">
                                    <Bike className="h-5 w-5 opacity-60 group-hover:scale-110 transition-transform text-emerald-500" />
                                    <span>¿Querés generar ingresos? Unite como Rider</span>
                                </div>
                                <ChevronRight className="h-4 w-4 opacity-30" />
                            </Button>
                        </Link>
                    </div>

                    <div className="text-center flex flex-col items-center space-y-6 pt-4">
                        <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase">
                            ¿Ya tenés cuenta?{' '}
                            <Link href="/login" className="font-black text-[#d93b64] underline-offset-4 decoration-2 hover:underline tracking-widest ml-1">
                                INICIÁ SESIÓN
                            </Link>
                        </p>
                        <div className="flex items-center gap-3 opacity-30 select-none">
                            <ShieldCheck className="h-4 w-4 text-slate-400" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Verificado por Estuclub Security</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
