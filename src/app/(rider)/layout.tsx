'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ShoppingBag, Map, User, CreditCard, Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import Image from 'next/image';

export default function RiderLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navItems = [
        { href: '/rider', icon: Map, label: 'Mapa' },
        { href: '/rider/pedidos', icon: ShoppingBag, label: 'Pedidos' },
        { href: '/rider/wallet', icon: CreditCard, label: 'Billetera' },
        { href: '/rider/perfil', icon: User, label: 'Perfil' },
    ];

    return (
        <div className="min-h-screen bg-[#000000] text-slate-200 rider-night selection:bg-[#FF007F]/30 font-inter">
            {/* ✨ STUNNING RIDER HEADER ✨ */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-3xl border-b border-[#FF007F]/20 px-6 py-5 flex items-center justify-between shadow-[0_4px_30px_rgba(255,0,127,0.1)]">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-[#FF007F] blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                            <Image 
                                src="/logo.svg" 
                                alt="EstuClub Logo" 
                                width={120} 
                                height={30} 
                                priority
                                className="h-7 sm:h-9 brightness-125 contrast-125 relative z-10"
                            />
                        </div>
                    </Link>
                    <div className="h-6 w-[1px] bg-white/10 mx-2" />
                    <div className="flex flex-col">
                        <h1 className="text-sm font-black uppercase tracking-tighter text-[#FF007F] font-montserrat italic italic-shadow">RIDER MODE</h1>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.4em] leading-none">Flota Oficial</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Admin Status Indicator */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF007F]/5 border border-[#FF007F]/20">
                        <div className="h-2 w-2 rounded-full bg-[#FF007F] animate-pulse shadow-[0_0_8px_#FF007F]" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#FF007F]">STATUS: EN VIVO</span>
                    </div>
                    <button className="h-11 w-11 rounded-2xl bg-slate-900 border border-[#FF007F]/30 flex items-center justify-center relative shadow-lg hover:bg-[#FF007F]/10 transition-all active:scale-90 group">
                        <Bell className="h-5 w-5 text-[#FF007F] group-hover:scale-110 transition-transform" />
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#FF007F] text-[8px] font-black text-white rounded-full border-2 border-black flex items-center justify-center animate-bounce">2</span>
                    </button>
                </div>
            </header>

            <main className="pt-28 pb-32 px-6 max-w-lg mx-auto">
                {children}
            </main>

            {/* Bottom Nav Rider */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-3xl border-t border-[#FF007F]/10 pb-safe">
                <div className="grid h-20 grid-cols-4 px-4 max-w-lg mx-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link 
                                key={item.href} 
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 transition-all duration-300",
                                    isActive ? "text-[#FF007F]" : "text-slate-500 opacity-60 hover:opacity-100"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-xl transition-all duration-500",
                                    isActive && "bg-[#FF007F]/10 shadow-[0_0_20px_rgba(255,0,127,0.15)]"
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
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FF007F]/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF007F]/5 blur-[120px] rounded-full" />
            </div>
        </div>
    );
}
