'use client';
export const dynamic = 'force-dynamic';

import React from 'react';
import RiderManagement from '@/components/admin/RiderManagement';
import { Badge } from '@/components/ui/badge';
import { Truck } from 'lucide-react';

export default function AdminRidersPage() {
    return (
        <div className="space-y-10">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Truck className="h-5 w-5 text-blue-500" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.3em] border-white/5 opacity-40">Logística</Badge>
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tighter italic">Gestión de <span className="text-blue-500 italic">Riders</span></h1>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Onboarding, verificación de flota y monitoreo de actividad.</p>
            </div>

            <RiderManagement />
        </div>
    );
}


