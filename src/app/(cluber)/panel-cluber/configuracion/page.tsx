'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useAuthService } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
    Settings, Moon, Sun, Bell, Building, Phone, 
    MapPin, Save, LogOut, CreditCard, ExternalLink, 
    ShieldCheck 
} from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { signOut } from 'firebase/auth';
import SplashScreen from '@/components/layout/splash-screen';
import { cn } from '@/lib/utils';

export default function CluberConfiguracionPage() {
    const { user, userData, supplierData, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuthService();
    const { toast } = useToast();
    
    const [isSaving, setIsSaving] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>(userData?.theme || 'dark');
    const [notifications, setNotifications] = useState(userData?.notificationsEnabled ?? true);
    
    // Store profile state
    const [storeName, setStoreName] = useState(supplierData?.name || supplierData?.storeName || '');
    const [storePhone, setStorePhone] = useState(supplierData?.phone || userData?.phone || '');
    const [storeAddress, setStoreAddress] = useState(supplierData?.address || userData?.address || '');

    useEffect(() => {
        if (userData) {
            setTheme(userData.theme || 'dark');
            setNotifications(userData.notificationsEnabled ?? true);
        }
        if (supplierData) {
            setStoreName(supplierData.name || supplierData.storeName || '');
            setStorePhone(supplierData.phone || userData?.phone || '');
            setStoreAddress(supplierData.address || userData?.address || '');
        }
    }, [userData, supplierData]);

    const handleSave = async () => {
        if (!user || !firestore) return;
        haptic.vibrateSubtle();
        setIsSaving(true);
        
        try {
            // Update User Profile (Theme, Notifications)
            await updateDoc(doc(firestore, 'users', user.uid), {
                theme,
                notificationsEnabled: notifications,
                updatedAt: serverTimestamp()
            });

            // Update Supplier Profile (Store info)
            if (supplierData) {
                await updateDoc(doc(firestore, 'roles_supplier', user.uid), {
                    name: storeName,
                    storeName: storeName,
                    phone: storePhone,
                    address: storeAddress,
                    updatedAt: serverTimestamp()
                });
            }

            toast({ title: "✅ CONFIGURACIÓN GUARDADA", description: "Tus preferencias han sido actualizadas." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error al guardar", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleMPLink = async () => {
        if (!user) return;
        haptic.vibrateSubtle();
        setIsLinking(true);
        
        try {
            // 1. Create secure state using the API
            const stateRes = await fetch('/api/mp/create-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid })
            });
            
            const data = await stateRes.json();
            if (!data.stateId) throw new Error('Failed to generate OAuth state');

            // 2. Standardized Redirect URI (Matching MP Dashboard Rules)
            const redirectUri = process.env.NODE_ENV === 'development'
                ? 'http://localhost:3000/api/mp/callback'
                : 'https://estuclub.com.ar/api/mp/callback';

            // 3. Redirect to MP Auth using requested format
            const appId = process.env.NEXT_PUBLIC_MP_APP_ID;
            const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${appId}&response_type=code&platform_id=mp&state=${data.stateId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
            
            window.location.href = authUrl;

        } catch (error) {
            console.error(error);
            toast({ 
                title: "Error de vinculación", 
                description: "No pudimos iniciar la conexión con Mercado Pago.", 
                variant: "destructive" 
            });
            setIsLinking(false);
        }
    };

    const handleSignOut = async () => {
        haptic.vibrateImpact();
        try {
            await signOut(auth);
            window.location.href = '/login';
        } catch (error) {
            console.error(error);
        }
    };

    if (isUserLoading) return <SplashScreen />;

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-20">
            <header className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-xl">
                    <Settings className="h-7 w-7 text-primary" />
                </div>
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter italic text-foreground leading-none">Ajustes <span className="text-primary italic">Generales</span></h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mt-1">Preferencias y Perfil de Cluber</p>
                </div>
            </header>

            <div className="grid gap-6">
                {/* APARIENCIA Y NOTIFICACIONES */}
                <Card className="rounded-[2.5rem] border-black/5 dark:border-white/5 bg-card/50 dark:bg-card/30 overflow-hidden shadow-2xl">
                    <CardHeader className="border-b border-black/5 dark:border-white/5 p-8 bg-black/5 dark:bg-white/5">
                        <CardTitle className="text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-3">
                            <Moon className="h-5 w-5 text-primary" /> Interfaz y Alertas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4">
                                {theme === 'dark' ? <Moon className="h-5 w-5 opacity-50" /> : <Sun className="h-5 w-5 text-amber-500" />}
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest">Modo Oscuro</p>
                                    <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">Cambiar apariencia visual</p>
                                </div>
                            </div>
                            <Switch 
                                checked={theme === 'dark'} 
                                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} 
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <Bell className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest">Notificaciones Cloud</p>
                                    <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">Alertas de pedidos y turnos</p>
                                </div>
                            </div>
                            <Switch 
                                checked={notifications} 
                                onCheckedChange={setNotifications} 
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* PAGOS Y BILLETERA */}
                <Card className="rounded-[2.5rem] border-black/5 dark:border-white/5 bg-primary/5 overflow-hidden shadow-2xl border-2 border-primary/20">
                    <CardHeader className="border-b border-black/5 dark:border-white/5 p-8 bg-black/5 dark:bg-white/5">
                        <CardTitle className="text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-primary" /> Pagos y Liquidaciones
                        </CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-foreground/40">Configura cómo recibes tu dinero</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-white/5 rounded-3xl border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <CreditCard className="h-20 w-20 text-primary rotate-12" />
                            </div>
                            
                            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                                <div className={cn(
                                    "h-16 w-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500",
                                    supplierData?.mp_linked ? "bg-green-500/10 border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.2)]" : "bg-white/5 border-white/10"
                                )}>
                                    {supplierData?.mp_linked ? (
                                        <ShieldCheck className="h-8 w-8 text-green-500" />
                                    ) : (
                                        <CreditCard className="h-8 w-8 text-foreground/20" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-base font-black uppercase tracking-tighter italic">Mercado Pago</h4>
                                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                                        {supplierData?.mp_linked 
                                            ? `VINCULADO: ID ${supplierData.mp_credentials?.mp_user_id || 'Activo'}` 
                                            : "Tu cuenta de Mercado Pago no está conectada"}
                                    </p>
                                </div>
                            </div>

                            <div className="relative z-10 w-full md:w-auto">
                                {supplierData?.mp_linked ? (
                                    <div className="flex flex-col items-end gap-1">
                                         <Badge className="bg-green-500/20 text-green-500 border-green-500/30 px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest">Cuenta Operativa</Badge>
                                         <p className="text-[8px] text-foreground/20 font-black uppercase tracking-widest mt-2 cursor-pointer hover:text-primary transition-colors" onClick={handleMPLink}>Sincronizar de nuevo</p>
                                    </div>
                                ) : (
                                    <Button 
                                        onClick={handleMPLink}
                                        disabled={isLinking}
                                        className="w-full md:w-auto h-12 px-8 rounded-xl bg-[#009ee3] text-white font-black uppercase tracking-widest text-[10px] hover:bg-[#009ee3]/90 shadow-lg shadow-[#009ee3]/20"
                                    >
                                        {isLinking ? (
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <><ExternalLink className="h-4 w-4 mr-2" /> Vincular Mercado Pago</>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                        
                        <p className="text-[9px] text-foreground/40 italic text-center font-bold uppercase tracking-widest">
                            Al vincular tu cuenta, los pagos de tus clientes impactarán directamente en tu billetera de Mercado Pago.
                        </p>
                    </CardContent>
                </Card>

                {/* PERFIL COMERCIAL */}
                <Card className="rounded-[2.5rem] border-black/5 dark:border-white/5 bg-card/50 dark:bg-card/30 overflow-hidden shadow-2xl">
                    <CardHeader className="border-b border-black/5 dark:border-white/5 p-8 bg-black/5 dark:bg-white/5">
                        <CardTitle className="text-xl font-black uppercase tracking-widest text-foreground flex items-center gap-3">
                            <Building className="h-5 w-5 text-primary" /> Datos del Cluber
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Nombre del Cluber</Label>
                                <Input 
                                    value={storeName} 
                                    onChange={(e) => setStoreName(e.target.value)}
                                    className="h-12 rounded-xl bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">WhatsApp / Teléfono</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                                        <Input 
                                            value={storePhone} 
                                            onChange={(e) => setStorePhone(e.target.value)}
                                            className="h-12 pl-11 rounded-xl bg-white/5 border-white/10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Dirección</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                                        <Input 
                                            value={storeAddress} 
                                            onChange={(e) => setStoreAddress(e.target.value)}
                                            className="h-12 pl-11 rounded-xl bg-white/5 border-white/10"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex gap-4 pt-4">
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="flex-1 h-16 rounded-[1.5rem] font-black uppercase tracking-widest bg-primary text-white shadow-[0_0_30px_rgba(255,0,127,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        {isSaving ? (
                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <><Save className="h-5 w-5 mr-3" /> Guardar Cambios</>
                        )}
                    </Button>
                    <Button 
                        onClick={handleSignOut}
                        variant="outline"
                        className="h-16 px-8 rounded-[1.5rem] border-red-500/30 text-red-500 hover:bg-red-500/10 font-black uppercase tracking-widest text-[10px]"
                    >
                        <LogOut className="h-5 w-5 mr-3" /> Cerrar Sesión
                    </Button>
                </div>
            </div>
        </div>
    );
}
