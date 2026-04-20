'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { 
  Truck, 
  Search, 
  ShieldCheck, 
  Zap, 
  Loader2, 
  XCircle,
  Hash,
  Bike,
  Navigation,
  FileText,
  Crown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/admin-context';

export default function RiderManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { setImpersonatedUserId } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingApplication, setVerifyingApplication] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Fetch all riders directly from users collection (SSoT)
  const ridersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'),
      where('role', '==', 'rider')
    );
  }, [firestore]);

  const { data: rawRiders, isLoading } = useCollection(ridersQuery);

  // 2. Fetch Pending Applications
  const applicationsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'rider_applications'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: applications, isLoading: isLoadingApps } = useCollection(applicationsQuery);

  // 3. Sort and filter in memory to avoid missing documents without createdAt
  const riders = useMemo(() => {
    if (!rawRiders) return [];
    return [...rawRiders].sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
    });
  }, [rawRiders]);

  const filteredRiders = useMemo(() => {
    if (!searchQuery) return riders || [];
    const lowerQuery = searchQuery.toLowerCase();
    return riders?.filter((r: any) => 
      r.id.toLowerCase().includes(lowerQuery) ||
      (r.username || '').toLowerCase().includes(lowerQuery) ||
      (r.vehicleType || '').toLowerCase().includes(lowerQuery)
    ) || [];
  }, [riders, searchQuery]);

  const handleToggleVerify = async (riderId: string, value: boolean) => {
    try {
      const docRef = doc(firestore!, 'users', riderId);
      await updateDoc(docRef, { isVerified: value });
      
      toast({ 
        title: value ? 'Rider Verificado' : 'Verificación Removida', 
        description: `El rider ahora tiene acceso ${value ? 'total' : 'restringido'} a pedidos.` 
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado.' });
    }
  };

  const handleToggleBonus = async (riderId: string, value: boolean) => {
      try {
        const docRef = doc(firestore!, 'users', riderId);
        await updateDoc(docRef, { isMembershipWaived: value });
        
        toast({ 
            title: value ? 'Bonificación Activada' : 'Bonificación Removida', 
            description: value ? 'El rider ahora tiene membresía gratuita (Acceso VIP).' : 'El rider ya no cuenta con bonificación de membresía.'
        });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la bonificación.' });
      }
  };

  if (isLoading || isLoadingApps) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin opacity-40 mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground animate-pulse">Sincronizando Flota...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative w-full max-w-xl group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="BUSCAR RIDER POR ID, USERNAME O VEHÍCULO..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-16 pl-16 rounded-[2rem] bg-card/50 border-black/5 dark:border-white/5 focus:border-primary/40 text-sm font-bold uppercase tracking-widest transition-all placeholder:text-black/20 dark:placeholder:text-white/20"
          />
        </div>
        <div className="flex gap-4">
            <Badge variant="outline" className="text-foreground border-black/10 dark:border-white/5 px-4 py-2 rounded-xl flex items-center gap-2">
                <Hash className="h-3 w-3" />
                {riders?.length || 0} ACTIVOS
            </Badge>
            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
                <FileText className="h-3 w-3" />
                {applications?.length || 0} PENDIENTES
            </Badge>
        </div>
      </div>

      <Tabs defaultValue="riders" className="space-y-8">
        <TabsList className="bg-card/30 border border-white/5 p-1 rounded-2xl h-16 w-full max-w-md">
            <TabsTrigger value="riders" className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-500 data-[state=active]:text-white gap-2">
                <Bike className="h-4 w-4" />
                Flota Activa
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-amber-500 data-[state=active]:text-white gap-2">
                <FileText className="h-4 w-4" />
                Solicitudes
            </TabsTrigger>
        </TabsList>

        <TabsContent value="riders" className="mt-0 animate-in fade-in duration-500">

      {/* Rider List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredRiders.map((rider: any) => (
          <Card key={rider.id || rider.uid} className="bg-card/30 border-black/5 dark:border-white/5 rounded-[3rem] overflow-hidden group hover:bg-card/40 transition-all duration-500 shadow-premium border-none ring-1 ring-black/5 dark:ring-white/5 relative">
            <CardContent className="p-10 space-y-8 relative z-10">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-2xl bg-background flex items-center justify-center border border-white/10 group-hover:border-primary/40 transition-all shadow-inner">
                            {rider.vehicleType === 'bike' ? <Bike className="h-8 w-8 text-primary" /> : <Truck className="h-8 w-8 text-primary" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="font-black italic tracking-tighter uppercase font-montserrat text-xl truncate max-w-[200px]">
                                    {rider.displayName || 
                                     (rider.firstName ? `${rider.firstName} ${rider.lastName || ''}` : rider.username) || 
                                     `ID: ${(rider.id || rider.uid || '').slice(0, 8)}`}
                                </h3>
                                {rider.isVerified ? <ShieldCheck className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500/30" />}
                            </div>
                            <p className="text-[10px] font-black uppercase text-foreground/40 tracking-[0.3em] leading-none mt-2">
                                {rider.vehicleType || 'Rider Registrado'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button 
                            variant="ghost" size="icon" 
                            className="h-12 w-12 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:bg-primary/20 hover:text-primary transition-all shrink-0 shadow-lg"
                            onClick={() => {
                                toast({ title: 'Cargando EstuSim', description: `Impersonando Rider ${(rider.id || rider.uid || '').slice(0, 8)}` });
                                setImpersonatedUserId(rider.id || rider.uid);
                            }}
                        >
                            <Zap className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className={cn(
                        "p-5 rounded-[2rem] border transition-all flex flex-col justify-between gap-4",
                        rider.isVerified ? "bg-emerald-500/10 border-emerald-500/20 shadow-[0_4px_20px_rgba(16,185,129,0.05)]" : "bg-black/5 dark:bg-white/5 border-transparent opacity-40"
                    )}>
                        <div className="flex items-center gap-3">
                            <ShieldCheck className={cn("h-5 w-5", rider.isVerified ? "text-emerald-500" : "text-foreground/20")} />
                            <span className={cn("text-[9px] font-black uppercase tracking-widest", rider.isVerified ? "text-foreground" : "text-foreground/40")}>Verificado</span>
                        </div>
                        <Switch checked={!!rider.isVerified} onCheckedChange={(v) => handleToggleVerify(rider.id || rider.uid, v)} />
                    </div>

                    <div className={cn(
                        "p-5 rounded-[2rem] border transition-all flex flex-col justify-between gap-4",
                        rider.isMembershipWaived ? "bg-amber-500/10 border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.1)]" : "bg-black/5 dark:bg-white/5 border-transparent"
                    )}>
                        <div className="flex items-center gap-3">
                            <Crown className={cn("h-5 w-5", rider.isMembershipWaived ? "text-amber-500" : "text-foreground/20")} />
                            <span className={cn("text-[9px] font-black uppercase tracking-widest", rider.isMembershipWaived ? "text-amber-500" : "text-foreground/40")}>Bonificado</span>
                        </div>
                        <Switch 
                            checked={!!rider.isMembershipWaived} 
                            onCheckedChange={(v) => handleToggleBonus(rider.id || rider.uid, v)}
                            className="data-[state=checked]:bg-amber-500"
                        />
                    </div>

                    <div className={cn(
                        "p-5 rounded-[2rem] border transition-all flex flex-col justify-between gap-4",
                        rider.isOnline ? "bg-primary/10 border-primary/20" : "bg-black/5 dark:bg-white/5 border-transparent opacity-40"
                    )}>
                        <div className="flex items-center gap-3">
                            <Zap className={cn("h-5 w-5", rider.isOnline ? "text-primary" : "text-foreground/20")} />
                            <span className={cn("text-[9px] font-black uppercase tracking-widest", rider.isOnline ? "text-foreground" : "text-foreground/40")}>{rider.isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                        <div className={cn("h-2.5 w-2.5 rounded-full", rider.isOnline ? "bg-primary animate-pulse" : "bg-foreground/10")} />
                    </div>
                </div>

                <div className="pt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <Button variant="ghost" className="h-10 px-0 text-xs font-bold text-foreground hover:text-primary uppercase italic tracking-widest flex items-center gap-3 transition-colors">
                        <FileText className="h-4 w-4" />
                        <span>Ver Documentación</span>
                    </Button>
                    <Badge variant="outline" className="text-[9px] font-black border-black/10 dark:border-white/10 rounded-xl px-4 py-1.5 bg-background/50">NODO CENTRAL</Badge>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>
        </TabsContent>

        <TabsContent value="applications" className="mt-0 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {applications?.map((app: any) => (
                   <Card key={app.id} className="bg-card/30 border-none ring-1 ring-white/5 rounded-[3rem] overflow-hidden shadow-premium">
                       <CardContent className="p-10 space-y-8">
                           <div className="flex justify-between items-start">
                               <div className="flex items-center gap-5">
                                   <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                       <FileText className="h-8 w-8 text-amber-500" />
                                   </div>
                                   <div>
                                       <h3 className="font-black italic tracking-tighter uppercase font-montserrat text-xl truncate">{app.userName}</h3>
                                       <p className="text-[10px] font-black uppercase text-foreground/40 tracking-[0.3em] leading-none mt-2">DNI: {app.dni} • PATENTE: {app.patente}</p>
                                   </div>
                               </div>
                               <Badge className="bg-amber-500 text-white font-black uppercase text-[8px] tracking-widest px-3 py-1 rounded-lg">PENDIENTE</Badge>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                   <p className="text-[8px] font-black opacity-20 uppercase tracking-widest">Email</p>
                                   <p className="text-xs font-bold uppercase truncate">{app.email}</p>
                               </div>
                               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                   <p className="text-[8px] font-black opacity-20 uppercase tracking-widest">Celular</p>
                                   <p className="text-xs font-bold uppercase truncate">{app.phone}</p>
                               </div>
                           </div>

                           <Button 
                                onClick={() => setVerifyingApplication(app)}
                                className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-3"
                           >
                               <ShieldCheck className="h-4 w-4" />
                               Verificar Documentación
                           </Button>
                       </CardContent>
                   </Card>
               ))}
               {applications?.length === 0 && (
                   <div className="col-span-full py-20 text-center opacity-30">
                       <Zap className="h-12 w-12 mx-auto mb-4" />
                       <p className="font-black uppercase text-xs tracking-widest">Sin solicitudes pendientes</p>
                   </div>
               )}
           </div>
        </TabsContent>
      </Tabs>

      {/* Verification Dialog */}
      <Dialog open={!!verifyingApplication} onOpenChange={(o) => !o && setVerifyingApplication(null)}>
          <DialogContent className="bg-card border-none rounded-[3rem] p-0 max-w-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <div className="p-10 border-b border-white/5 bg-background/50 flex justify-between items-center">
                  <DialogHeader className="flex flex-row items-center gap-6">
                      <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <Truck className="h-8 w-8 text-amber-500" />
                      </div>
                      <div className="text-left">
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-1">Onboarding Rider</p>
                          <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase font-montserrat leading-none">
                              {verifyingApplication?.userName}
                          </DialogTitle>
                          <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mt-1">DNI: {verifyingApplication?.dni} • Patente: {verifyingApplication?.patente}</p>
                      </div>
                  </DialogHeader>
              </div>

              <ScrollArea className="max-h-[60vh]">
                  <div className="p-10 space-y-10">
                      <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-4">
                              <Label className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] ml-2">Foto Rostro (KYC)</Label>
                              <div className="rounded-3xl border border-white/10 overflow-hidden bg-black/40 aspect-[3/4] relative group">
                                  <img src={verifyingApplication?.rostroUrl} className="w-full h-full object-cover" alt="Rostro" />
                                  <a href={verifyingApplication?.rostroUrl} target="_blank" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><Zap className="h-8 w-8 text-white" /></a>
                              </div>
                          </div>
                          <div className="space-y-4">
                              <Label className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] ml-2">Vehículo & Patente</Label>
                              <div className="rounded-3xl border border-white/10 overflow-hidden bg-black/40 aspect-[3/4] relative group">
                                  <img src={verifyingApplication?.vehiculoUrl} className="w-full h-full object-cover" alt="Vehiculo" />
                                  <a href={verifyingApplication?.vehiculoUrl} target="_blank" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><Zap className="h-8 w-8 text-white" /></a>
                              </div>
                          </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Protocolo de Seguridad</p>
                          <p className="text-xs font-medium leading-relaxed opacity-60">Verifica que la patente coincida con el registro y que el rostro del aplicante sea claramente visible sin accesorios que dificulten la identificación (Casco, Anteojos oscuros).</p>
                      </div>
                  </div>
              </ScrollArea>

              <DialogFooter className="p-10 pt-0 flex gap-4">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-red-500/20 text-red-500 hover:bg-red-500/10"
                    disabled={isUpdating}
                    onClick={async () => {
                        if (!firestore || !verifyingApplication) return;
                        setIsUpdating(true);
                        try {
                            await updateDoc(doc(firestore, 'rider_applications', verifyingApplication.id), { status: 'rejected' });
                            toast({ title: 'Solicitud Rechazada' });
                            setVerifyingApplication(null);
                        } finally { setIsUpdating(false); }
                    }}
                  >
                      <XCircle className="h-4 w-4 mr-2" /> Rechazar
                  </Button>
                  <Button 
                    className="flex-1 h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/20"
                    disabled={isUpdating}
                    onClick={async () => {
                        if (!firestore || !verifyingApplication) return;
                        setIsUpdating(true);
                        try {
                            // 1. Update Application
                            await updateDoc(doc(firestore, 'rider_applications', verifyingApplication.id), { status: 'approved' });
                            // 2. Promote user to rider role and verify
                            await updateDoc(doc(firestore, 'users', verifyingApplication.userId), {
                                role: 'rider',
                                isVerified: true,
                                mp_linked: true // Assuming they linked or we waive it
                            });
                            
                            toast({ title: '✅ RIDER APROBADO', description: 'El usuario ya puede operar en la plataforma.' });
                            setVerifyingApplication(null);
                        } finally { setIsUpdating(false); }
                    }}
                  >
                      <ShieldCheck className="h-4 w-4 mr-2" /> Aprobar Rider
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
