'use client';

import { cn } from '@/lib/utils';
import { Truck, Gift, CalendarClock } from 'lucide-react';
import { motion } from 'framer-motion';

export type HomeBoardType = 'perks' | 'delivery' | 'turns';

interface HomeBoardSelectorProps {
    activeBoard: HomeBoardType;
    onChange: (board: HomeBoardType) => void;
    isStudent?: boolean;
}

export default function HomeBoardSelector({ activeBoard, onChange, isStudent }: HomeBoardSelectorProps) {
    const tabs = [
        { id: 'perks', label: 'Beneficios', icon: Gift, show: isStudent },
        { id: 'delivery', label: 'Delivery', icon: Truck, show: true },
        { id: 'turns', label: 'Turnos', icon: CalendarClock, show: true },
    ].filter(tab => tab.show);

    const activeIndex = tabs.findIndex(tab => tab.id === activeBoard);
    const tabWidth = 100 / tabs.length;

    return (
        <div className="flex justify-center mb-0 px-2 max-w-lg mx-auto">
            <div className="relative flex p-1.5 bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-[2.2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full">
                {/* Background Slider */}
                {activeIndex !== -1 && (
                    <motion.div
                        className="absolute inset-y-1.5 rounded-[1.75rem] bg-white shadow-[0_10px_25px_rgba(0,0,0,0.1)] border border-black/5"
                        layoutId="board-selector-bg"
                        initial={false}
                        animate={{
                            left: `${activeIndex * tabWidth}%`,
                            width: `${tabWidth}%`
                        }}
                        transition={{ type: "spring", stiffness: 350, damping: 35 }}
                    />
                )}

                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id as HomeBoardType)}
                        className={cn(
                            "relative flex-1 flex flex-col items-center justify-center gap-1.5 py-4 text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-500 z-10",
                            activeBoard === tab.id ? "text-primary" : "text-black/30 hover:text-black/50"
                        )}
                    >
                        <tab.icon className={cn("h-4 w-4 transition-transform duration-500", activeBoard === tab.id ? "scale-110" : "scale-100")} />
                        <span className="leading-none">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
