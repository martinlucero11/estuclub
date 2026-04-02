'use client';

import React from 'react';
import CluberManagement from '@/components/admin/CluberManagement';
import { Badge } from '@/components/ui/badge';
import { Store } from 'lucide-react';

export default function AdminClubersPage() {
    return (
        <div className="space-y-10">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Store className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.3em] border-white/5 opacity-40">Operaciones</Badge>
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tighter italic">Gestión de <span className="text-primary italic">Clubers</span></h1>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Control de visibilidad, delivery y feature toggles por local.</p>
            </div>

            <CluberManagement />
        </div>
    );
}
