'use client';

import { cn } from '@/lib/utils';
import { Truck, Gift, CalendarClock } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/haptics';

export type HomeBoardType = 'benefits' | 'delivery' | 'turns';

interface HomeBoardSelectorProps {
    activeBoard: HomeBoardType;
    onChange: (board: HomeBoardType) => void;
    isStudent?: boolean;
    isEmbedded?: boolean;
}

export default function HomeBoardSelector({ activeBoard, onChange, isStudent, isEmbedded }: HomeBoardSelectorProps) {
    const tabs = [
        { id: 'benefits', label: 'BENEFICIOS', icon: Gift, show: isStudent },
        { id: 'delivery', label: 'DELIVERY', icon: Truck, show: true },
        { id: 'turns', label: 'TURNOS', icon: CalendarClock, show: true },
    ].filter(tab => tab.show);

    const activeIndex = tabs.findIndex(tab => tab.id === activeBoard);

    const content = (
        <div className={cn(
            "relative flex items-center p-1 bg-white/20 dark:bg-black/20 backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-full shadow-xl pointer-events-auto w-full",
            !isEmbedded && "max-w-[400px]"
        )}>
            {/* Active Pill Indicator */}
            {activeIndex !== -1 && (
                <motion.div
                    className="absolute inset-y-1 rounded-full bg-primary shadow-lg shadow-primary/20"
                    layoutId="board-selector-pill"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{
                        left: `calc(4px + ${activeIndex * (100 / tabs.length)}%)`,
                        width: `calc(${100 / tabs.length}% - 8px)`
                    }}
                />
            )}

            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => {
                        if (activeBoard !== tab.id) {
                            haptic.vibrateImpact();
                            onChange(tab.id as HomeBoardType);
                        }
                    }}
                    className={cn(
                        "relative flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-all duration-300 z-10",
                        activeBoard === tab.id ? "text-white" : "text-black dark:text-white hover:text-black/70 dark:hover:text-white/70"
                    )}
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] font-montserrat whitespace-nowrap px-1">
                        {tab.label}
                    </span>
                </button>
            ))}
        </div>
    );

    if (isEmbedded) return content;

    return (
        <div className="fixed top-[88px] left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
            <div className="w-full max-w-[400px]">
                {content}
            </div>
        </div>
    );
}
