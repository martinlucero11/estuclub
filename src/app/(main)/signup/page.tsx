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

type SignupRole = 'choice' | 'student';

const ROLE_OPTIONS = [
    {
        id: 'student',
        title: "Estudiante",
        description: "Accedé a beneficios, puntos XP y tu carnet digital.",
        icon: GraduationCap,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        action: "CREAR MI CUENTA",
        href: null // Handled by state
    },
    {
        id: 'cluber',
        title: "Comercio",
        description: "Impulsá tu marca ofreciendo beneficios exclusivos.",
        icon: Store,
        color: "text-[#d93b64]",
        bg: "bg-[#d93b64]/10",
        action: "SER CLUBER",
        href: "/be-cluber"
    },
    {
        id: 'rider',
        title: "Repartidor",
        description: "Sumate a la logística de beneficios más grande.",
        icon: Bike,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        action: "SER RIDER",
        href: "/be-rider"
    }
];

export default function SignupPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const [view, setView] = useState<SignupRole>('choice');

    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || user) {
        return <SplashScreen />;
    }

    return (
        <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-white overflow-x-hidden pt-safe pb-safe selection:bg-[#d93b64]/10">
            {/* Premium Background Background */}
            <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[60%] bg-[#d93b64]/5 blur-[120px] rounded-full -z-10" />
            <div className="absolute bottom-[-5%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full -z-10" />

            <div className="mobile-container z-10 py-10">
                <header className="mb-12 flex flex-col items-center text-center space-y-4">
                    <Link href="/" className="mb-2 transition-transform hover:scale-105 duration-300">
                         <Image 
                            src="/logo.svg" 
                            alt="EstuClub Logo" 
                            width={160} 
                            height={40} 
                            className="h-10 w-auto filter-rosa"
                        />
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic font-montserrat">
                            {view === 'choice' ? "¿Cómo querés" : "Crear mi"} <span className="text-[#d93b64]">{view === 'choice' ? "Unirte?" : "Cuenta"}</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] opacity-70 italic">
                            {view === 'choice' ? "Elegí tu perfil para empezar" : "Solo te llevará 1 minuto"}
                        </p>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {view === 'choice' ? (
                        <motion.div 
                            key="choice"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="grid gap-6"
                        >
                            {ROLE_OPTIONS.map((opt, i) => {
                                const isExternal = !!opt.href;
                                const content = (
                                    <Card className="rounded-[2.5rem] border-slate-100/60 shadow-xl shadow-slate-200/50 overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all group border-0 bg-white cursor-pointer relative">
                                        <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none", opt.bg)} />
                                        <CardContent className="p-8 flex items-center gap-6 relative z-10">
                                            <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-12", opt.bg)}>
                                                <opt.icon className={cn("h-8 w-8", opt.color)} />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-950 font-montserrat leading-none">{opt.title}</h3>
                                                    {opt.id === 'student' && <Badge className="bg-[#d93b64] text-white font-black text-[8px] uppercase tracking-widest px-2 py-0 border-0 h-4">POPULAR</Badge>}
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed line-clamp-2">{opt.description}</p>
                                            </div>
                                            <div className="rounded-2xl h-12 w-12 bg-slate-50 text-slate-300 group-hover:bg-[#d93b64] group-hover:text-white transition-all flex items-center justify-center">
                                                <ChevronRight className="h-6 w-6" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                );

                                return (
                                    <motion.div
                                        key={opt.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        onClick={isExternal ? undefined : () => setView('student')}
                                    >
                                        {isExternal ? (
                                            <Link href={opt.href!}>{content}</Link>
                                        ) : content}
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="student-form"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className="space-y-6"
                        >
                            <Button 
                                variant="ghost" 
                                onClick={() => setView('choice')}
                                className="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#d93b64] px-0"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" /> VOLVER A SELECCIÓN
                            </Button>
                            <SignupForm />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-12 text-center flex flex-col items-center space-y-6">
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
    );
}
