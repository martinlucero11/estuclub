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
    Calendar, Info, Heart, Sparkles, TrendingUp
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
                <h1 className="text-3xl font-black tracking-tighter uppercase italic text-indigo-500 font-montserrat leading-none">Verificando tu <br /> Negocio</h1>
                <p className="text-sm text-foreground font-bold max-w-xs mx-auto leading-relaxed italic uppercase tracking-widest opacity-60">
                    Nuestro equipo de expansión está revisando tu postulación comercial.
                </p>
            </div>
            <div className="p-6 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 max-w-xs">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Estatus: Pendiente
                </p>
                <p className="text-[9px] font-bold text-foreground leading-relaxed italic">
                    Recibirás una notificación y un email en cuanto tu local esté habilitado para vender.
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
    const canBenefits = effectiveSupplierData?.canCreateBenefits ?? false;
    const canDelivery = effectiveSupplierData?.deliveryEnabled ?? false;
    const canTurnero = effectiveSupplierData?.appointmentsEnabled ?? false;

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
                title: isOpen ? "Tienda Cerrada" : "Tienda Abierta",
                description: isOpen ? "Ya no recibirás pedidos por ahora." : "¡Listo para vender!",
                variant: isOpen ? "destructive" : "default"
            });
        } catch (error) {
            console.error("Error toggling status:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo actualizar el estado de la tienda."
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
                                Esta área está reservada para <br /> <span className="font-black">Comercios Aliados</span>
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
        <div className="min-h-screen bg-background pb-24 animate-fade-in relative overflow-x-hidden">
            <MPRestrictionOverlay />

            {/* ─── HEADER FIX ────────────────────────────────────── */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-background z-[60]" />

            <div className="max-w-7xl mx-auto px-6 md:px-8 pt-8 space-y-8">

                {/* Superior Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Store className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter italic">
                                {effectiveSupplierData?.name || 'Cluber Panel'}
                            </h1>
                            <div className="flex items-center gap-2">
                                <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", isOpen ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500")} />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                    {isOpen ? "Tienda Abierta" : "Tienda Cerrada"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {isAdmin && <div className="hidden lg:block"><SupplierSelect /></div>}

                        <Card className={cn(
                            "rounded-2xl border border-white/5 transition-all h-12 flex items-center px-4 gap-4",
                            isOpen ? "bg-emerald-500/10" : "bg-red-500/10"
                        )}>
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", isOpen ? "text-emerald-500" : "text-red-500")}>
                                {isOpen ? "En Línea" : "Pausado"}
                            </span>
                            <Switch
                                checked={isOpen}
                                onCheckedChange={toggleStoreStatus}
                                disabled={isUpdating}
                                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500 scale-90"
                            />
                        </Card>
                    </div>
                </header>

                {/* --- STATS HEADER (KPIs) --- */}
                <CluberStatsHeader stats={statsCounts} activeTab={activeTab} />

                {/* --- DYNAMIC SEGMENTED CONTROL --- */}
                <div className="flex justify-center">
                    <div className="bg-background dark:bg-white/5 backdrop-blur-xl p-1.5 rounded-[1.5rem] border border-foreground dark:border-white/10 flex items-center gap-1 shadow-inner">
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
                <div className="flex flex-wrap justify-center gap-4 pt-12">
                    <Link href="/panel-cluber/supplier-profile">
                        <Button variant="ghost" className="rounded-2xl h-12 px-6 gap-3 border border-foreground dark:border-white/5 hover:bg-primary/5 transition-all group">
                            <Settings className="h-4 w-4 text-foreground group-hover:text-primary group-hover:rotate-45 transition-all" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground group-hover:text-primary">Configuración</span>
                        </Button>
                    </Link>
                    <Link href="/panel-cluber/equipo">
                        <Button variant="ghost" className="rounded-2xl h-12 px-6 gap-3 border border-foreground dark:border-white/5 hover:bg-primary/5 transition-all group">
                            <Users className="h-4 w-4 text-foreground group-hover:text-primary transition-all" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground group-hover:text-primary">Equipo Central</span>
                        </Button>
                    </Link>
                </div>

                {isAdmin && (
                    <div className="fixed bottom-24 right-6 p-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-primary/20 text-white z-50 shadow-2xl animate-in slide-in-from-right-6 duration-700">
                        <p className="text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck className="h-3 w-3 text-primary" /> Admin View: {shopId?.slice(0, 8)}
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
                "rounded-[1.2rem] font-black text-[9px] uppercase tracking-[0.2em] px-8 h-12 transition-all duration-500",
                active
                    ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105 z-10"
                    : "text-foreground hover:bg-background dark:hover:bg-white/5"
            )}
        >
            <Icon className={cn("mr-2 h-4 w-4 transition-transform", active && "scale-110")} />
            {label}
        </Button>
    )
}

function CluberStatsHeader({ stats, activeTab }: { stats: any, activeTab: string }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
                label={activeTab === 'turnero' ? "Turnos del Día" : activeTab === 'delivery' ? "Pedidos Activos" : "Canjes de Hoy"}
                value={activeTab === 'turnero' ? stats.appointments : activeTab === 'delivery' ? stats.orders : stats.redemptions}
                trend="+100%"
                icon={TrendingUp}
            />
            <StatCard
                label="Impacto Social"
                value="Cinco.Dos"
                icon={Heart}
                isSocial
            />
            <StatCard
                label="Estado de Red"
                value="Saludable"
                icon={ShieldCheck}
            />
        </div>
    )
}

function StatCard({ label, value, trend, icon: Icon, isSocial }: { label: string, value: string, trend?: string, icon: any, isSocial?: boolean }) {
    return (
        <Card className={cn(
            "rounded-[2.5rem] border border-foreground dark:border-white/5 p-6 relative overflow-hidden transition-all hover:border-primary/20 group",
            isSocial ? "bg-primary/5 border-primary/20" : "bg-white/50 dark:bg-card/30"
        )}>
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-foreground uppercase tracking-[0.2em]">{label}</p>
                    <h3 className={cn("text-2xl font-black tracking-tighter italic", isSocial && "text-primary italic")}>{value}</h3>
                </div>
                <div className={cn("p-2.5 rounded-2xl group-hover:scale-110 transition-transform", isSocial ? "bg-primary text-white" : "bg-primary/10 text-primary")}>
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            {trend && (
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-2">{trend} vs ayer</p>
            )}
        </Card>
    )
}

function BenefitsModule({ shopId }: { shopId: string }) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Canjear QR", icon: QrCode, href: "/panel-cluber/scanner", color: "text-blue-500 bg-blue-500/10" },
                    { label: "Nuevo Beneficio", icon: Plus, href: "/panel-cluber/benefits/new", color: "text-primary bg-primary/10" },
                    { label: "Anunciar", icon: Megaphone, href: "/panel-cluber/announcements/new", color: "text-orange-500 bg-orange-500/10" },
                    { label: "Métricas", icon: BarChart3, href: "/panel-cluber/analytics", color: "text-emerald-500 bg-emerald-500/10" },
                ].map((btn) => (
                    <Link key={btn.label} href={btn.href}>
                        <Card className="rounded-[2.5rem] border border-foreground dark:border-white/5 bg-white/30 dark:bg-card/30 hover:bg-primary/5 transition-all group h-32 flex flex-col items-center justify-center text-center gap-3">
                            <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform shadow-sm", btn.color)}>
                                <btn.icon className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground dark:text-white/60">{btn.label}</span>
                        </Card>
                    </Link>
                ))}
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Flujo de Canjes</h2>
                    </div>
                </div>
                <Card className="rounded-[3rem] border border-foreground dark:border-white/5 bg-white/50 dark:bg-background/50 overflow-hidden min-h-[400px]">
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
                <Card className="rounded-[3rem] border border-foreground dark:border-white/5 bg-white/50 dark:bg-background/50 overflow-hidden min-h-[500px]">
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


