'use client';
export const dynamic = 'force-dynamic';

import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, doc, updateDoc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { createConverter } from '@/lib/firestore-converter';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  ExternalLink, Loader2,  CheckCircle, User,
  Building, ShieldCheck, ShieldX, Fingerprint, Phone, Car, Camera,
  ChevronRight, Zap, Search, Settings2, Globe, Star, Megaphone, Truck, Utensils, Gift
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupplierProfile } from '@/types/data';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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

export default function VerifyPage() {
  const { userData, roles, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'riders' | 'pending-clubers' | 'management' | 'cinco-dos'>('riders');
  const [searchQuery, setSearchQuery] = useState('');

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

  const { data: applications, isLoading: isLoadingRiders } = useCollection<RiderApplication>(pendingRiderQuery);
  const { data: allClubers, isLoading: isLoadingManagement } = useCollection<SupplierProfile>(allClubersQuery);
  const { data: comedorApps, isLoading: isLoadingComedor } = useCollection<ComedorApplication>(pendingComedorQuery);

  const pendingClubers = useMemo(() => {
    return allClubers?.filter(c => !c.verified) || [];
  }, [allClubers]);

  const filteredManagementClubers = useMemo(() => {
    if (!searchQuery) return allClubers || [];
    return allClubers?.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  }, [allClubers, searchQuery]);

  const handleApproveRider = async (app: RiderApplication) => {
    setProcessingId(app.id);
    try {
      await updateDoc(doc(firestore, 'rider_applications', app.id), {
        status: 'approved',
        approvedAt: serverTimestamp(),
      });
      await updateDoc(doc(firestore, 'users', app.userId), {
        role: 'rider',
        isVerified: true,
        approvedAt: serverTimestamp(),
      });
      await setDoc(doc(firestore, 'roles_rider', app.userId), {
        active: true,
        userId: app.userId,
        userName: app.userName,
        email: app.email,
        assignedAt: serverTimestamp(),
      });
      toast({ title: '✅ RIDER ACTIVADO', description: `${app.userName} ya es parte de la flota.` });
    } catch (error) {
      console.error('Approve error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo completar la activación.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRider = async (app: RiderApplication) => {
    setProcessingId(app.id);
    try {
      await updateDoc(doc(firestore, 'rider_applications', app.id), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
      });
      await updateDoc(doc(firestore, 'users', app.userId), {
        role: 'rider_rejected',
      });
      toast({ title: 'Rider Rechazado', description: 'La solicitud fue denegada.' });
    } catch (error) {
      console.error('Reject error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo rechazar.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleCluberField = async (cluberId: string, field: string, value: boolean) => {
    try {
      const docRef = doc(firestore, 'roles_supplier', cluberId);
      await updateDoc(docRef, { [field]: value });
      
      // If toggling isCincoDos, also update the user document
      if (field === 'isCincoDos') {
        await updateDoc(doc(firestore, 'users', cluberId), { isCincoDos: value });
      }

      toast({ title: 'Ajuste actualizado', description: `Se cambió ${field} a ${value ? 'ACTIVADO' : 'DESACTIVADO'}.` });
    } catch (error) {
      console.error('Toggle error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el ajuste.' });
    }
  };

  const handleApproveComedor = async (app: ComedorApplication) => {
    setProcessingId(app.id);
    try {
      await updateDoc(doc(firestore, 'comedor_applications', app.id), {
        status: 'approved',
        approvedAt: serverTimestamp(),
      });
      await updateDoc(doc(firestore, 'users', app.userId), {
        isCincoDos: true,
      });
      toast({ title: '✅ AFILIADO ACTIVADO', description: `${app.firstName} ya es parte de Cinco.Dos.` });
    } catch (error) {
      console.error('Approve error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo completar la afiliación.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleVerifyCluber = async (cluberId: string, name: string) => {
    setProcessingId(cluberId);
    try {
      const docRef = doc(firestore, 'roles_supplier', cluberId);
      await updateDoc(docRef, {
        verified: true,
        verifiedAt: serverTimestamp(),
        isVisible: true // Auto visibility on verify
      });
      toast({ title: '✅ CLUBER VERIFICADO', description: `${name} tiene sello oficial.` });
    } catch (error) {
      console.error('Verify error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo verificar.' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] p-4 md:p-8 selection:bg-[#cb465a]/30">
      <div className="mb-8 mt-4 relative z-[60]">
          <Button asChild variant="ghost" className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-[#cb465a]/20 transition-all font-black uppercase text-[10px] tracking-widest gap-3">
            <Link href="/admin" className="flex items-center gap-3">
                <ChevronRight className="h-5 w-5 rotate-180" /> Volver al Panel
            </Link>
          </Button>
      </div>
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="pt-4 pb-10 px-0 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 mb-10">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#cb465a] flex items-center justify-center shadow-[0_0_30px_#cb465a]">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/10 text-white border-white/20 uppercase font-black text-[10px] tracking-[0.3em] px-4 py-1.5 rounded-full">HQ Monitor</Badge>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white uppercase tracking-tighter italic leading-[0.85] font-montserrat drop-shadow-2xl">
              CENTRO DE <br/><span className="text-[#cb465a]">VERIFICACIÓN</span>
            </h1>
            <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.6em] ml-2 opacity-60">ADMINISTRACIÓN TOTAL CLUBERS & RIDERS</p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl p-5 rounded-[2.5rem] border border-white/10">
             <div className="h-12 w-12 rounded-2xl bg-[#cb465a]/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-[#cb465a] animate-pulse" />
             </div>
             <div className="pr-6">
                <p className="text-[10px] font-black text-[#cb465a] uppercase tracking-widest leading-tight">Master Center</p>
                <p className="text-sm font-bold text-white/80">System Active</p>
             </div>
             <div className="bg-black/40 border border-[#cb465a]/30 p-5 rounded-2xl flex flex-col items-center justify-center min-w-[110px] shadow-[0_0_40px_rgba(255,0,127,0.1)]">
                <p className="text-[9px] font-black text-[#cb465a] uppercase tracking-widest mb-1">En Cola</p>
                <p className="text-4xl font-black text-white leading-none">{(applications?.length || 0) + pendingClubers.length + (comedorApps?.length || 0)}</p>
             </div>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-10">
          <TabsList className="bg-background/50 border border-white/5 p-2 rounded-3xl w-full h-auto flex flex-wrap gap-2 shadow-2xl overflow-hidden">
            <TabsTrigger value="riders" className="flex-1 min-w-[140px] rounded-2xl font-black uppercase text-[10px] tracking-[0.15em] data-[state=active]:bg-[#cb465a] data-[state=active]:text-white transition-all duration-500 h-14">
              Riders ({applications?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="pending-clubers" className="flex-1 min-w-[140px] rounded-2xl font-black uppercase text-[10px] tracking-[0.15em] data-[state=active]:bg-[#cb465a] data-[state=active]:text-white transition-all duration-500 h-14">
              Clubers ({pendingClubers.length})
            </TabsTrigger>
            <TabsTrigger value="cinco-dos" className="flex-1 min-w-[140px] rounded-2xl font-black uppercase text-[10px] tracking-[0.15em] data-[state=active]:bg-amber-500 data-[state=active]:text-black transition-all duration-500 h-14">
              Cinco.Dos ({comedorApps?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="management" className="flex-1 min-w-[140px] rounded-2xl font-black uppercase text-[10px] tracking-[0.15em] data-[state=active]:bg-white data-[state=active]:text-black transition-all duration-500 h-14">
              Gestión Total
            </TabsTrigger>
          </TabsList>

          {/* RIDERS TAB */}
          <TabsContent value="riders" className="space-y-10 focus-visible:outline-none">
            {isLoadingRiders ? (
              <div className="grid gap-8">
                {[1, 2].map(i => <Skeleton key={i} className="h-64 rounded-[2.5rem]" />)}
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
                      <div className="relative aspect-video rounded-[2rem] overflow-hidden group">
                        <img src={app.fotoRostroUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button asChild size="sm" className="bg-white text-black"><a href={app.fotoRostroUrl} target="_blank">Ver Rostro</a></Button>
                        </div>
                      </div>
                      <div className="relative aspect-video rounded-[2rem] overflow-hidden group">
                        <img src={app.fotoVehiculoUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                            <Button variant="ghost" onClick={() => handleRejectRider(app)} disabled={!!processingId} className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest text-destructive hover:bg-destructive/10 shrink-0">Rechazar</Button>
                            <Button onClick={() => handleApproveRider(app)} disabled={!!processingId} className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest bg-green-500 hover:bg-green-600 text-white px-8 shrink-0">Aprobar</Button>
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
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-[2.5rem]" />)}
              </div>
            ) : (!comedorApps || comedorApps.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/5">
                  <Utensils className="h-16 w-16 text-amber-500 mb-4 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Sin alumnos para Cinco.Dos</p>
              </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {comedorApps.map((app) => (
                        <Card key={app.id} className="rounded-[3rem] border-white/5 bg-[#000000]/40 backdrop-blur-xl p-8 space-y-6 hover:border-amber-500/20 transition-all shadow-premium group">
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
                                disabled={processingId === app.id}
                                className="w-full h-12 rounded-2xl bg-amber-400 text-black font-black uppercase tracking-widest text-[9px] hover:bg-amber-500 transition-all border-none"
                            >
                                {processingId === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "APROBAR AFILIACIÓN"}
                            </Button>
                        </Card>
                    ))}
                </div>
            )}
          </TabsContent>

          {/* PENDING CLUBERS TAB */}
          <TabsContent value="pending-clubers" className="space-y-8 focus-visible:outline-none">
             {pendingClubers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/5">
                    <Building className="h-16 w-16 text-[#cb465a] mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Sin comercios pendientes</p>
                </div>
             ) : (
                <div className="grid gap-6">
                {pendingClubers.map((cluber) => (
                    <Card key={cluber.id} className="rounded-[2.5rem] border-white/5 glass-dark p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-[1.5rem] bg-[#cb465a]/10 border border-[#cb465a]/20 flex items-center justify-center overflow-hidden shrink-0">
                        {cluber.logoUrl ? <img src={cluber.logoUrl} className="w-full h-full object-cover" /> : <Building className="h-10 w-10 text-[#cb465a] opacity-20" />}
                        </div>
                        <div>
                        <h3 className="text-xl font-black uppercase tracking-tighter">{cluber.name}</h3>
                        <p className="text-[10px] font-bold text-foreground opacity-70 mb-2 italic">{cluber.address}</p>
                        <Badge className="bg-[#cb465a]/10 text-[#cb465a] border-[#cb465a]/20 font-black text-[8px] uppercase tracking-widest">{cluber.type}</Badge>
                        </div>
                    </div>
                    <Button
                        onClick={() => handleVerifyCluber(cluber.id, cluber.name)}
                        disabled={processingId === cluber.id}
                        className="h-12 px-10 rounded-2xl bg-white text-[#000000] font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-primary hover:text-white border-2 border-white transition-all shrink-0"
                    >
                        {processingId === cluber.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "VERIFICAR COMERCIO"}
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
                    className="h-20 pl-16 rounded-[2rem] bg-white/5 border-white/5 focus:border-[#cb465a]/30 focus:ring-[#cb465a]/10 text-lg font-black uppercase tracking-widest placeholder:text-white/10"
                />
             </div>

             {isLoadingManagement ? (
                <div className="grid gap-6">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-[2.5rem]" />)}
                </div>
             ) : (
                <div className="grid gap-6">
                    {filteredManagementClubers.map((cluber) => (
                        <Card key={cluber.id} className="rounded-[3rem] border-white/5 bg-background/40 p-8 space-y-8 hover:border-[#cb465a]/20 transition-all group overflow-hidden relative">
                             {/* Decorative Background Icon */}
                             <Building className="absolute -right-10 -bottom-10 h-64 w-64 text-white/[0.02] -rotate-12 pointer-events-none group-hover:text-[#cb465a]/[0.03] transition-colors" />

                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="h-20 w-20 rounded-[1.5rem] bg-[#cb465a]/10 border border-[#cb465a]/20 flex items-center justify-center overflow-hidden shrink-0">
                                        {cluber.logoUrl ? <img src={cluber.logoUrl} className="w-full h-full object-cover" /> : <Building className="h-10 w-10 text-[#cb465a] opacity-20" />}
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

                             <div className="flex flex-wrap gap-4 items-center w-full relative z-10">
                                <ControlToggle 
                                    icon={<Globe className="h-4 w-4" />}
                                    label="Visibilidad" 
                                    value={!!cluber.isVisible} 
                                    onChange={(v) => handleToggleCluberField(cluber.id, 'isVisible', v)} 
                                />
                                <ControlToggle 
                                    icon={<Star className="h-4 w-4" />}
                                    label="Destacado" 
                                    value={!!cluber.isFeatured} 
                                    onChange={(v) => handleToggleCluberField(cluber.id, 'isFeatured', v)} 
                                />
                                <ControlToggle 
                                    icon={<Truck className="h-4 w-4" />}
                                    label="Delivery" 
                                    value={!!cluber.deliveryEnabled} 
                                    onChange={(v) => handleToggleCluberField(cluber.id, 'deliveryEnabled', v)} 
                                />
                                <ControlToggle 
                                    icon={<Megaphone className="h-4 w-4" />}
                                    label="Anuncios" 
                                    value={!!cluber.announcementsEnabled} 
                                    onChange={(v) => handleToggleCluberField(cluber.id, 'announcementsEnabled', v)} 
                                />
                                <ControlToggle 
                                    icon={<Gift className="h-4 w-4" />}
                                    label="Beneficios" 
                                    value={!!cluber.canCreateBenefits} 
                                    onChange={(v) => handleToggleCluberField(cluber.id, 'canCreateBenefits', v)} 
                                />
                                <CincoDosToggle 
                                    value={!!cluber.isCincoDos} 
                                    onChange={(v) => handleToggleCluberField(cluber.id, 'isCincoDos', v)} 
                                />
                                <div className="flex items-center justify-between p-5 rounded-[1.5rem] glass-dark border border-white/5 flex-1 min-w-[200px]">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-white/5"><Settings2 className="h-4 w-4 text-white/40" /></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Controles</span>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-10 text-[9px] font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white shrink-0" 
                                        onClick={() => window.location.href = `/admin/clubers`}
                                    >
                                        Gestionar
                                    </Button>
                                </div>
                             </div>
                        </Card>
                    ))}
                </div>
             )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ControlToggle({ icon, label, value, onChange }: { icon: any, label: string, value: boolean, onChange: (v: boolean) => void }) {
    return (
        <div className={cn(
            "flex items-center justify-between p-5 rounded-[1.5rem] transition-all border",
            value ? "bg-[#cb465a]/10 border-[#cb465a]/20" : "bg-white/5 border-white/5 opacity-60"
        )}>
            <div className="flex items-center gap-3 text-white/80">
                <div className={cn("p-2.5 rounded-xl transition-colors", value ? "bg-[#cb465a]/20 text-[#cb465a]" : "bg-white/5 text-white/40")}>
                    {icon}
                </div>
                <Label className="text-[10px] font-black uppercase tracking-widest cursor-pointer leading-none">{label}</Label>
            </div>
            <Switch checked={value} onCheckedChange={onChange} className="data-[state=checked]:bg-[#cb465a]" />
        </div>
    );
}

function CincoDosToggle({ value, onChange }: { value: boolean, onChange: (v: boolean) => void }) {
    return (
        <div className={cn(
            "flex items-center justify-between p-5 rounded-[1.5rem] transition-all duration-500 border",
            value 
                ? "bg-gradient-to-br from-amber-400/20 to-[#cb465a]/20 border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.1)]" 
                : "bg-white/5 border-white/5 opacity-40 grayscale"
        )}>
            <div className="flex items-center gap-3">
                <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                    value ? "bg-amber-400 shadow-[0_0_15px_#fbbf24] rotate-6" : "bg-white/5"
                )}>
                    <Utensils className={cn("h-5 w-5", value ? "text-black" : "text-white/20")} />
                </div>
                <div>
                     <Label className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em] leading-none block",
                        value ? "text-amber-400" : "text-white/40"
                    )}>Cinco Dos</Label>
                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">Proyecto Social</span>
                </div>
            </div>
            <Switch checked={value} onCheckedChange={onChange} className="data-[state=checked]:bg-amber-400" />
        </div>
    );
}


