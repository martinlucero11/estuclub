'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck,
    X
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';
import SplashScreen from '@/components/layout/splash-screen';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import dynamic from 'next/dynamic';

const UserSignupFlow = dynamic(() => import('@/components/auth/flows/user-signup-flow').then(m => m.UserSignupFlow), { ssr: false });
const StudentSignupFlow = dynamic(() => import('@/components/auth/flows/student-signup-flow').then(m => m.StudentSignupFlow), { ssr: false });
const CluberSignupFlow = dynamic(() => import('@/components/auth/flows/cluber-signup-flow').then(m => m.CluberSignupFlow), { ssr: false });
const RiderSignupFlow = dynamic(() => import('@/components/auth/flows/rider-signup-flow').then(m => m.RiderSignupFlow), { ssr: false });

type Role = 'user' | 'student' | 'cluber' | 'rider' | null;

export default function SignupPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [activeRole, setActiveRole] = useState<Role>(null);

    // Initial role from query param
    useEffect(() => {
        const role = searchParams.get('role') as Role;
        if (role && ['user', 'student', 'cluber', 'rider'].includes(role)) {
            setActiveRole(role);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || user) {
        return <SplashScreen />;
    }

    const roles = [
        { 
            id: 'user' as Role, 
            title: 'Usuario', 
            desc: 'Beneficios y Canjes', 
            icon: "👤", 
            color: 'bg-blue-500/10', 
            iconColor: 'text-foreground' 
        },
        { 
            id: 'student' as Role, 
            title: 'Estudiante', 
            desc: 'Verificación Académica', 
            icon: "🎓", 
            color: 'bg-primary/10', 
            iconColor: 'text-foreground' 
        },
        { 
            id: 'cluber' as Role, 
            title: 'Comercio', 
            desc: 'Digitalizá tu Local', 
            icon: "🏪", 
            color: 'bg-amber-500/10', 
            iconColor: 'text-foreground' 
        },
        { 
            id: 'rider' as Role, 
            title: 'Rider', 
            desc: 'Ganar Entregando', 
            icon: "🚴🏻", 
            color: 'bg-emerald-500/10', 
            iconColor: 'text-foreground' 
        }
    ];

    return (
        <div className="relative flex w-full flex-col items-center justify-center selection:bg-primary/20 bg-background">
            {/* Local Header - Simplified and not fixed to avoid layout issues */}
            <div className="w-full flex items-center justify-between px-6 py-6 mb-4">
                <Link href="/" className="transition-transform active:scale-95">
                    <Image src="/logo-rosa.svg" alt="Estuclub" width={120} height={30} className="h-8 w-auto" />
                </Link>
                {activeRole && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setActiveRole(null)}
                        className="h-10 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[9px] flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
                    >
                        <X className="h-3 w-3" />
                        Cerrar Registro
                    </Button>
                )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-safe z-10 w-full max-w-[500px] mx-auto">
                <AnimatePresence mode="wait">
                    {!activeRole ? (
                        <motion.div 
                            key="selector"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full space-y-10"
                        >
                            <div className="text-center space-y-3 mb-12">
                                <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-foreground font-montserrat leading-tight">
                                    ¿Cómo vas a sumarte <br/><span className="text-primary underline decoration-foreground/20 underline-offset-8">a Estuclub?</span>
                                </h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60 italic">Elegí tu forma de participar en Alem</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {roles.map((role) => (
                                    <button
                                        key={role.id}
                                        onClick={() => setActiveRole(role.id)}
                                        className="group relative flex flex-col items-center justify-center p-8 rounded-[2.5rem] bg-card border border-border transition-all hover:bg-card/80 hover:border-primary/50 active:scale-95 overflow-hidden shadow-premium"
                                    >
                                        <div className={cn(
                                            "h-16 w-16 mb-4 rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110 duration-500",
                                            role.color
                                        )}>
                                            <span className="text-4xl">{role.icon}</span>
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-1">{role.title}</h3>
                                            <p className="text-[9px] font-bold text-foreground uppercase tracking-tighter opacity-80">{role.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="pt-10 text-center flex flex-col items-center gap-6">
                                <p className="text-[10px] font-black text-foreground/70 tracking-[0.2em] uppercase">
                                    ¿Ya sos parte del club?{' '}
                                    <Link href="/login" className="text-primary hover:text-foreground transition-colors underline-offset-4 decoration-1 underline">
                                        INGRESA ACÁ
                                    </Link>
                                </p>
                                <div className="flex items-center gap-2 opacity-40">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-foreground">Seguridad RSA Estuclub 2026</span>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="form-container"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full pb-10"
                        >
                            {/* Form Header */}
                            <div className="mb-8 flex flex-col items-center text-center space-y-4">
                                <div className={cn(
                                    "p-4 rounded-2xl flex items-center justify-center border border-border text-4xl",
                                    roles.find(r => r.id === activeRole)?.color
                                )}>
                                    {roles.find(r => r.id === activeRole)?.icon}
                                </div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground font-montserrat">
                                    Registro de <span className={cn(roles.find(r => r.id === activeRole)?.iconColor)}>{roles.find(r => r.id === activeRole)?.title}</span>
                                </h2>
                            </div>

                            {/* Render Dynamic Flow */}
                            {activeRole === 'user' && <UserSignupFlow />}
                            {activeRole === 'student' && <StudentSignupFlow />}
                            {activeRole === 'cluber' && <CluberSignupFlow />}
                            {activeRole === 'rider' && <RiderSignupFlow />}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
);
}

