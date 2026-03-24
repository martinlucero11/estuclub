'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { Icon } from '@phosphor-icons/react';
import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: Icon;
    href?: string;
    description?: string;
    trend?: string | number;
    trendDirection?: 'up' | 'down' | 'neutral';
    noGlass?: boolean;
    onClick?: () => void;
}

export function StatCard({ title, value, icon: Icon, href, description, trend, trendDirection = 'neutral', noGlass, onClick }: StatCardProps) {
    const isUp = trendDirection === 'up';
    const isDown = trendDirection === 'down';

    const CardWrapper = href ? Link : 'div';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="h-full"
        >
            <Card 
                onClick={onClick}
                className={cn(
                    "group relative overflow-hidden h-full transition-all duration-700",
                    !noGlass 
                        ? "border-black/20 dark:border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur-2xl shadow-xl hover:shadow-primary/40 hover:border-primary/60" 
                        : "bg-transparent border-none shadow-none",
                    (href || onClick) && "cursor-pointer active:scale-95"
                )}
            >
                {/* Advanced Light/Dark Glow Effects */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-40 w-40 rounded-full bg-primary/20 blur-[100px] transition-all duration-700 group-hover:bg-primary/40 group-hover:scale-150" />
                <div className="absolute bottom-0 left-0 -ml-12 -mb-12 h-24 w-24 rounded-full bg-primary/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Visual Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                    <CardTitle className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground/80 dark:text-white/70 group-hover:text-primary dark:group-hover:text-white transition-all duration-500">
                        {title}
                    </CardTitle>
                    <div className="p-3.5 rounded-[1.5rem] bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 group-hover:bg-primary group-hover:border-primary/50 group-hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.4)] transition-all duration-500">
                        <Icon className="h-4.5 w-4.5 text-foreground/60 dark:text-white group-hover:text-white transition-colors duration-500" weight="duotone" />
                    </div>
                </CardHeader>

                <CardContent className="pt-2 relative z-10">
                    <div className="flex items-baseline gap-4">
                        <div className="text-5xl font-black tracking-tighter text-foreground dark:text-white drop-shadow-sm dark:drop-shadow-[0_2px_15px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-105 origin-left">
                            {value}
                        </div>
                        {trend && (
                            <div className={cn(
                                "flex items-center text-[11px] font-black px-3 py-1.5 rounded-2xl border-2 backdrop-blur-md shadow-sm transition-all duration-500 group-hover:scale-110",
                                isUp ? "text-green-700 dark:text-green-400 bg-green-500/10 border-green-500/20 shadow-green-500/5" : 
                                isDown ? "text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/20 shadow-red-500/5" : 
                                "text-foreground dark:text-white bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
                            )}>
                                {isUp && <ArrowUpRight className="h-3 w-3 mr-1" />}
                                {isDown && <ArrowDownRight className="h-3 w-3 mr-1" />}
                                {!isUp && !isDown && <TrendingUp className="h-3 w-3 mr-1" />}
                                {trend}
                            </div>
                        )}
                    </div>
                    
                    {description && (
                        <div className="mt-5 space-y-2">
                            <p className="text-[10px] text-foreground/70 dark:text-white/50 font-black uppercase tracking-[0.2em] leading-relaxed group-hover:text-primary dark:group-hover:text-white transition-colors duration-500">
                                {description}
                            </p>
                            <div className="h-[1px] w-full bg-gradient-to-r from-primary/30 via-transparent to-transparent" />
                        </div>
                    )}

                    {/* Interaction Indicator */}
                    {onClick && (
                        <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="h-1 w-1 rounded-full bg-primary animate-ping" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-primary">Ver Detalle Completo</span>
                        </div>
                    )}
                </CardContent>

                {href && (
                    <div className="absolute bottom-4 right-5 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-X-2 group-hover:translate-X-0">
                        <ArrowUpRight className="h-5 w-5 text-primary" />
                    </div>
                )}
            </Card>
        </motion.div>
    );
}