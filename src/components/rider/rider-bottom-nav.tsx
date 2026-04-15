'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Map as MapIcon, 
    BarChart3, 
    User, 
    Star,
    History 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface RiderBottomNavProps {
    currentTab: 'map' | 'earnings' | 'profile' | 'history' | 'rating';
    onTabChange: (tab: 'map' | 'earnings' | 'profile' | 'history' | 'rating') => void;
}

export function RiderBottomNav({ currentTab, onTabChange }: RiderBottomNavProps) {
    const navItems = [
        { id: 'map', label: 'Radar', icon: MapIcon },
        { id: 'earnings', label: 'Efectivo', icon: BarChart3 },
        { id: 'history', label: 'Recientes', icon: History },
        { id: 'rating', label: 'Rating', icon: Star },
        { id: 'profile', label: 'Cuenta', icon: User },
    ] as const;

    return (
        <div className="fixed bottom-10 left-8 right-8 z-50 pointer-events-none">
            <div className="max-w-md mx-auto pointer-events-auto">
                <nav className="flex items-center justify-around bg-white/80 backdrop-blur-3xl border border-zinc-200 rounded-[2.5rem] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden">
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
                                    "relative flex-1 flex flex-col items-center gap-1.5 py-4 rounded-2xl transition-all duration-300 group",
                                    isActive ? "text-[#cb465a]" : "text-zinc-400 hover:text-zinc-600"
                                )}
                            >
                                <div className={cn(
                                    "relative z-10 transition-all duration-300",
                                    isActive ? "scale-110" : "group-active:scale-90"
                                )}>
                                    <Icon className={cn(
                                        "h-6 w-6 transition-all duration-300",
                                        isActive ? "text-[#cb465a] stroke-[2.5px]" : "stroke-[1.5px]"
                                    )} />
                                </div>
                                
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-tight transition-all duration-300 whitespace-nowrap",
                                    isActive ? "opacity-100" : "opacity-60 hidden sm:block"
                                )}>
                                    {isActive ? item.label : <span className="opacity-0 hidden">{item.label}</span>}
                                </span>

                                {isActive && (
                                    <motion.div 
                                        layoutId="bottom-nav-clean-active"
                                        className="absolute inset-x-2 inset-y-2 bg-[#cb465a]/5 rounded-2xl -z-0"
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
