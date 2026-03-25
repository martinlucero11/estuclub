'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AvatarOnboarding() {
    const { user, userData: userProfile, isUserLoading: loading } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    // Seeds aleatorias facheritas para Micah
    const showcaseSeeds = ['Felix', 'Aneka', 'Charlie'];

    useEffect(() => {
        const isProfilePath = window.location.pathname === '/profile';
        if (!loading && user && userProfile && !userProfile.avatarSeed && !isProfilePath) {
            const timer = setTimeout(() => setIsOpen(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [user, userProfile, loading]);

    const handleCustomize = () => {
        setIsOpen(false);
        router.push('/profile?customize=true');
    };

    return (
        <AnimatePresence>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[440px] border-0 bg-transparent p-0 shadow-none outline-none">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 40 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="relative group bg-background/80 backdrop-blur-2xl border-4 border-white/50 rounded-[3.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]"
                    >
                        {/* Mesh Gradient Background Effect */}
                        <div className="absolute inset-0 -z-10 overflow-hidden opacity-50">
                            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/30 blur-[100px] rounded-full animate-pulse" />
                            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/30 blur-[100px] rounded-full animate-pulse delay-700" />
                        </div>

                        {/* Header Visual */}
                        <div className="relative h-56 flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent opacity-90" />
                            
                            {/* Animated Background Icons */}
                            <motion.div 
                                animate={{ 
                                    rotate: [0, 360],
                                    scale: [1, 1.2, 1]
                                }}
                                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center"
                            >
                                <Sparkles className="h-64 w-64 text-white" />
                            </motion.div>

                            <div className="relative z-10 text-center text-white p-6">
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="mb-4 inline-flex items-center justify-center h-20 w-20 bg-white/20 backdrop-blur-xl rounded-[2rem] border-2 border-white/30 shadow-2xl"
                                >
                                    <User className="h-10 w-10 text-white drop-shadow-lg" />
                                </motion.div>
                                <motion.h2 
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-4xl font-black uppercase tracking-tighter leading-none"
                                >
                                    Crea tu <br/>
                                    <span className="text-white/80">Estu</span>
                                </motion.h2>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-8 pt-6 space-y-8 text-center bg-white/40 dark:bg-black/20">
                            <div className="space-y-3">
                                <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                                    ¡Hola, {userProfile?.firstName}! 👋
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground font-medium text-sm leading-relaxed px-2">
                                    Queremos que seas vos mismo en el Club. Personalizá tu personaje y hacelo tan <span className="text-primary font-bold">fachero</span> como vos.
                                </DialogDescription>
                            </div>

                            {/* Showcase de Avatares Seguros (Sin Turbantes) */}
                            <div className="flex justify-center -space-x-4 py-2">
                                {[
                                    { seed: 'Felix', hair: 'dannyPhantom' },
                                    { seed: 'Aneka', hair: 'full' },
                                    { seed: 'Charlie', hair: 'fonze' }
                                ].map((item, i) => (
                                    <motion.div
                                        key={item.seed}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.4 + (i * 0.1), type: "spring" }}
                                        className="relative h-20 w-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white/80 hover:z-20 hover:scale-110 transition-transform cursor-pointer"
                                    >
                                        <img 
                                            src={`https://api.dicebear.com/9.x/micah/svg?seed=${item.seed}&hair=${item.hair}&baseColor=ffd1b1&hatProbability=0`} 
                                            alt="Preview"
                                            className="w-full h-full object-contain"
                                        />
                                    </motion.div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <Button 
                                    onClick={handleCustomize}
                                    className="w-full h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase tracking-[0.2em] text-xs shadow-[0_12px_24px_-8px_rgba(var(--primary),0.5)] hover:shadow-[0_16px_32px_-8px_rgba(var(--primary),0.6)] hover:scale-[1.03] active:scale-[0.98] transition-all group"
                                >
                                    <Sparkles className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                                    Personalizar ahora
                                    <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </Button>

                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-primary transition-colors py-2"
                                >
                                    Quizás más tarde
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </DialogContent>
            </Dialog>
        </AnimatePresence>
    );
}
