'use client';
export const dynamic = 'force-dynamic';

import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, doc, updateDoc, setDoc, serverTimestamp, orderBy, Timestamp, deleteField } from 'firebase/firestore';
import { useMemo, useState, useTransition } from 'react';
import { createConverter } from '@/lib/firestore-converter';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  ExternalLink, Loader2,  CheckCircle, User, Users,
  Building, ShieldCheck, ShieldX, Fingerprint, Phone, Car, Camera,
  ChevronRight, Zap, Search, Settings2, Globe, Star, Megaphone, Truck, Utensils, Gift,
  CalendarDays, CalendarClock, TrendingDown
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupplierProfile } from '@/types/data';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { approveRiderOperation, approveSupplierOperation, rejectRiderOperation } from '@/lib/actions/role-actions';
import { OptimizedImage } from '@/components/common/OptimizedImage';

interface RiderApplication {
  id: string;
  userId: string;
  userName: string;
  email: string;
  dni: string;
  phone: string;
  patente: string;
  fotoRostroUrl: string;
  fotoVehiculoUrl: string;
  ddjjAntecedentes: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

interface ComedorApplication {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  institution: string;
  courseYear: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

interface SupplierRequest {
  id: string;
  userId: string;
  supplierName: string;
  category: string;
  address: string;
  commercialPhone: string;
  logo: string;
  fachada: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: any;
}

import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function VerifyPage() {
  const { userData, roles, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'riders' | 'pending-clubers' | 'management' | 'cinco-dos' | 'appointments'>('riders');
  const [searchQuery, setSearchQuery] = useState('');
  const [configCluber, setConfigCluber] = useState<SupplierProfile | null>(null);

  const isAdmin = roles.includes('admin');

  // ── ADMIN OVERLORD BYPASS ────────────────────────────────
  if (!isUserLoading && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#000000] p-6 selection:bg-[#cb465a]/30">
        <Card className="w-full max-w-md text-center rounded-[3rem] border-none shadow-[0_0_50px_rgba(255,0,127,0.1)] bg-background/50 backdrop-blur-xl">
          <CardContent className="pt-16 pb-12 space-y-6">
            <div className="h-20 w-20 rounded-[2rem] bg-[#cb465a]/10 flex items-center justify-center mx-auto border border-[#cb465a]/20">
               <ShieldX className="h-10 w-10 text-[#cb465a]" />
            </div>
            <div className="space-y-2">
               <h1 className="text-3xl font-black uppercase tracking-tighter text-white font-montserrat">ACCESO DENEGADO</h1>
               <p className="text-xs font-bold text-foreground uppercase tracking-widest leading-relaxed">
                 Esta área está restringida a personal de <br/> <span className="text-[#cb465a]">Estuclub Central</span>
               </p>
            </div>
            <Button asChild className="h-14 px-10 rounded-2xl bg-[#cb465a] text-white font-black uppercase tracking-widest hover:bg-[#cb465a]/90 transition-all shrink-0">
               <Link href="/">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingRiderQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'rider_applications').withConverter(createConverter<RiderApplication>()),
      where('status', '==', 'pending')
    );
  }, [firestore]);

  const supplierRequestsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'supplier_requests').withConverter(createConverter<SupplierRequest>()),
      where('status', '==', 'pending')
    );
  }, [firestore]);

  const allClubersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()),
      orderBy('name', 'asc')
    );
  }, [firestore]);

  const pendingComedorQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'comedor_applications').withConverter(createConverter<ComedorApplication>()),
      where('status', '==', 'pending')
    );
  }, [firestore]);

  const appointmentsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'appointments').withConverter(createConverter<any>()),
      orderBy('startTime', 'desc')
    );
  }, [firestore]);

  const { data: applications, isLoading: isLoadingRiders } = useCollection<RiderApplication>(pendingRiderQuery);
  const { data: allClubers, isLoading: isLoadingManagement } = useCollection<SupplierProfile>(allClubersQuery);
  const { data: comedorApps, isLoading: isLoadingComedor } = useCollection<ComedorApplication>(pendingComedorQuery);
  const { data: pendingClubers, isLoading: isLoadingPendingClubers } = useCollection<SupplierRequest>(supplierRequestsQuery);
  const { data: appointments, isLoading: isLoadingAppointments } = useCollection<any>(appointmentsQuery);

  const filteredManagementClubers = useMemo(() => {
    if (!searchQuery) return allClubers || [];
    return allClubers?.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  }, [allClubers, searchQuery]);

  const handleApproveRider = (app: RiderApplication) => {
    startTransition(async () => {
      try {
        const result = await approveRiderOperation(app.id, {
          userId: app.userId,
          email: app.email,
          userName: app.userName,
          phone: app.phone
        });
        
        if (result.success) {
          toast({ title: '✅ RIDER ACTIVADO', description: `${app.userName} ya es parte de la flota.` });
          router.refresh();
        } else {
          toast({ variant: 'destructive', title: 'Error de Seguridad', description: (result as any).error || 'Error desconocido' });
        }
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Fallo Crítico', description: error.message });
      }
    });
  };

  const handleRejectRider = (app: RiderApplication) => {
    startTransition(async () => {
      try {
        const result = await rejectRiderOperation(app.id, app.userId);
        if (result.success) {
          toast({ title: 'Rider Rechazado', description: 'La solicitud fue denegada correctamente.' });
          router.refresh();
        } else {
          toast({ variant: 'destructive', title: 'Error', description: (result as any).error || 'Error desconocido' });
        }
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    });
  };

  const handleToggleCluberField = (cluberId: string, field: string, value: boolean) => {
    startTransition(async () => {
      try {
        const permissionFields = ['permitsBenefits', 'permitsShifts', 'permitsAds', 'permitsTeam', 'isCincoDos'];
        
        if (permissionFields.includes(field)) {
          await updateDoc(doc(firestore, 'users', cluberId), { [field]: value });
          const docRef = doc(firestore, 'roles_supplier', cluberId);
          await updateDoc(docRef, { [field]: deleteField() });
        } else {
          const docRef = doc(firestore, 'roles_supplier', cluberId);
          await updateDoc(docRef, { [field]: value });
        }

        toast({ title: 'Ajuste actualizado', description: `Se cambió ${field} a ${value ? 'ACTIVADO' : 'DESACTIVADO'}.` });
        router.refresh();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el ajuste.' });
      }
    });
  };

  const handleApproveComedor = (app: ComedorApplication) => {
    startTransition(async () => {
      try {
        const sanitizedAppId = app.id || '';
        const sanitizedUserId = app.userId || '';
        const firstName = app.firstName || 'Alumno';

        if (!sanitizedAppId || !sanitizedUserId) throw new Error('Missing application or userId');

        await updateDoc(doc(firestore, 'comedor_applications', sanitizedAppId), {
          status: 'approved',
          approvedAt: serverTimestamp(),
        });
        await updateDoc(doc(firestore, 'users', sanitizedUserId), {
          isCincoDos: true,
        });
        toast({ title: '✅ AFILIADO ACTIVADO', description: `${firstName} ya es parte de Cinco.Dos.` });
        router.refresh();
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo completar la afiliación.' });
      }
    });
  };

  const handleVerifyCluber = (req: SupplierRequest) => {
    startTransition(async () => {
      try {
        const result = await approveSupplierOperation(req.id, {
          userId: req.userId,
          supplierName: req.supplierName,
          category: req.category,
          address: req.address,
          commercialPhone: req.commercialPhone,
          logo: req.logo,
          fachada: req.fachada
        });

        if (result.success) {
          toast({ title: '✅ CLUBER VERIFICADO', description: `${req.supplierName} tiene sello oficial.` });
          router.refresh();
        } else {
          toast({ variant: 'destructive', title: 'Error de Verificación', description: (result as any).error || 'Error desconocido' });
        }
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error de Seguridad', description: error.message });
      }
    });
  };

  return (
    <div className="bg-transparent p-2 md:p-4 selection:bg-[#cb465a]/30">
      <div className="mb-8 mt-4 relative z-[60]">
          <Button asChild variant="ghost" className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-[#cb465a]/20 transition-all font-black uppercase text-[10px] tracking-widest gap-3">
            <Link href="/admin" className="flex items-center gap-3">
                <ChevronRight className="h-5 w-5 rotate-180" /> Volver al Panel
            </Link>
          </Button>
      </div>
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="pt-2 pb-6 px-0 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 mb-6">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#cb465a] flex items-center justify-center shadow-[0_0_30px_#cb465a]">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/10 text-white border-white/20 uppercase font-black text-[10px] tracking-[0.3em] px-4 py-1.5 rounded-full">HQ Monitor</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground uppercase tracking-tighter leading-none font-montserrat">
              CENTRO DE <br/><span className="text-[#cb465a]">VERIFICACIÓN</span>
            </h1>
            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.4em] ml-1 opacity-60">ADMINISTRACIÓN TOTAL CLUBERS & RIDERS</p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl p-5 rounded-[2.5rem] border border-white/10">
             <div className="h-12 w-12 rounded-2xl bg-[#cb465a]/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-[#cb465a] animate-pulse" />
             </div>
             <div className="pr-4">
                <p className="text-[9px] font-black text-[#cb465a] uppercase tracking-widest leading-tight">Master Center</p>
                <p className="text-xs font-bold text-foreground/80">System Active</p>
             </div>
             <div className="bg-black/5 border border-white/10 p-3 rounded-2xl flex flex-col items-center justify-center min-w-[90px]">
                <p className="text-[8px] font-black text-[#cb465a] uppercase tracking-widest mb-0.5">En Cola</p>
                <p className="text-3xl font-black text-foreground leading-none">{(applications?.length || 0) + (pendingClubers?.length || 0) + (comedorApps?.length || 0)}</p>
             </div>
          </div>
        </header>

         <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
          <TabsList className="bg-background/50 border border-white/5 p-1 rounded-2xl w-full h-auto flex flex-wrap gap-1 shadow-sm overflow-hidden">
            <TabsTrigger value="riders" className="flex-1 min-w-[100px] rounded-xl font-black uppercase text-[9px] tracking-[0.1em] data-[state=active]:bg-[#cb465a] data-[state=active]:text-white transition-all duration-500 h-11">
              Riders ({applications?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="pending-clubers" className="flex-1 min-w-[100px] rounded-xl font-black uppercase text-[9px] tracking-[0.1em] data-[state=active]:bg-[#cb465a] data-[state=active]:text-white transition-all duration-500 h-11">
              Clubers ({(pendingClubers?.length || 0)})
            </TabsTrigger>
            <TabsTrigger value="cinco-dos" className="flex-1 min-w-[100px] rounded-xl font-black uppercase text-[9px] tracking-[0.1em] data-[state=active]:bg-amber-500 data-[state=active]:text-black transition-all duration-500 h-11">
              Cinco.Dos ({comedorApps?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex-1 min-w-[100px] rounded-xl font-black uppercase text-[9px] tracking-[0.1em] data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-500 h-11">
              Turnos ({appointments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="management" className="flex-1 min-w-[100px] rounded-xl font-black uppercase text-[9px] tracking-[0.1em] data-[state=active]:bg-foreground data-[state=active]:text-background transition-all duration-500 h-11">
              Gestión Total
            </TabsTrigger>
          </TabsList>

          {/* APPOINTMENTS TAB */}
          <TabsContent value="appointments" className="space-y-10 focus-visible:outline-none">
            {isLoadingAppointments ? (
              <div className="grid gap-8">
                {[1, 2].map(i => <Skeleton className="h-48 rounded-[2.5rem]" key={i} />)}
              </div>
            ) : (!appointments || appointments.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/5">
                  <CalendarDays className="h-16 w-16 text-blue-500 mb-4 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Sin turnos registrados</p>
              </div>
            ) : (
                <div className="grid gap-6">
                    {appointments.map((apt: any) => {
                         const start = (apt.startTime as Timestamp)?.toDate();
                         return (
                            <Card key={apt.id} className="rounded-[2.5rem] border-white/5 glass-dark p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
                                <div className="absolute right-0 top-0 h-full w-1 border-r-4 border-blue-500/20" />
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                        <CalendarClock className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-xl font-black uppercase tracking-tighter text-white">{apt.userName}</h4>
                                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/40">
                                            <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full"><Building className="h-3.5 w-3.5 text-blue-500" /> {apt.supplierName || 'Punto Local'}</span>
                                            <span className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full"><Utensils className="h-3.5 w-3.5" /> {apt.serviceName}</span>
                                            <span className="text-white/60">{start?.toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} hs</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                    <Badge className={cn(
                                        "h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest border-2",
                                        apt.status === 'approved' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                        apt.status === 'rejected' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                        "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    )}>
                                        {apt.status === 'approved' ? 'Aprobado' : apt.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                    </Badge>
                                    
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                                                <Settings2 className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="glass glass-dark rounded-2xl border-white/10">
                                            <DropdownMenuItem 
                                                className="rounded-xl font-black text-[10px] uppercase tracking-widest text-green-500 hover:bg-green-500/10"
                                                onClick={async () => {
                                                    await updateDoc(doc(firestore, 'appointments', apt.id), { status: 'approved' });
                                                    toast({ title: "✅ TURNO APROBADO", description: `El turno de ${apt.userName} fue validado.` });
                                                }}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" /> Aprobar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="rounded-xl font-black text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-500/10"
                                                onClick={async () => {
                                                    await updateDoc(doc(firestore, 'appointments', apt.id), { status: 'rejected' });
                                                    toast({ title: "❌ TURNO RECHAZADO", description: `El turno de ${apt.userName} fue denegado.` });
                                                }}
                                            >
                                                <ShieldX className="h-4 w-4 mr-2" /> Rechazar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </Card>
                         )
                    })}
                </div>
            )}
          </TabsContent>

          {/* RIDERS TAB */}
          <TabsContent value="riders" className="space-y-10 focus-visible:outline-none">
            {isLoadingRiders ? (
              <div className="grid gap-8">
                {[1, 2].map(i => <Skeleton className="h-64 rounded-[2.5rem]" key={i} />)}
              </div>
            ) : (!applications || applications.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/5">
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Sin solicitudes de Riders</p>
              </div>
            ) : (
              <div className="grid gap-8">
                {applications.map((app) => (
                  <div key={app.id} className="glass-dark rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                      <div className="relative aspect-video rounded-[2rem] overflow-hidden group border border-white/10">
                        <OptimizedImage src={app.fotoRostroUrl} alt="Foto Rostro" fill className="w-full h-full" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <Button asChild size="sm" className="bg-white text-black"><a href={app.fotoRostroUrl} target="_blank">Ver Rostro</a></Button>
                        </div>
                      </div>
                      <div className="relative aspect-video rounded-[2rem] overflow-hidden group border border-white/10">
                        <OptimizedImage src={app.fotoVehiculoUrl} alt="Foto Vehículo" fill className="w-full h-full" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <Button asChild size="sm" className="bg-white text-black"><a href={app.fotoVehiculoUrl} target="_blank">Ver Vehículo</a></Button>
                        </div>
                      </div>
                    </div>
                    <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black uppercase tracking-tighter">{app.userName}</h3>
                            <p className="text-[10px] font-bold text-foreground opacity-70">Patente: {app.patente} | DNI: {app.dni}</p>
                        </div>
                        <div className="flex gap-3 shrink-0">
                            <Button variant="ghost" onClick={() => handleRejectRider(app)} disabled={isPending} className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest text-destructive hover:bg-destructive/10 shrink-0">Rechazar</Button>
                            <Button onClick={() => handleApproveRider(app)} disabled={isPending} className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest bg-green-500 hover:bg-green-600 text-white px-8 shrink-0">Aprobar</Button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* CINCO DOS TAB */}
          <TabsContent value="cinco-dos" className="space-y-10 focus-visible:outline-none">
            {isLoadingComedor ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <Skeleton className="h-48 rounded-[2.5rem]" key={i} />)}
              </div>
            ) : (!comedorApps || comedorApps.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/5">
                  <Utensils className="h-16 w-16 text-amber-500 mb-4 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Sin alumnos para Cinco.Dos</p>
              </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {comedorApps.map((app) => (
                        <Card key={app.id} className="rounded-[3rem] border-white/5 bg-background/40 backdrop-blur-xl p-8 space-y-6 hover:border-amber-500/20 transition-all shadow-premium group">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
                                        <User className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <Badge className="bg-amber-400 text-black font-black text-[8px] uppercase tracking-widest">{app.courseYear}° Año</Badge>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">{app.firstName} {app.lastName}</h3>
                                    <p className="text-[10px] font-bold text-foreground opacity-40 uppercase tracking-widest mt-1">{app.institution}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-white/60">
                                    <Phone className="h-3 w-3" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{app.phone}</span>
                                </div>
                            </div>
                            <Button
                                onClick={() => handleApproveComedor(app)}
                                disabled={isPending}
                                className="w-full h-12 rounded-2xl bg-amber-400 text-black font-black uppercase tracking-widest text-[9px] hover:bg-amber-500 transition-all border-none"
                            >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "APROBAR AFILIACIÓN"}
                            </Button>
                        </Card>
                    ))}
                </div>
            )}
          </TabsContent>

          {/* PENDING CLUBERS TAB */}
          <TabsContent value="pending-clubers" className="space-y-8 focus-visible:outline-none">
             {!pendingClubers || (pendingClubers?.length || 0) === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/5">
                    <Building className="h-16 w-16 text-[#cb465a] mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Sin comercios pendientes</p>
                </div>
             ) : (
                <div className="grid gap-6">
                {pendingClubers.map((cluber) => (
                    <Card key={cluber.id} className="rounded-[2.5rem] border-white/5 glass-dark p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-[1.5rem] bg-[#cb465a]/10 border border-[#cb465a]/20 flex items-center justify-center overflow-hidden shrink-0 relative">
                        {cluber.logo ? <OptimizedImage src={cluber.logo} alt={cluber.supplierName} fill /> : <Building className="h-10 w-10 text-[#cb465a] opacity-20" />}
                        </div>
                        <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter">{cluber.supplierName}</h3>
                        <p className="text-[10px] font-bold text-foreground opacity-70 mb-2 italic">{cluber.address}</p>
                        <Badge className="bg-[#cb465a]/10 text-[#cb465a] border-[#cb465a]/20 font-black text-[8px] uppercase tracking-widest">{cluber.category}</Badge>
                        </div>
                    </div>
                    <Button
                        onClick={() => handleVerifyCluber(cluber)}
                        disabled={isPending}
                        className="h-12 px-10 rounded-2xl bg-white text-[#000000] font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-primary hover:text-white border-2 border-white transition-all shrink-0"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "VERIFICAR COMERCIO"}
                    </Button>
                    </Card>
                ))}
                </div>
             )}
          </TabsContent>

          {/* MANAGEMENT TAB */}
          <TabsContent value="management" className="space-y-8 focus-visible:outline-none">
             <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-[#cb465a] transition-colors" />
                 <Input 
                    placeholder="BUSCAR COMERCIO POR NOMBRE O ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pl-14 rounded-2xl bg-white/5 border-white/5 focus:border-[#cb465a]/30 focus:ring-[#cb465a]/10 text-sm font-black uppercase tracking-widest placeholder:text-foreground/10"
                />
             </div>
             {isLoadingManagement ? (
                <div className="grid gap-6">
                    {[1, 2, 3].map(i => <Skeleton className="h-48 rounded-[2.5rem]" key={i} />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24">
                    {filteredManagementClubers.map((cluber) => (
                        <Card key={cluber.id} className="rounded-[3rem] border-white/5 bg-background/40 p-8 space-y-8 hover:border-[#cb465a]/20 transition-all group overflow-hidden relative">
                             {/* Decorative Background Icon */}
                             <Building className="absolute -right-10 -bottom-10 h-64 w-64 text-white/[0.02] -rotate-12 pointer-events-none group-hover:text-[#cb465a]/[0.03] transition-colors" />

                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="h-20 w-20 rounded-[1.5rem] bg-[#cb465a]/10 border border-[#cb465a]/20 flex items-center justify-center overflow-hidden shrink-0 relative">
                                        {cluber.logoUrl ? <OptimizedImage src={cluber.logoUrl} alt={cluber.name} fill /> : <Building className="h-10 w-10 text-[#cb465a] opacity-20" />}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">{cluber.name}</h3>
                                            {cluber.verified && <ShieldCheck className="h-5 w-5 text-blue-400" />}
                                            {cluber.isCincoDos && <Utensils className="h-5 w-5 text-amber-400 fill-amber-400/20" />}
                                        </div>
                                        <p className="text-[10px] font-bold text-foreground opacity-60 uppercase tracking-widest">ID: {cluber.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={cluber.verified ? "default" : "secondary"} className={cn("px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest", cluber.verified ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-white/5 text-white/40 border-white/10")}>
                                        {cluber.verified ? "Verificado" : "No Verificado"}
                                    </Badge>
                                    <Button asChild variant="ghost" size="icon" className="rounded-full hover:bg-white/5">
                                        <Link href={`/delivery/commerce/${cluber.id}`} target="_blank"><Globe className="h-4 w-4" /></Link>
                                    </Button>
                                </div>
                             </div>

                             <div className="flex items-center justify-between p-6 rounded-[2rem] bg-black/10 border border-white/5 group-hover:border-[#cb465a]/20 transition-all relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                        <Settings2 className="h-6 w-6 text-foreground/40 group-hover:text-[#cb465a] transition-colors" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-black uppercase tracking-widest">Ajustes de Operación</p>
                                        <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-[0.2em]">Configurar permisos y visibilidad</p>
                                    </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  className="h-12 px-8 rounded-xl bg-white/5 border border-white/5 hover:bg-[#cb465a] hover:text-white font-black uppercase text-[10px] tracking-widest transition-all"
                                  onClick={() => setConfigCluber(cluber)}
                                >
                                  CONFIGURAR
                                </Button>
                             </div>
                             
                             <div className="flex items-center gap-6 pt-2 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
                                    <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Active Core</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="h-3 w-3 text-white/20" />
                                    <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">System Integrated</span>
                                </div>
                             </div>
                        </Card>
                    ))}
                </div>
              )}
           </TabsContent>
         </Tabs>
       </div>

       {/* Center Config Panel (Dialog) */}
       <Dialog open={!!configCluber} onOpenChange={(open) => !open && setConfigCluber(null)}>
        <DialogContent size="2xl" className="bg-background/90 backdrop-blur-2xl border-white/10 rounded-[3rem] p-0 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.4)] selection:bg-[#cb465a]/30">
          <div className="px-12 py-10 space-y-4 border-b border-white/5 bg-background/50 backdrop-blur-xl relative z-20">
             <div className="flex items-center gap-6">
                 <div className="h-16 w-16 rounded-2xl bg-[#cb465a]/10 flex items-center justify-center border border-[#cb465a]/20 shadow-[0_0_20px_rgba(203,70,90,0.1)]">
                     <Settings2 className="h-8 w-8 text-[#cb465a]" />
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black text-[#cb465a] uppercase tracking-[0.4em] mb-1">Operaciones Centralizadas</p>
                    <DialogTitle className="text-4xl font-black italic tracking-tighter uppercase font-montserrat leading-none">
                        Configurar
                    </DialogTitle>
                    <DialogDescription className="text-xs font-bold opacity-40 uppercase tracking-[0.1em] mt-1">
                        {configCluber?.name} — ID: {configCluber?.id}
                    </DialogDescription>
                 </div>
             </div>
          </div>

          <ScrollArea className="max-h-[70vh]">
            <div className="px-12 py-10 pb-24 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
               <div className="space-y-4 md:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cb465a] ml-2 mb-2">Visibilidad & Operaciones</p>
               </div>
                  
               {configCluber && (
                 <>
                  <SideToggle 
                      icon={<Globe className="h-4 w-4" />}
                      label="Visibilidad Pública"
                      description="El comercio será visible para todos."
                      value={!!configCluber.isVisible}
                      onChange={(v) => handleToggleCluberField(configCluber.id, 'isVisible', v)}
                  />
                  <SideToggle 
                      icon={<Star className="h-4 w-4" />}
                      label="Comercio Destacado"
                      description="Prioridad en el inicio y listas."
                      value={!!configCluber.isFeatured}
                      onChange={(v) => handleToggleCluberField(configCluber.id, 'isFeatured', v)}
                  />
                  <SideToggle 
                      icon={<Truck className="h-4 w-4" />}
                      label="Servicio de Delivery"
                      description="Logística de Riders para pedidos."
                      value={!!configCluber.deliveryEnabled}
                      onChange={(v) => handleToggleCluberField(configCluber.id, 'deliveryEnabled', v)}
                  />
                  <SideToggle 
                      icon={<Megaphone className="h-4 w-4" />}
                      label="Modulo de Anuncios"
                      description="Avisos y promociones en el feed."
                      value={!!configCluber.announcementsEnabled}
                      onChange={(v) => handleToggleCluberField(configCluber.id, 'announcementsEnabled', v)}
                  />

                  <div className="pt-8 md:col-span-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cb465a] ml-2 mb-6">Marketing & Períodos</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SideToggle 
                          icon={<Gift className="h-4 w-4" />}
                          label="Verificación de Beneficios"
                          description="Permitir canje de cupones."
                          value={!!configCluber.permitsBenefits}
                          onChange={(v) => handleToggleCluberField(configCluber.id, 'permitsBenefits', v)}
                      />
                      <SideToggle 
                          icon={<CalendarClock className="h-4 w-4" />}
                          label="Sistema de Turneros"
                          description="Gestión automatizada de citas."
                          value={!!configCluber.permitsShifts}
                          onChange={(v) => handleToggleCluberField(configCluber.id, 'permitsShifts', v)}
                      />
                    </div>
                  </div>

                  <div className="pt-8 md:col-span-2">
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 ml-2 mb-6">Programas Especiales</p>
                     <CincoDosSideToggle 
                        value={!!configCluber.isCincoDos}
                        onChange={(v) => handleToggleCluberField(configCluber.id, 'isCincoDos', v)}
                     />
                  </div>
                 </>
               )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SideToggle({ icon, label, description, value, onChange }: { icon: any, label: string, description: string, value: boolean, onChange: (v: boolean) => void }) {
    return (
      <div className={cn(
        "flex items-center justify-between p-5 rounded-2xl border transition-all duration-500 group/item",
        value 
          ? "bg-[#cb465a]/5 border-[#cb465a]/20 shadow-[0_4px_20px_rgba(203,70,90,0.08)]" 
          : "bg-muted/30 border-transparent hover:bg-muted/50"
      )}>
         <div className="flex items-center gap-4 min-w-0">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-inner shrink-0",
              value ? "bg-[#cb465a] text-white scale-110" : "bg-background text-foreground/20"
            )}>
              {icon}
            </div>
            <div className="space-y-0.5 min-w-0">
               <p className={cn("text-[11px] font-black uppercase tracking-widest leading-none transition-colors", value ? "text-[#cb465a]" : "text-foreground/60")}>{label}</p>
               <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-tighter truncate">{description}</p>
            </div>
         </div>
         <Switch checked={value} onCheckedChange={onChange} className="data-[state=checked]:bg-[#cb465a]" />
      </div>
    );
}

function CincoDosSideToggle({ value, onChange }: { value: boolean, onChange: (v: boolean) => void }) {
    return (
      <div className={cn(
        "flex items-center justify-between p-6 rounded-[2.5rem] border transition-all duration-700 group/cincodos",
        value 
          ? "bg-amber-500/10 border-amber-500/30 shadow-[0_8px_30px_rgba(245,158,11,0.12)]" 
          : "bg-muted/40 border-transparent hover:bg-muted/60"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
            value ? "bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] rotate-6 scale-110" : "bg-background text-foreground/20"
          )}>
            <Utensils className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className={cn(
              "text-xs font-black uppercase tracking-[0.2em] leading-none transition-colors",
              value ? "text-amber-600" : "text-foreground/50"
            )}>Cinco Dos</span>
            <span className="text-[9px] font-bold text-foreground/30 uppercase tracking-tighter mt-1">Proyecto Social Estuclub</span>
          </div>
        </div>
        <Switch checked={value} onCheckedChange={onChange} className="data-[state=checked]:bg-amber-500" />
      </div>
    );
}
