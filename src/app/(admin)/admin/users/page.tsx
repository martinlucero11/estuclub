'use client';

import React from 'react';
import UserManagement from '@/components/admin/UserManagement';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export default function AdminUsersPage() {
    return (
        <div className="space-y-10">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-emerald-500" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.3em] border-white/5 opacity-40">Base de Datos</Badge>
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tighter italic">Gestión de <span className="text-emerald-500 italic">Usuarios</span></h1>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Filtro de personas, auditoría de perfiles y simulación de sesión.</p>
            </div>

            <UserManagement />
        </div>
    );
}
