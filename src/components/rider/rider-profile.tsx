'use client';

import React from 'react';
import { 
    User, 
    Mail, 
    Smartphone, 
    CreditCard, 
    ShieldCheck, 
    Settings, 
    LogOut,
    Car,
    Fingerprint,
    BadgeCheck,
    Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthService, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { haptic } from '@/lib/haptics';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function RiderProfile() {
    const { userData, user } = useUser();
    const auth = useAuthService();

    const handleLogout = async () => {
        haptic.vibrateMedium();
        await signOut(auth);
    };

    const stats = [
        { label: 'Rating', value: '4.8', icon: Star, color: 'text-orange-400' },
        { label: 'Puntos', value: userData?.points || 0, icon: Fingerprint, color: 'text-[#cb465a]' },
        { label: 'Nivel', value: 'Pro', icon: BadgeCheck, color: 'text-emerald-400' },
    ];

    return (
        <div className="space-y-8 pb-32">
            <header className="space-y-1 px-2">
                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white font-montserrat">Perfil</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Identidad Digital Rider</p>
            </header>

            {/* Profile Header */}
            <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] p-8 overflow-hidden relative">
                <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-[#cb465a]/5 blur-[60px] rounded-full" />
                <CardContent className="p-0 flex flex-col items-center space-y-4 relative z-10">
                    <div className="relative">
                        <Avatar className="h-24 w-24 rounded-[2rem] border-2 border-[#cb465a]/20 shadow-2xl">
                            <AvatarImage src={userData?.photoURL} />
                            <AvatarFallback className="bg-[#cb465a]/10 text-[#cb465a] font-black text-2xl uppercase">
                                {userData?.firstName?.slice(0, 1)}{userData?.lastName?.slice(0, 1)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-2 border-4 border-black box-content">
                            <ShieldCheck className="h-4 w-4 text-white" />
                        </div>
                    </div>
                    <div className="text-center space-y-1">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                            {userData?.firstName} {userData?.lastName}
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#cb465a]">Miembro Verificado</p>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={i} className="bg-white/[0.02] border-white/5 rounded-3xl p-4 flex flex-col items-center text-center space-y-2">
                            <Icon className={cn("h-4 w-4", stat.color)} />
                            <div className="space-y-0.5">
                                <p className="text-sm font-black italic text-white tracking-tighter">{stat.value}</p>
                                <p className="text-[8px] font-black uppercase tracking-widest text-white/40">{stat.label}</p>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Account Settings */}
            <div className="space-y-3">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#cb465a] px-4">Cuenta & Seguridad</p>
                <div className="space-y-2">
                    {[
                        { label: 'Información Personal', icon: User, value: userData?.dni },
                        { label: 'Email', icon: Mail, value: user?.email },
                        { label: 'Teléfono', icon: Smartphone, value: userData?.phone },
                        { label: 'Vehículo / Patente', icon: Car, value: userData?.patente },
                        { label: 'Mercado Pago', icon: CreditCard, value: userData?.mp_linked ? 'Vinculado' : 'Sin Vincular' },
                    ].map((item, i) => (
                        <Card key={i} className="bg-white/[0.02] border-white/5 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                                    <item.icon className="h-4 w-4 text-white/40" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{item.label}</p>
                            </div>
                            <p className="text-[10px] font-bold text-white/40 truncate max-w-[120px]">{item.value || '-'}</p>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="pt-4 space-y-4">
                <Button 
                    variant="ghost" 
                    className="w-full h-16 rounded-[2rem] bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/10"
                >
                    <Settings className="mr-3 h-5 w-5 text-white/40" />
                    Ajustes Avanzados
                </Button>
                <Button 
                    variant="ghost" 
                    onClick={handleLogout}
                    className="w-full h-16 rounded-[2rem] bg-[#cb465a]/10 border border-[#cb465a]/20 text-[#cb465a] font-black uppercase tracking-widest hover:bg-[#cb465a]/20"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Cerrar Sesión Maestro
                </Button>
            </div>

            <div className="text-center py-8">
                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/10">Estuclub Rider v3.0.0-PRO-BUILD</p>
            </div>
        </div>
    );
}

// Helper to avoid TS error in file_write if not imported
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
