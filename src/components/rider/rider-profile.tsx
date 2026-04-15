'use client';

import { useTheme } from 'next-themes';

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
    const { theme: activeTheme, setTheme } = useTheme();

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
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">Sincronización Perfil Pro</span>
                </div>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase text-zinc-900 font-montserrat">Identidad</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Credenciales Maestras EstuRider</p>
            </header>

            {/* Profile ID Card (Clean) */}
            <div className="relative group px-2">
                <Card className="relative bg-white border-zinc-200 rounded-[3rem] p-10 overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <QrCode className="h-32 w-32 text-zinc-900" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="h-32 w-32 rounded-[3.5rem] p-1.5 bg-gradient-to-br from-[#cb465a] to-[#8a2f3d] shadow-lg shadow-[#cb465a]/20">
                                <Avatar className="h-full w-full rounded-[3.2rem] border-4 border-white box-content overflow-hidden">
                                    <AvatarImage src={userData?.photoURL} className="object-cover" />
                                    <AvatarFallback className="bg-zinc-50 text-[#cb465a] font-black text-4xl uppercase">
                                        {userData?.firstName?.slice(0, 1)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-[#cb465a] rounded-2xl p-2.5 border-4 border-white shadow-xl">
                                <Verified className="h-5 w-5 text-white" />
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-4xl font-black italic uppercase tracking-tighter text-zinc-900 font-montserrat">
                                {userData?.firstName} {userData?.lastName}
                            </h3>
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#cb465a]">Rider Oficial Verificado</p>
                            </div>
                        </div>

                        <div className="w-full flex justify-between gap-4 pt-4 border-t border-zinc-100">
                            <div className="text-center flex-1">
                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1">Status</p>
                                <p className="text-sm font-black text-emerald-600 italic">ACTIVO</p>
                            </div>
                            <Separator orientation="vertical" className="h-8 bg-zinc-100" />
                            <div className="text-center flex-1">
                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1">Patente</p>
                                <p className="text-sm font-black text-zinc-900 italic tracking-tighter uppercase">{userData?.patente || 'S/N'}</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Stats Grids (Clean) */}
            <div className="grid grid-cols-3 gap-4 px-2">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={i} className="bg-white border-zinc-200 rounded-[2rem] p-5 flex flex-col items-center text-center space-y-3 hover:bg-zinc-50 transition-all shadow-md">
                            <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center border border-zinc-100", stat.bg)}>
                                <Icon className={cn("h-5 w-5", stat.color)} />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-lg font-black italic text-zinc-900 tracking-tighter">{stat.value}</p>
                                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{stat.label}</p>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Account Settings List (Clean) */}
            <div className="space-y-6 px-4">
                <div className="flex items-center gap-3">
                    <div className="h-1 w-8 bg-[#cb465a]/40 rounded-full" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cb465a]">Gestión de Cuenta</p>
                </div>
                
                <div className="space-y-3">
                    {[
                        { label: 'DNI Titular', icon: Fingerprint, value: userData?.dni },
                        { label: 'Maestro Email', icon: Mail, value: user?.email },
                        { label: 'Línea de Enlace', icon: Smartphone, value: userData?.phone },
                        { label: 'Vehículo Oficial', icon: Car, value: userData?.patente },
                        { label: 'Enlace de Pagos', icon: CreditCard, value: userData?.mp_linked ? 'VALIDADO' : 'REQUIERE ACCIÓN' },
                    ].map((item, i) => (
                        <Card key={i} className="bg-white border-zinc-200 rounded-[1.8rem] p-5 flex items-center justify-between group hover:bg-zinc-50 transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 group-hover:border-[#cb465a]/30 transition-colors">
                                    <item.icon className="h-4 w-4 text-zinc-400 group-hover:text-[#cb465a] transition-colors" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{item.label}</p>
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase truncate max-w-[150px]">{item.value || '-'}</p>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-zinc-200 group-hover:text-zinc-400 transition-colors" />
                        </Card>
                    ))}
                </div>
            </div>

            {/* Appearance Settings */}
            <div className="space-y-6 px-4">
                <div className="flex items-center gap-3">
                    <div className="h-1 w-8 bg-[#cb465a]/40 rounded-full" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cb465a]">Visualización</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button variant="outline" className={cn("h-14 rounded-xl font-bold active:scale-95 transition-all text-[10px] tracking-widest", activeTheme === 'light' ? 'border-[#cb465a] text-[#cb465a] bg-[#cb465a]/5' : 'border-zinc-200 bg-white hover:bg-zinc-50')} onClick={() => setTheme('light')}>CLARO</Button>
                    <Button variant="outline" className={cn("h-14 rounded-xl font-bold active:scale-95 transition-all text-[10px] tracking-widest", activeTheme === 'dark' ? 'border-[#cb465a] text-[#cb465a] bg-[#cb465a]/5' : 'border-zinc-200 bg-white hover:bg-zinc-50')} onClick={() => setTheme('dark')}>OSCURO</Button>
                    <Button variant="outline" className={cn("h-14 rounded-xl font-bold active:scale-95 transition-all text-[10px] tracking-widest", activeTheme === 'system' ? 'border-[#cb465a] text-[#cb465a] bg-[#cb465a]/5' : 'border-zinc-200 bg-white hover:bg-zinc-50')} onClick={() => setTheme('system')}>SISTEMA</Button>
                </div>
            </div>

            {/* Professional Actions (Large Buttons) */}
            <div className="px-4 pt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Button 
                        variant="ghost" 
                        className="h-20 rounded-[2.2rem] bg-white border border-zinc-200 text-zinc-900 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-zinc-50 active:scale-95 transition-all shadow-md"
                    >
                        <Settings className="mr-3 h-5 w-5 text-zinc-300" />
                        Seguridad
                    </Button>
                    <Button 
                        variant="ghost" 
                        className="h-20 rounded-[2.2rem] bg-white border border-zinc-200 text-zinc-900 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-zinc-50 active:scale-95 transition-all shadow-md"
                    >
                        <Zap className="mr-3 h-5 w-5 text-yellow-500" />
                        Soporte
                    </Button>
                </div>
                
                <Button 
                    variant="ghost" 
                    onClick={handleLogout}
                    className="w-full h-20 rounded-[2.5rem] bg-[#cb465a]/5 border-2 border-[#cb465a]/10 text-[#cb465a] font-black uppercase tracking-[0.3em] text-xs hover:bg-[#cb465a]/10 interactive-haptic shadow-xl active:scale-95 transition-all"
                >
                    <LogOut className="mr-4 h-6 w-6" />
                    Cerrar Sesión Pro
                </Button>
            </div>

            <div className="text-center py-10 opacity-30">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 font-mono">ESTUCLUB • LOGISTICS • v3.8.2-ULTIMATE</p>
            </div>
        </div>
    );
}
