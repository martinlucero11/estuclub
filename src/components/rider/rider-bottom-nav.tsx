'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Map as MapIcon, 
    BarChart3, 
    User, 
    History 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface RiderBottomNavProps {
    currentTab: 'map' | 'earnings' | 'profile' | 'history';
    onTabChange: (tab: 'map' | 'earnings' | 'profile' | 'history') => void;
}

export function RiderBottomNav({ currentTab, onTabChange }: RiderBottomNavProps) {
    const navItems = [
        { id: 'map', label: 'Mapa', icon: MapIcon },
        { id: 'earnings', label: 'Ganancias', icon: BarChart3 },
        { id: 'history', label: 'Historial', icon: History },
        { id: 'profile', label: 'Perfil', icon: User },
    ] as const;

    return (
        <div className="fixed bottom-8 left-8 right-8 z-50 pointer-events-none">
            <div className="max-w-md mx-auto pointer-events-auto">
                <nav className="flex items-center justify-around bg-black/90 backdrop-blur-3xl border border-white/20 rounded-[2.2rem] p-2 shadow-[0_25px_70px_rgba(0,0,0,0.8)] relative overflow-hidden">
                    {/* Interior glow for depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
                    
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    if (!isActive) {
                                        haptic.vibrateSubtle();
                                        onTabChange(item.id);
                                    }
                                }}
                                className={cn(
                                    "relative flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-300 group",
                                    isActive ? "text-white" : "text-white/30 hover:text-white/60"
                                )}
                            >
                                <div className={cn(
                                    "relative z-10 transition-all duration-300",
                                    isActive ? "scale-110" : "group-active:scale-90"
                                )}>
                                    <Icon className={cn(
                                        "h-6 w-6 transition-all duration-300",
                                        isActive ? "text-white stroke-[2.5px] drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" : "stroke-[1.5px]"
                                    )} />
                                </div>
                                
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                                    isActive ? "opacity-100 translate-y-0" : "opacity-30 translate-y-0"
                                )}>
                                    {item.label}
                                </span>

                                {isActive && (
                                    <motion.div 
                                        layoutId="bottom-nav-prestige-active"
                                        className="absolute inset-x-1 inset-y-1 bg-white/10 rounded-2xl -z-0 border border-white/5"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
