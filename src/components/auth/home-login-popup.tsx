'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/firebase';
import LoginForm from '@/components/auth/login-form';
import Link from 'next/link';
import { Bike, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomeLoginPopup() {
    const { user, isUserLoading } = useUser();

    // Only show if we explicitly know there's no user.
    if (isUserLoading || user) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl p-4 sm:p-6 overflow-y-auto"
            >
                {/* Background Blobs */}
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full point-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full point-events-none" />

                <div className="relative z-10 w-full max-w-md w-full my-auto py-8">
                    <header className="mb-8 text-center space-y-3">
                        <div
                            className="h-[48px] w-[160px] bg-primary [mask-image:url(/logo.svg)] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center] mx-auto opacity-90"
                            aria-label="EstuClub Logo"
                        />
                        <h1 className="text-2xl font-black tracking-tighter uppercase text-foreground">
                            Ingresá a tu cuenta
                        </h1>
                        <p className="text-[10px] font-bold text-foreground uppercase tracking-[0.2em]">
                            Disfrutá de todos los beneficios
                        </p>
                    </header>

                    <LoginForm />

                    <div className="mt-6 text-center">
                        <p className="text-xs font-bold text-foreground">
                            ¿No tenés cuenta?{' '}
                            <Link href="/signup" className="font-black text-primary hover:text-primary/80 uppercase tracking-widest text-[10px] ml-1 transition-colors">
                                Registrate ACÁ
                            </Link>
                        </p>
                    </div>

                    <div className="mt-10 pt-8 flex gap-3 border-t border-foreground/50">
                        <Button asChild variant="outline" className="flex-1 h-14 rounded-2xl border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-500 transition-all group">
                            <Link href="/rider">
                                <Bike className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                                <div className="text-left flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Soy Rider</span>
                                    <span className="text-[8px] font-bold opacity-70">Logística</span>
                                </div>
                            </Link>
                        </Button>

                        <Button asChild variant="outline" className="flex-1 h-14 rounded-2xl border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500 transition-all group">
                            <Link href="/cluber">
                                <Store className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                                <div className="text-left flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Soy Cluber</span>
                                    <span className="text-[8px] font-bold opacity-70">Comercios</span>
                                </div>
                            </Link>
                        </Button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

