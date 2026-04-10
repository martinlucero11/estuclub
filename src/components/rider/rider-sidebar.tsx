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
                        className="fixed top-0 left-0 bottom-0 w-[280px] bg-white border-r border-zinc-200 shadow-2xl z-[101] flex flex-col pt-20 pb-10"
                    >
                        {/* Header decor */}
                        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#cb465a]/5 to-transparent pointer-events-none" />
                        
                        <div className="px-6 mb-10 relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-medium italic tracking-tighter text-zinc-900 font-montserrat flex items-baseline">
                                    Estu<span className="text-[#cb465a] font-lobster text-3xl ml-1 tracking-normal italic-none">Rider</span>
                                </h2>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={onClose}
                                    className="h-8 w-8 rounded-full border border-zinc-100 hover:bg-zinc-50 text-zinc-400"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 italic">Hola, {userName}</p>
                        </div>

                        {/* Navigation (Secondary / Backups) */}
                        <nav className="flex-1 px-4 space-y-2 relative z-10">
                            <button
                                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-zinc-500 hover:text-[#cb465a] hover:bg-zinc-50 transition-all"
                            >
                                <Settings className="h-5 w-5" />
                                <span className="text-xs font-black uppercase tracking-widest">Configuración</span>
                            </button>
                            <button
                                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-zinc-500 hover:text-[#cb465a] hover:bg-zinc-50 transition-all"
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
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 shadow-lg shadow-emerald-500/10" 
                                        : "bg-zinc-50 border-zinc-100 text-zinc-400"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-2 w-2 rounded-full",
                                        isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-200"
                                    )} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {isOnline ? "EN SERVICIO" : "FUERA DE LÍNEA"}
                                    </span>
                                </div>
                                {isOnline ? <Zap className="h-4 w-4 fill-emerald-500 text-emerald-500" /> : <ZapOff className="h-4 w-4" />}
                            </button>

                            <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-50 text-red-600 transition-colors">
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
