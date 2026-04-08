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
    Star,
    QrCode,
    Camera,
    MapPin,
    Zap,
    Trophy,
    Verified,
    ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthService, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { haptic } from '@/lib/haptics';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export function RiderProfile() {
    const { userData, user } = useUser();
    const auth = useAuthService();

    const handleLogout = async () => {
        haptic.vibrateMedium();
        await signOut(auth);
    };

    const stats = [
        { label: 'Rating', value: userData?.avgRating ? userData.avgRating.toFixed(1) : '5.0', icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        { label: 'Puntos', value: userData?.points || 1250, icon: Fingerprint, color: 'text-[#cb465a]', bg: 'bg-[#cb465a]/10' },
        { label: 'Experto', value: 'NIVEL 4', icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    ];

    return (
        <div className="space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="space-y-2 px-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/60">Sincronización Perfil Pro</span>
                </div>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white font-montserrat">Identidad</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Credenciales Maestras EstuRider</p>
            </header>

            {/* Profile ID Card (Glassmorphism) */}
            <div className="relative group px-2">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#cb465a] to-[#8a2f3d] rounded-[3.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <Card className="relative bg-black/60 backdrop-blur-3xl border-white/10 rounded-[3rem] p-10 overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <QrCode className="h-32 w-32 text-white" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="h-32 w-32 rounded-[3.5rem] p-1.5 bg-gradient-to-br from-[#cb465a] to-[#8a2f3d] shadow-[0_20px_50px_rgba(203,70,90,0.3)] border border-white/20">
                                <Avatar className="h-full w-full rounded-[3.2rem] border-4 border-black box-content overflow-hidden">
                                    <AvatarImage src={userData?.photoURL} className="object-cover" />
                                    <AvatarFallback className="bg-black text-[#cb465a] font-black text-4xl uppercase">
                                        {userData?.firstName?.slice(0, 1)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-[#cb465a] rounded-2xl p-2.5 border-4 border-black shadow-xl">
                                <Verified className="h-5 w-5 text-white" />
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white font-montserrat">
                                {userData?.firstName} {userData?.lastName}
                            </h3>
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#cb465a]">Rider Oficial Verificado</p>
                            </div>
                        </div>

                        <div className="w-full flex justify-between gap-4 pt-4 border-t border-white/5">
                            <div className="text-center flex-1">
                                <p className="text-[8px] font-black uppercase tracking-widest text-foreground/30 mb-1">Status</p>
                                <p className="text-sm font-black text-emerald-400 italic">ACTIVO</p>
                            </div>
                            <Separator orientation="vertical" className="h-8 bg-white/5" />
                            <div className="text-center flex-1">
                                <p className="text-[8px] font-black uppercase tracking-widest text-foreground/30 mb-1">Patente</p>
                                <p className="text-sm font-black text-white italic tracking-tighter uppercase">{userData?.patente || 'S/N'}</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Stats Grids (Interactive) */}
            <div className="grid grid-cols-3 gap-4 px-2">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={i} className="bg-[#111111]/80 backdrop-blur-xl border-white/5 rounded-[2rem] p-5 flex flex-col items-center text-center space-y-3 hover:bg-white/[0.06] transition-all">
                            <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center border border-white/5", stat.bg)}>
                                <Icon className={cn("h-5 w-5", stat.color)} />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-lg font-black italic text-white tracking-tighter">{stat.value}</p>
                                <p className="text-[8px] font-black uppercase tracking-widest text-white/30">{stat.label}</p>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Account Settings List (Premium) */}
            <div className="space-y-6 px-4">
                <div className="flex items-center gap-3">
                    <div className="h-1 w-8 bg-[#cb465a]/40 rounded-full" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cb465a]/60">Gestión de Cuenta</p>
                </div>
                
                <div className="space-y-3">
                    {[
                        { label: 'DNI Titular', icon: Fingerprint, value: userData?.dni },
                        { label: 'Maestro Email', icon: Mail, value: user?.email },
                        { label: 'Línea de Enlace', icon: Smartphone, value: userData?.phone },
                        { label: 'Vehículo Oficial', icon: Car, value: userData?.patente },
                        { label: 'Enlace de Pagos', icon: CreditCard, value: userData?.mp_linked ? 'VALIDADO' : 'REQUIERE ACCIÓN' },
                    ].map((item, i) => (
                        <Card key={i} className="bg-[#111111]/80 backdrop-blur-xl border-white/5 rounded-[1.8rem] p-5 flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-[#cb465a]/30 transition-colors">
                                    <item.icon className="h-4 w-4 text-foreground/40 group-hover:text-[#cb465a] transition-colors" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{item.label}</p>
                                    <p className="text-[9px] font-bold text-foreground/30 uppercase truncate max-w-[150px]">{item.value || '-'}</p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-white/10 group-hover:text-white/40 transition-colors" />
                        </Card>
                    ))}
                </div>
            </div>

            {/* Professional Actions (Large Buttons) */}
            <div className="px-4 pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Button 
                        variant="ghost" 
                        className="h-20 rounded-[2.2rem] bg-white/[0.03] border border-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/5 active:scale-95 transition-all shadow-xl"
                    >
                        <Settings className="mr-3 h-5 w-5 text-white/30" />
                        Seguridad
                    </Button>
                    <Button 
                        variant="ghost" 
                        className="h-20 rounded-[2.2rem] bg-white/[0.03] border border-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/5 active:scale-95 transition-all shadow-xl"
                    >
                        <Zap className="mr-3 h-5 w-5 text-yellow-500/50" />
                        Soporte
                    </Button>
                </div>
                
                <Button 
                    variant="ghost" 
                    onClick={handleLogout}
                    className="w-full h-20 rounded-[2.5rem] bg-[#cb465a]/10 border-2 border-[#cb465a]/20 text-[#cb465a] font-black uppercase tracking-[0.3em] text-xs hover:bg-[#cb465a]/20 interactive-haptic shadow-2xl active:scale-95 transition-all"
                >
                    <LogOut className="mr-4 h-6 w-6" />
                    Cerrar Sesión Pro
                </Button>
            </div>

            <div className="text-center py-10 opacity-20">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white font-mono">ESTUCLUB • LOGISTICS • v3.8.2-ULTIMATE</p>
            </div>
        </div>
    );
}
