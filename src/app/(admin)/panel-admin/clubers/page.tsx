'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronRight, 
  Store, 
  ShieldAlert,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CluberManagement from '@/components/admin/CluberManagement';
import { useUser } from '@/firebase';

export default function CluberManagementPage() {
    const { isAdmin, isUserLoading } = useUser();

    if (isUserLoading) return null;

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
                <div className="space-y-6">
                    <ShieldAlert className="h-20 w-20 text-[#FF007F] mx-auto animate-pulse" />
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">ACCESS DENIED</h1>
                    <Button asChild className="bg-[#FF007F] text-white font-black rounded-xl">
                        <Link href="/">Back to Surface</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pb-32 selection:bg-[#FF007F]/30 font-inter">
            {/* Header Area */}
            <header className="pt-20 pb-16 px-6 md:px-12 bg-gradient-to-b from-[#FF007F]/20 to-transparent">
                <div className="max-w-7xl mx-auto space-y-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Button asChild variant="ghost" className="h-12 w-12 p-0 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-[#FF007F]/20 transition-all">
                                    <Link href="/panel-admin">
                                        <ArrowLeft className="h-6 w-6" />
                                    </Link>
                                </Button>
                                <div className="h-14 w-14 rounded-2xl bg-[#FF007F] flex items-center justify-center shadow-[0_0_30px_#FF007F]">
                                    <Store className="h-7 w-7 text-white" />
                                </div>
                                <Badge className="bg-white/10 text-white border-white/20 uppercase font-black text-[10px] tracking-[0.3em] px-4 py-1.5 rounded-full backdrop-blur-md">Estuclub HQ</Badge>
                            </div>
                            <h1 className="text-7xl md:text-[9rem] font-black text-white uppercase tracking-tighter italic leading-[0.8] font-montserrat drop-shadow-2xl">
                                GESTIÓN DE <br/><span className="text-[#FF007F]">CLUBERS</span>
                            </h1>
                            <p className="text-[11px] font-black text-white/50 uppercase tracking-[0.6em] ml-3 opacity-60 italic">ZONA DE CONTROL DE COMERCIOS Y PERMISOS ESPECIALES</p>
                        </div>

                        <div className="flex items-center gap-6 bg-white/5 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 shadow-2xl">
                            <div className="text-right space-y-1">
                                <p className="text-[11px] font-black text-[#FF007F] uppercase tracking-widest">Master Protocol</p>
                                <p className="text-xl font-black text-white italic tracking-tight font-montserrat uppercase">Status: <span className="text-emerald-400">Locked In</span></p>
                            </div>
                            <div className="h-16 w-16 rounded-[1.5rem] border-2 border-[#FF007F]/40 p-1 bg-black/40">
                                <div className="h-full w-full rounded-[1rem] bg-[#FF007F]/20 flex items-center justify-center animate-pulse">
                                    <Zap className="h-7 w-7 text-[#FF007F]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 md:px-12">
                <CluberManagement />
            </main>
        </div>
    );
}
