'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Ticket, Truck } from 'lucide-react';
import { haptic } from '@/lib/haptics';

export function ModeToggle() {
    const router = useRouter();
    const pathname = usePathname();
    
    // Determine current mode based on path
    const isDelivery = pathname.startsWith('/delivery');
    const isBenefits = pathname.startsWith('/benefits') || pathname === '/';

    const handleToggle = (mode: 'perks' | 'delivery') => {
        haptic.vibrateSubtle();
        if (mode === 'perks') {
            router.push('/');
        } else {
            router.push('/delivery');
        }
    };

    return (
        <div className="flex justify-center w-full mb-2 mt-2 sticky top-[100px] z-30">
            <div className="inline-flex p-1.5 bg-background/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden group">
                {/* Glossy highlight effect */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                
                <div className="flex items-center gap-1 relative z-10">
                    <button
                        onClick={() => handleToggle('perks')}
                        className={cn(
                            "relative flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-500",
                            isBenefits ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {isBenefits && (
                            <motion.div 
                                layoutId="mode-bg"
                                className="absolute inset-0 bg-primary rounded-2xl shadow-lg shadow-primary/30"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <Ticket className={cn("h-4 w-4 relative z-10", isBenefits ? "animate-pulse" : "opacity-50")} />
                        <span className="relative z-10">Beneficios</span>
                    </button>

                    <button
                        onClick={() => handleToggle('delivery')}
                        className={cn(
                            "relative flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-500",
                            isDelivery ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {isDelivery && (
                            <motion.div 
                                layoutId="mode-bg"
                                className="absolute inset-0 bg-primary rounded-2xl shadow-lg shadow-primary/30"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <Truck className={cn("h-4 w-4 relative z-10", isDelivery ? "animate-pulse" : "opacity-50")} />
                        <span className="relative z-10">Delivery</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
