'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ShoppingBag, Map, User, CreditCard, Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function RiderLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navItems = [
        { href: '/rider', icon: Map, label: 'Mapa' },
        { href: '/rider/pedidos', icon: ShoppingBag, label: 'Pedidos' },
        { href: '/rider/wallet', icon: CreditCard, label: 'Billetera' },
        { href: '/rider/perfil', icon: User, label: 'Perfil' },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-slate-200 dark selection:bg-cyan-500/30">
            {/* Header Rider */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-cyan-500/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                        <Map className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-tighter text-cyan-400">RIDER MODE</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estuclub Logística</p>
                    </div>
                </div>
                <button className="h-10 w-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center relative">
                    <Bell className="h-5 w-5 text-slate-400" />
                    <span className="absolute top-0 right-0 h-3 w-3 bg-cyan-500 rounded-full border-2 border-black animate-pulse" />
                </button>
            </header>

            <main className="pt-24 pb-32 px-6">
                {children}
            </main>

            {/* Bottom Nav Rider */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-t border-cyan-500/10 pb-safe">
                <div className="grid h-20 grid-cols-4 px-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link 
                                key={item.href} 
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 transition-all duration-300",
                                    isActive ? "text-cyan-400" : "text-slate-500 opacity-60 hover:opacity-100"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-xl transition-all duration-500",
                                    isActive && "bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                                )}>
                                    <item.icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* Glow Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/5 blur-[120px] rounded-full" />
            </div>
        </div>
    );
}
