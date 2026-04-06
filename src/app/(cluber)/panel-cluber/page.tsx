'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollectionOnce, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, where, limit, Timestamp, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/context/admin-context';
import {
    Store, Package, QrCode, BarChart3, Settings,
    Users, Bell, LayoutDashboard, UtensilsCrossed,
    Clock, AlertCircle, CheckCircle2, ChevronRight,
    ShieldCheck, Plus, Megaphone, Receipt, Truck,
    Calendar, Info, Sparkles, TrendingUp
} from 'lucide-react';
import { ProductManager } from '@/components/delivery/product-manager';
import SupplierSelect from '@/components/admin/SupplierSelect';
import { cn } from '@/lib/utils';
import MPRestrictionOverlay from '@/components/payment/mp-restriction-overlay';
import OrdersDashboard from '@/components/supplier/orders-dashboard';
import { BenefitRedemptionsTable } from '@/components/supplier/benefit-redemptions-table';
import { TurneroManager } from '../../../components/supplier/turnero-manager';

// ─── PENDING SCREEN ──────────────────────────────────────
function CluberPending() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 px-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="h-24 w-24 rounded-[3rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                <Store className="h-12 w-12 text-indigo-500 animate-pulse" />
            </div>
            <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tighter uppercase italic text-primary font-montserrat leading-none">Verificando tu <br /> Cluber</h1>
                <p className="text-sm text-foreground font-bold max-w-xs mx-auto leading-relaxed italic uppercase tracking-widest opacity-60">
                    Nuestro equipo de expansión está revisando tu postulación de Cluber.
                </p>
            </div>
            <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 max-w-xs">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Estatus: Pendiente
                </p>
                <p className="text-9px font-bold text-foreground leading-relaxed italic">
                    Recibirás una notificación y un email en cuanto tu Club esté habilitado para operar.
                </p>
            </div>
            <Button asChild variant="ghost" className="text-foreground font-black text-[10px] uppercase tracking-[0.3em]">
                <Link href="/">← Volver al inicio</Link>
            </Button>
        </div>
    );
}

export default function PanelCluberPage() {
    const { userData, roles, supplierData, isUserLoading } = useUser();
    const { isAdmin, impersonatedSupplierId, impersonatedSupplierData } = useAdmin();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isUpdating, setIsUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState<'benefits' | 'delivery' | 'turnero'>('benefits');

    const effectiveSupplierData = (isAdmin && impersonatedSupplierId) ? impersonatedSupplierData : supplierData;
    const shopId = (isAdmin && impersonatedSupplierId) ? impersonatedSupplierId : userData?.uid;
    const isOpen = effectiveSupplierData?.isOpen ?? false;

    // Dynamic Permissions
    // MISSION 1: CENTRALIZACIÓN DE PERMISOS EN COLECCIÓN USERS (SSoT)
    const canBenefits = userData?.permitsBenefits ?? false;
    const canDelivery = userData?.permitsDelivery ?? false; // Centralized
    const canTurnero = userData?.permitsShifts ?? false;    // Centralized

    // Set initial tab based on permissions
    useEffect(() => {
        if (!canBenefits) {
            if (canDelivery) setActiveTab('delivery');
            else if (canTurnero) setActiveTab('turnero');
        }
    }, [canBenefits, canDelivery, canTurnero]);

    // --- REAL-TIME STATS QUERIES ---
    const startOfDay = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return Timestamp.fromDate(d);
    }, []);

    // 1. Pending/Active Orders
    const ordersQuery = useMemo(() => {
        if (!firestore || !shopId) return null;
        return query(
            collection(firestore, 'orders'),
            where('supplierId', '==', shopId),
            where('status', 'in', ['pending', 'accepted', 'searching_rider', 'assigned', 'shipped'])
        );
    }, [firestore, shopId]);
    const { data: activeOrders } = useCollection(ordersQuery);

    // 2. Redemptions Today
    const redemptionsQuery = useMemo(() => {
        if (!firestore || !shopId) return null;
        return query(
            collection(firestore, 'benefitRedemptions'),
            where('supplierId', '==', shopId),
            where('createdAt', '>=', startOfDay)
        );
    }, [firestore, shopId, startOfDay]);
    const { data: todayRedemptions } = useCollection(redemptionsQuery);

    // 3. Appointments Today
    const appointmentsQuery = useMemo(() => {
        if (!firestore || !shopId) return null;
        return query(
            collection(firestore, 'appointments'),
            where('supplierId', '==', shopId),
            where('startTime', '>=', startOfDay)
        );
    }, [firestore, shopId, startOfDay]);
    const { data: todayAppointments } = useCollection(appointmentsQuery);

    const statsCounts = {
        orders: activeOrders?.length ?? 0,
        redemptions: todayRedemptions?.length ?? 0,
        appointments: todayAppointments?.length ?? 0
    };

    const toggleStoreStatus = async () => {
        if (!shopId || !firestore) return;
        setIsUpdating(true);
        try {
            const docRef = doc(firestore, 'roles_supplier', shopId);
            await updateDoc(docRef, { isOpen: !isOpen });
            toast({
                title: isOpen ? "Cluber Cerrado" : "Cluber Abierto",
                description: isOpen ? "Ya no recibirás actividad por ahora." : "¡Listo para operar!",
                variant: isOpen ? "destructive" : "default"
            });
        } catch (error) {
            console.error("Error toggling status:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo actualizar el estado de tu Club."
            });
        } finally {
            setIsUpdating(false);
        }
    };

    if (isUserLoading) return null;
    if (userData?.role === 'cluber_pending' && !isAdmin) return <CluberPending />;
    if (!roles.includes('supplier') && !roles.includes('cluber') && !isAdmin) {
        return (
            <div className="min-h-screen bg-primary flex items-center justify-center p-6">
                <Card className="w-full max-w-md rounded-[3rem] border-none shadow-2xl bg-background text-foreground animate-in fade-in zoom-in duration-700">
                    <CardContent className="pt-16 pb-12 text-center space-y-8">
                        <div className="h-20 w-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                            <AlertCircle className="h-10 w-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-black uppercase tracking-tighter font-montserrat">ACCESO DENEGADO</h1>
                            <p className="text-xs font-bold opacity-60 uppercase tracking-widest leading-relaxed">
                                Esta área está reservada para <br /> <span className="font-black">Clubers Aliados</span>
                            </p>
                        </div>
                        <Button asChild className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-[0_10px_30px_rgba(203, 70, 90,0.3)]">
                            <Link href="/">Volver al inicio</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-24 animate-fade-in relative overflow-x-hidden">
            <MPRestrictionOverlay />
            
            <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8 space-y-8">

                {/* Superior Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 rounded-[3rem] bg-white border border-black/5 shadow-2xl relative overflow-hidden group">
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center border border-primary/10 shadow-inner group-hover:scale-105 transition-transform duration-500">
                            <Store className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-black leading-none mb-1">
                                {effectiveSupplierData?.name || 'Cluber Panel'}
                            </h1>
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full animate-pulse", isOpen ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]")} />
                                <span className={cn("text-[10px] font-black uppercase tracking-widest italic", isOpen ? "text-emerald-600" : "text-black/40")}>
                                    {isOpen ? "Operando en Vivo" : "Servicio Pausado"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
                        {isAdmin && <div className="hidden lg:block scale-90"><SupplierSelect /></div>}

                        <div className={cn(
                            "rounded-[1.5rem] border border-black/5 transition-all h-14 flex items-center px-6 gap-6 bg-white shadow-xl",
                            isOpen ? "shadow-[0_0_30px_rgba(16,185,129,0.1)] border-emerald-100" : "shadow-[0_0_30px_rgba(239,68,68,0.1)] border-red-100"
                        )}>
                            <div className="flex flex-col">
                                <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", isOpen ? "text-emerald-500" : "text-red-500")}>
                                    Switch Maestro
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-black">
                                    {isOpen ? "Abierto" : "Cerrado"}
                                </span>
                            </div>
                            <Switch
                                id="master-switch"
                                checked={isOpen}
                                onCheckedChange={toggleStoreStatus}
                                disabled={isUpdating}
                                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500 scale-110 shadow-lg"
                            />
                        </div>
                    </div>
                </header>

                {/* --- STATS HEADER (KPIs) --- */}
                <CluberStatsHeader stats={statsCounts} activeTab={activeTab} />

                <div className="flex justify-center">
                    <div className="bg-white p-1.5 rounded-[1.8rem] border border-black/5 flex items-center gap-1 shadow-xl">
                        {canBenefits && (
                            <TabButton
                                active={activeTab === 'benefits'}
                                onClick={() => setActiveTab('benefits')}
                                icon={Receipt}
                                label="Beneficios"
                            />
                        )}
                        {canDelivery && (
                            <TabButton
                                active={activeTab === 'delivery'}
                                onClick={() => setActiveTab('delivery')}
                                icon={Truck}
                                label="Delivery"
                            />
                        )}
                        {canTurnero && (
                            <TabButton
                                active={activeTab === 'turnero'}
                                onClick={() => setActiveTab('turnero')}
                                icon={Calendar}
                                label="Turnero"
                            />
                        )}
                    </div>
                </div>

                {/* --- CONTENT BY MODE --- */}
                <div className="min-h-[60vh]">
                    {activeTab === 'benefits' && <BenefitsModule shopId={shopId || ''} />}
                    {activeTab === 'delivery' && <DeliveryModule shopId={shopId || ''} />}
                    {activeTab === 'turnero' && <TurneroModule shopId={shopId || ''} />}
                </div>

                {/* --- FOOTER TOOLS --- */}
                <div className="flex flex-wrap justify-center gap-6 pt-16 pb-8">
                    <Link href="/panel-cluber/configuracion">
                        <Button variant="ghost" className="rounded-2xl h-16 px-10 gap-4 bg-white border border-black/5 hover:bg-black/5 hover:scale-105 transition-all group shadow-xl">
                            <div className="h-8 w-8 rounded-xl bg-primary/5 flex items-center justify-center">
                                <Settings className="h-4 w-4 text-primary group-hover:rotate-90 transition-all duration-700" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-black/60 group-hover:text-primary">Ajustes</span>
                        </Button>
                    </Link>
                    <Link href="/panel-cluber/equipo">
                        <Button variant="ghost" className="rounded-2xl h-16 px-10 gap-4 bg-white border border-black/5 hover:bg-black/5 hover:scale-105 transition-all group shadow-xl">
                            <div className="h-8 w-8 rounded-xl bg-blue-500/5 flex items-center justify-center">
                                <Users className="h-4 w-4 text-blue-500" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-black/60 group-hover:text-blue-500">Mi Equipo</span>
                        </Button>
                    </Link>
                </div>

                {isAdmin && (
                    <div className="fixed bottom-24 right-6 p-4 rounded-3xl bg-white border border-black/5 text-primary z-50 shadow-[0_15px_50px_rgba(0,0,0,0.1)] animate-in slide-in-from-right-6 duration-700">
                        <p className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" /> Admin View: {shopId?.slice(0, 8)}
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}

// ─── HELPER COMPONENTS ────────────────────────────────────

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <Button
            variant="ghost"
            onClick={onClick}
            className={cn(
                "rounded-[1.3rem] font-black text-[9px] uppercase tracking-[0.2em] px-8 h-12 transition-all duration-500",
                active
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(203,70,90,0.4)] scale-105 z-10"
                    : "text-black/40 hover:bg-black/5 hover:text-primary"
            )}
        >
            <Icon className={cn("mr-2 h-4 w-4 transition-transform", active && "scale-110")} />
            {label}
        </Button>
    )
}

function CluberStatsHeader({ stats, activeTab }: { stats: any, activeTab: string }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
                label={activeTab === 'turnero' ? "Turnos del Día" : activeTab === 'delivery' ? "Pedidos Activos" : "Canjes de Hoy"}
                value={activeTab === 'turnero' ? stats.appointments : activeTab === 'delivery' ? stats.orders : stats.redemptions}
                trend="+100%"
                icon={TrendingUp}
            />
            <StatCard
                label="Estado de Red"
                value="Saludable"
                icon={ShieldCheck}
            />
        </div>
    )
}

function StatCard({ label, value, trend, icon: Icon }: { label: string, value: string | number, trend?: string, icon: any }) {
    return (
        <Card className="rounded-[2.5rem] border border-black/5 p-6 relative overflow-hidden transition-all hover:scale-[1.02] duration-500 bg-white shadow-xl group">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-black/40 uppercase tracking-[0.2em]">{label}</p>
                    <h3 className="text-3xl font-black tracking-tighter italic text-black flex items-center gap-2">
                        {value}
                        {label === "Estado de Red" && <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                    </h3>
                </div>
                <div className="p-3 rounded-2xl group-hover:scale-110 transition-transform shadow-lg bg-black/5 text-primary">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            {trend && (
                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mt-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> {trend} vs ayer
                </p>
            )}
        </Card>
    )
}

function BenefitsModule({ shopId }: { shopId: string }) {
    const { toast } = useToast();
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Canjear QR", icon: QrCode, href: "/panel-cluber/scanner", color: "text-blue-400 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]" },
                    { 
                        label: "Nuevo Beneficio", 
                        icon: Plus, 
                        href: "/panel-cluber/benefits", 
                        color: "text-white bg-primary shadow-[0_0_20px_rgba(203,70,90,0.5)] animate-pulse-slow" 
                    },
                    { 
                        label: "Anunciar", 
                        icon: Megaphone, 
                        href: "/panel-cluber/announcements", 
                        color: "text-orange-400 bg-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.3)]" 
                    },
                    { label: "Métricas", icon: BarChart3, href: "/panel-cluber/analytics", color: "text-emerald-400 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]" },
                ].map((btn) => (
                    <Link key={btn.label} href={btn.href}>
                        <Card className="rounded-[2.5rem] border border-black/5 bg-white hover:bg-black/[0.02] transition-all duration-500 group h-36 flex flex-col items-center justify-center text-center gap-3 shadow-xl overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className={cn("p-4 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 z-10", btn.color)}>
                                <btn.icon className="h-7 w-7" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-black/40 group-hover:text-primary z-10">{btn.label}</span>
                        </Card>
                    </Link>
                ))}
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary animate-pulse" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-black/60">Flujo de Canjes</h2>
                    </div>
                </div>
                <Card className="rounded-[3rem] border border-black/5 bg-white overflow-hidden min-h-[400px] shadow-2xl relative">
                    <BenefitRedemptionsTable supplierId={shopId} />
                </Card>
            </div>
        </div>
    )
}

function DeliveryModule({ shopId }: { shopId: string }) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <OrdersDashboard supplierId={shopId} />
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <Package className="h-4 w-4 text-primary" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Catálogo de Productos</h2>
                </div>
                <Card className="rounded-[3rem] border border-black/5 bg-white overflow-hidden min-h-[500px] shadow-2xl relative">
                    <ProductManager supplierId={shopId} />
                </Card>
            </div>
        </div>
    )
}

function TurneroModule({ shopId }: { shopId: string }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <TurneroManager supplierId={shopId} />
        </div>
    )
}


