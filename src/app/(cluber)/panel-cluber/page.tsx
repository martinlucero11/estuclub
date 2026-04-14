'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollectionOnce, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, where, limit, Timestamp, orderBy, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/context/admin-context';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger, 
    DialogFooter, 
    DialogDescription 
} from '@/components/ui/dialog';
import {
    Store, Package, QrCode, BarChart3, Settings,
    Users, LayoutDashboard, UtensilsCrossed,
    Clock, AlertCircle, CheckCircle2, ChevronRight,
    ShieldCheck, Plus, Megaphone, Receipt, Truck,
    Calendar, Info, Sparkles, TrendingUp,
    Activity, Target, Zap, Building, 
    MessageSquare, UserPlus, Shield, Heart,
    Trash2, Mail, Loader2
} from 'lucide-react';
import { ProductManager } from '@/components/delivery/product-manager';
import { cn } from '@/lib/utils';
import MPRestrictionOverlay from '@/components/payment/mp-restriction-overlay';
import MPLinkCard from '@/components/payment/mp-link-card';
import OrdersDashboard from '@/components/supplier/orders-dashboard';
import { RedemptionsTable } from '@/components/supplier/benefit-redemptions-table';
import { TurneroManager } from '../../../components/supplier/turnero-manager';
import { seedBenefits } from '@/lib/seed-benefits';
import SupplierAnalyticsDashboard from '@/components/analytics/SupplierAnalyticsDashboard';
import SupplierSalesDashboard from '@/components/analytics/SupplierSalesDashboard';
import AddAnnouncementForm from '@/components/announcements/add-announcement-form';

export default function PanelCluberPage() {
    const { userData, roles, supplierData, isUserLoading } = useUser();
    const { isAdmin, impersonatedSupplierId, impersonatedSupplierData } = useAdmin();
    const firestore = useFirestore();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const [isUpdating, setIsUpdating] = useState(false);
    const [analyticsView, setAnalyticsView] = useState<'general' | 'sales'>('general');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Mission: URL-driven navigation
    const currentSection = searchParams.get('section') || 'dashboard';

    const effectiveSupplierData = (isAdmin && impersonatedSupplierId) ? impersonatedSupplierData : supplierData;
    const shopId = (isAdmin && impersonatedSupplierId) ? impersonatedSupplierId : userData?.uid;

    // Permissions logic remains but we use it to restrict access if needed
    const canBenefits = userData?.permitsBenefits || effectiveSupplierData?.canCreateBenefits || false;
    const canDelivery = userData?.permitsDelivery || effectiveSupplierData?.deliveryEnabled || false;
    const canTurnero = userData?.permitsShifts || effectiveSupplierData?.appointmentsEnabled || false;

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
            where('status', 'in', ['pending', 'accepted', 'searching_rider', 'assigned', 'shipped']),
            limit(30)
        );
    }, [firestore, shopId]);
    const { data: activeOrders } = useCollection(ordersQuery);

    // 2. Redemptions Today
    const redemptionsQuery = useMemo(() => {
        if (!firestore || !shopId) return null;
        return query(
            collection(firestore, 'redemptions'),
            where('supplierId', '==', shopId),
            where('createdAt', '>=', startOfDay),
            limit(30)
        );
    }, [firestore, shopId, startOfDay]);
    const { data: todayRedemptions } = useCollection(redemptionsQuery);

    const statsCounts = {
        orders: activeOrders?.length ?? 0,
        redemptions: todayRedemptions?.length ?? 0,
    };
    
    // 3. Staff List Query
    const staffQuery = useMemo(() => {
        if (!firestore || !shopId) return null;
        return query(
            collection(firestore, 'staff'),
            where('supplierId', '==', shopId)
        );
    }, [firestore, shopId]);
    const { data: staffMembers } = useCollection(staffQuery);

    const handleAddMember = async (email: string) => {
        if (!firestore || !shopId || !email) return;
        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, 'staff'), {
                email: email.toLowerCase(),
                role: 'collaborator',
                supplierId: shopId,
                addedAt: serverTimestamp(),
            });
            toast({ title: 'Colaborador añadido', description: `${email} ahora tiene acceso.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo añadir al colaborador.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteMember = async (id: string, email: string) => {
        if (!firestore || !confirm(`¿Revocar acceso para ${email}?`)) return;
        try {
            await deleteDoc(doc(firestore, 'staff', id));
            toast({ title: 'Acceso revocado' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo revocar el acceso.' });
        }
    };

    // 4. Marketing Announcements Query
    const announcementsQuery = useMemo(() => {
        if (!firestore || !shopId) return null;
        return query(
            collection(firestore, 'announcements'),
            where('supplierId', '==', shopId),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, shopId]);
    const { data: cluberAnnouncements } = useCollection(announcementsQuery);

    const handleDeleteAnnouncement = async (id: string) => {
        if (!firestore || !confirm('¿Estás seguro de eliminar este anuncio?')) return;
        try {
            await deleteDoc(doc(firestore, 'announcements', id));
            toast({ title: 'Anuncio eliminado' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el anuncio.' });
        }
    };

    const deleteDocLocal = async (coll: string, id: string) => {
        if (!firestore) return;
        await deleteDoc(doc(firestore, coll, id));
    };

    const handleSeedData = async () => {
        if (!firestore || !shopId) return;
        setIsUpdating(true);
        try {
            const sName = effectiveSupplierData?.name || userData?.firstName || 'Cluber Demo';
            await seedBenefits(firestore, shopId, sName);
            toast({
                title: "Sembrado Exitoso",
                description: "Se han insertado 25 beneficios de alta fidelidad.",
            });
        } catch (error) {
            console.error("Error seeding data:", error);
            toast({
                variant: "destructive",
                title: "Error de Sembrado",
                description: "Hubo un problema al insertar los datos de prueba."
            });
        } finally {
            setIsUpdating(false);
        }
    };

    if (isUserLoading) return null;

    // RENDER LOGIC BASED ON SECTION
    const renderContent = () => {
        switch (currentSection) {
            case 'dashboard':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard 
                                label="Pedidos Activos" 
                                value={statsCounts.orders} 
                                icon={Truck} 
                                description="Pedidos en curso hoy"
                            />
                            <StatCard 
                                label="Canjes de Hoy" 
                                value={statsCounts.redemptions} 
                                icon={QrCode} 
                                description="Beneficios validados"
                            />
                            <StatCard 
                                label="Estado del Club" 
                                value={effectiveSupplierData?.isOpen ? "Abierto" : "Cerrado"} 
                                icon={Store} 
                                description="Visibilidad en App"
                                variant={effectiveSupplierData?.isOpen ? "success" : "danger"}
                            />
                        </div>

                        {/* Order management as primary focus */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900">Monitor de Pedidos en Vivo</h2>
                            </div>
                            <OrdersDashboard supplierId={shopId || ''} />
                        </div>
                    </div>
                );
            
            case 'menu':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                         <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                            <div className="md:col-span-5 h-full">
                                <MPLinkCard />
                            </div>
                            <div className="md:col-span-7 bg-white border border-zinc-100 rounded-[2.5rem] p-8 flex flex-col justify-center gap-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <Info className="h-5 w-5 text-primary" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-tight italic">Configuración de Pagos</h3>
                                </div>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                                    Es obligatorio vincular tu cuenta de Mercado Pago para procesar pedidos de delivery. Esto nos permite acreditar tus ventas y gestionar comisiones automáticamente.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900">Catálogo de Productos</h2>
                            </div>
                            <Card className="rounded-[3rem] border-zinc-100 bg-white overflow-hidden min-h-[500px] shadow-sm relative">
                                <ProductManager supplierId={shopId || ''} />
                            </Card>
                        </div>
                    </div>
                );

            case 'turnero':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                         <TurneroManager supplierId={shopId || ''} />
                    </div>
                );

            case 'benefits':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 flex flex-col items-center text-center gap-4 shadow-sm">
                             <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                 <Plus className="h-6 w-6" />
                             </div>
                             <div className="space-y-1">
                                <h3 className="text-xl font-black uppercase tracking-tighter italic">Crea un Nuevo Beneficio</h3>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Atraé a más estudiantes con ofertas exclusivas</p>
                             </div>
                             <Button className="rounded-xl px-10 font-black uppercase tracking-widest text-[10px] h-12 shadow-lg shadow-primary/20">Configurar Beneficio</Button>
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900 px-2">Mis Beneficios Activos</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Placeholder or list map here */}
                                <div className="p-12 text-center bg-zinc-50 rounded-[3rem] border border-zinc-100 border-dashed opacity-50 flex flex-col items-center gap-4">
                                    <Receipt className="h-10 w-10 text-zinc-300" />
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">No hay beneficios registrados aún</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'vouchers':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary animate-pulse" />
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900">Historial de Canjes QR</h2>
                            </div>
                        </div>
                        <Card className="rounded-[3rem] border-zinc-100 bg-white overflow-hidden min-h-[400px] shadow-sm">
                            <RedemptionsTable supplierId={shopId || ''} />
                        </Card>
                    </div>
                );

            
            case 'marketing':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        {/* Header Context */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                                    <Megaphone className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Marketing Hub</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">Anuncios en <span className="text-primary">App</span></h1>
                                <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Llegá a más estudiantes con promociones directas</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Form Column */}
                            <div className="lg:col-span-4 space-y-6">
                                <Card className="rounded-[3rem] border-zinc-100 overflow-hidden shadow-2xl bg-white p-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
                                            <Plus className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black uppercase tracking-tighter italic">Nueva Promo</h3>
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Publicar ahora</p>
                                        </div>
                                    </div>
                                    <AddAnnouncementForm />
                                </Card>
                            </div>

                            {/* Info/Status Column */}
                            <div className="lg:col-span-8 space-y-8">
                                <div className="space-y-4">
                                     <div className="flex items-center gap-2 px-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-900">Anuncios Publicados</h2>
                                    </div>
                                    <div className="grid gap-6">
                                        {cluberAnnouncements?.map((ann) => (
                                            <Card key={ann.id} className="rounded-[2.5rem] border-zinc-100 bg-white p-8 flex items-center justify-between group shadow-sm hover:shadow-xl transition-all duration-500">
                                                <div className="flex items-center gap-6">
                                                    {ann.imageUrl ? (
                                                        <img src={ann.imageUrl} className="h-16 w-16 rounded-2xl object-cover border border-zinc-100" />
                                                    ) : (
                                                        <div className="h-16 w-16 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100">
                                                            <Megaphone className="h-6 w-6 text-zinc-300" />
                                                        </div>
                                                    )}
                                                    <div className="space-y-1">
                                                        <h4 className="text-lg font-black uppercase italic tracking-tighter leading-none">{ann.title}</h4>
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest line-clamp-1 max-w-md">{ann.content}</p>
                                                    </div>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleDeleteAnnouncement(ann.id)}
                                                    className="rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all active:scale-90"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </Card>
                                        ))}

                                        {cluberAnnouncements?.length === 0 && (
                                            <div className="p-20 text-center bg-zinc-50 rounded-[3rem] border border-zinc-100 border-dashed opacity-50 flex flex-col items-center gap-6">
                                                <Megaphone className="h-12 w-12 text-zinc-300" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">No tenés anuncios publicados aún</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Card className="rounded-[3rem] p-10 border-zinc-100 bg-zinc-50 border-dashed flex flex-col items-center justify-center text-center gap-6 opacity-60 min-h-[300px]">
                                    <div className="h-16 w-16 rounded-[2rem] bg-white flex items-center justify-center shadow-xl border border-zinc-100">
                                        <Sparkles className="h-6 w-6 text-zinc-300" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black uppercase tracking-tighter italic text-zinc-400 leading-none">Notificaciones Push</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Muy pronto: Envía alertas directas a tus seguidores</p>
                                    </div>
                                    <Button disabled variant="outline" className="rounded-xl h-12 uppercase font-black text-[9px] tracking-widest px-8">Próximamente</Button>
                                </Card>
                            </div>
                        </div>
                    </div>
                );

            case 'analytics':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
                         {/* View Switcher Controls */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                    <Activity className="h-3.5 w-3.5 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Business Intelligence</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">Panel de <span className="text-primary">Métricas</span></h1>
                                <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Análisis operativo y financiero en tiempo real</p>
                            </div>

                            <div className="flex bg-black/[0.03] p-1.5 rounded-[1.5rem] border border-black/5 shadow-inner">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setAnalyticsView('general')}
                                    className={cn(
                                        "rounded-xl h-11 px-8 font-black text-[9px] uppercase tracking-widest transition-all",
                                        analyticsView === 'general' ? "bg-white text-primary shadow-lg" : "text-black/40 hover:text-black"
                                    )}
                                >
                                    <Target className="mr-2 h-4 w-4" /> General
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setAnalyticsView('sales')}
                                    className={cn(
                                        "rounded-xl h-11 px-8 font-black text-[9px] uppercase tracking-widest transition-all",
                                        analyticsView === 'sales' ? "bg-white text-primary shadow-lg" : "text-black/40 hover:text-black"
                                    )}
                                >
                                    <TrendingUp className="mr-2 h-4 w-4" /> Ventas
                                </Button>
                            </div>
                        </div>

                        {analyticsView === 'general' ? (
                            <SupplierAnalyticsDashboard supplierId={shopId || ''} />
                        ) : (
                            <SupplierSalesDashboard supplierId={shopId || ''} />
                        )}
                    </div>
                );

            case 'team':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-4">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                                    <Shield className="h-3.5 w-3.5 text-indigo-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Acceso & Permisos</span>
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none">Mi <span className="text-primary">Equipo</span></h1>
                                <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Gestioná los accesos de tus colaboradores</p>
                            </div>

                            <AddStaffModal onAdd={handleAddMember} isLoading={isSubmitting} />
                        </div>

                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {/* Owner Card */}
                            <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden p-10 space-y-8">
                                <div className="h-20 w-20 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                                    <Shield className="h-10 w-10 text-indigo-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{userData?.firstName} {userData?.lastName}</h3>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{userData?.email}</p>
                                    <div className="pt-2">
                                        <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white border-none px-4 py-1.5 rounded-xl font-black text-[8px] uppercase tracking-widest">DUEÑO / ADMIN</Badge>
                                    </div>
                                </div>
                            </Card>

                            {/* Staff Cards */}
                            {staffMembers?.map((member) => (
                                <Card key={member.id} className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden p-10 space-y-8 animate-in zoom-in duration-500">
                                    <div className="flex items-center justify-between">
                                        <div className="h-20 w-20 rounded-[2rem] bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-inner">
                                            <Users className="h-10 w-10 text-zinc-300" />
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleDeleteMember(member.id, member.email)}
                                            className="h-12 w-12 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all active:scale-90"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none truncate">{member.email.split('@')[0]}</h3>
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">{member.email}</p>
                                        <div className="pt-2">
                                            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-500 px-4 py-1.5 rounded-xl font-black text-[8px] uppercase tracking-widest">COLABORADOR ACTIVO</Badge>
                                        </div>
                                    </div>
                                </Card>
                            ))}

                            {staffMembers?.length === 0 && (
                                <Card className="rounded-[3.5rem] border-2 border-dashed border-zinc-100 bg-transparent flex flex-col items-center justify-center p-12 text-center gap-6 opacity-40">
                                    <Users className="h-12 w-12" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No hay miembros registrados</p>
                                </Card>
                            )}
                        </div>
                    </div>
                );

            case 'settings':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                         <div className="grid md:grid-cols-2 gap-6">
                             <Card className="rounded-[2.5rem] p-8 border-zinc-100 bg-white shadow-sm flex flex-col gap-6">
                                 <div className="h-12 w-12 rounded-xl bg-zinc-50 flex items-center justify-center border border-zinc-100">
                                     <Settings className="h-5 w-5 text-zinc-400" />
                                 </div>
                                 <div className="space-y-1">
                                    <h3 className="text-xl font-black uppercase tracking-tighter italic">Ajustes Generales</h3>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Información de contacto y perfil</p>
                                 </div>
                                 <Button variant="outline" className="rounded-xl h-12 uppercase font-black text-[9px] tracking-widest w-fit px-8">Editar Perfil</Button>
                             </Card>
                             
                             <Card className="rounded-[2.5rem] p-8 border-zinc-100 bg-white shadow-sm flex flex-col gap-6">
                                 <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                                     <Sparkles className="h-5 w-5 text-primary" />
                                 </div>
                                 <div className="space-y-1">
                                    <h3 className="text-xl font-black uppercase tracking-tighter italic">Carga Rápida (Demo)</h3>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Insertar datos de prueba para testing</p>
                                 </div>
                                 <Button 
                                    onClick={handleSeedData}
                                    disabled={isUpdating}
                                    className="rounded-xl h-12 uppercase font-black text-[9px] tracking-widest w-fit px-8"
                                >
                                    {isUpdating ? 'Sembrando...' : 'Sembrar Beneficios'}
                                 </Button>
                             </Card>
                         </div>
                    </div>
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-4 opacity-50">
                        <AlertCircle className="h-12 w-12" />
                        <p className="font-black uppercase tracking-widest text-xs">Sección en desarrollo</p>
                    </div>
                );
        }
    };

    return (
        <div className="animate-fade-in relative pb-10 pt-4 md:pt-0">
            <MPRestrictionOverlay />
            {renderContent()}
        </div>
    );
}

// ─── HELPER COMPONENTS ────────────────────────────────────

function AddStaffModal({ onAdd, isLoading }: { onAdd: (email: string) => void, isLoading: boolean }) {
    const [email, setEmail] = useState('');

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="h-14 px-10 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">
                    <UserPlus className="h-4 w-4 mr-2" /> SUMAR MIEMBRO
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[3rem] p-10 overflow-hidden border-none shadow-2xl glass dark:bg-[#000000]/95 backdrop-blur-xl sm:max-w-xl">
                <DialogHeader className="mb-8">
                    <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase leading-none">Invitar Colaborador</DialogTitle>
                    <DialogDescription className="text-xs font-bold text-foreground opacity-50 italic mt-2 uppercase tracking-widest">Dale acceso operativo a tu equipo.</DialogDescription>
                </DialogHeader>
                <div className="space-y-8">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] ml-2 text-primary">Correo Electrónico</Label>
                        <div className="relative">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/30" />
                            <Input 
                                type="email" 
                                placeholder="ej: colab@estuclub.com" 
                                className="h-16 pl-16 rounded-2xl bg-white/10 border-white/5 font-black text-sm tracking-widest" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button 
                        onClick={() => { onAdd(email); setEmail(''); }}
                        disabled={isLoading || !email}
                        className="w-full h-16 rounded-2xl bg-indigo-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'CONCEDER ACCESO'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function StatCard({ label, value, icon: Icon, iconClassName, description, variant = 'default' }: { 
    label: string, 
    value: string | number, 
    icon: any, 
    iconClassName?: string,
    description?: string,
    variant?: 'default' | 'success' | 'danger'
}) {
    return (
        <Card className="rounded-[2.5rem] border-zinc-100 p-8 relative overflow-hidden transition-all hover:scale-[1.02] duration-500 bg-white shadow-sm group">
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">{label}</p>
                    <h3 className={cn(
                        "text-4xl font-black tracking-tighter italic leading-none",
                        variant === 'success' ? "text-emerald-500" : variant === 'danger' ? "text-red-500" : "text-zinc-900"
                    )}>
                        {value}
                    </h3>
                </div>
                <div className={cn(
                    "p-4 rounded-2xl group-hover:scale-110 transition-transform shadow-inner border border-zinc-50",
                    variant === 'success' ? "bg-emerald-50 text-emerald-500" : variant === 'danger' ? "bg-red-50 text-red-500" : "bg-zinc-50 text-zinc-400",
                    iconClassName
                )}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
            {description && (
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                    {description}
                </p>
            )}
        </Card>
    );
}


