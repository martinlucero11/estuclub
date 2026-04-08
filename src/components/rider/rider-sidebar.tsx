'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Map as MapIcon, 
    BarChart3, 
    User, 
    LogOut, 
    X,
    Settings,
    History,
    Zap,
    ZapOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';

interface RiderSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    currentView: 'map' | 'earnings' | 'profile' | 'history';
    onViewChange: (view: 'map' | 'earnings' | 'profile' | 'history') => void;
    isOnline: boolean;
    onToggleOnline: () => void;
    userName?: string;
}

export function RiderSidebar({ 
    isOpen, 
    onClose, 
    currentView, 
    onViewChange, 
    isOnline, 
    onToggleOnline,
    userName = 'Rider'
}: RiderSidebarProps) {
    
    const menuItems = [
        { id: 'map', label: 'Mapa Radar', icon: MapIcon },
        { id: 'earnings', label: 'Ganancias', icon: BarChart3 },
        { id: 'history', label: 'Historial', icon: History },
        { id: 'profile', label: 'Mi Perfil', icon: User },
    ] as const;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-[280px] bg-black border-r border-[#cb465a]/20 z-[101] flex flex-col pt-20 pb-10"
                    >
                        {/* Header decor */}
                        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#cb465a]/10 to-transparent pointer-events-none" />
                        
                        <div className="px-6 mb-10 relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-medium italic tracking-tighter text-white font-montserrat flex items-baseline">
                                    Estu<span className="text-[#cb465a] font-lobster text-3xl ml-1 tracking-normal italic-none">Rider</span>
                                </h2>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={onClose}
                                    className="h-8 w-8 rounded-full border border-white/10 hover:bg-white/5 text-white"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Hola, {userName}</p>
                        </div>

                        {/* Navigation (Secondary / Backups) */}
                        <nav className="flex-1 px-4 space-y-2 relative z-10">
                            <button
                                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
                            >
                                <Settings className="h-5 w-5" />
                                <span className="text-xs font-black uppercase tracking-widest">Configuración</span>
                            </button>
                            <button
                                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
                            >
                                <History className="h-5 w-5" />
                                <span className="text-xs font-black uppercase tracking-widest">Historial Extendido</span>
                            </button>
                        </nav>

                        {/* Footer / Status */}
                        <div className="px-4 mt-auto space-y-4">
                            <button
                                onClick={() => {
                                    haptic.vibrateMedium();
                                    onToggleOnline();
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between p-5 rounded-[2rem] border transition-all duration-500",
                                    isOnline 
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]" 
                                        : "bg-white/5 border-white/10 text-white/40"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-2 w-2 rounded-full animate-pulse",
                                        isOnline ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-white/20"
                                    )} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {isOnline ? "EN SERVICIO" : "FUERA DE LÍNEA"}
                                    </span>
                                </div>
                                {isOnline ? <Zap className="h-4 w-4 fill-emerald-400" /> : <ZapOff className="h-4 w-4" />}
                            </button>

                            <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors">
                                <LogOut className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Cerrar Sesión</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
