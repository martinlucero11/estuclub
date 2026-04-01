'use client';

import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { createConverter } from '@/lib/firestore-converter';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  ExternalLink, Loader2,  CheckCircle, XCircle, Bike, AlertTriangle, User,
  Mail, Building, ShieldCheck, ShieldX, Fingerprint, Phone, Car, Camera
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupplierProfile } from '@/types/data';

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

export default function VerifyPage() {
  const { userData, roles, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'riders' | 'clubers'>('riders');

  const isAdmin = roles.includes('admin');

  // ── ADMIN OVERLORD BYPASS ────────────────────────────────
  if (!isUserLoading && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6 selection:bg-[#FF007F]/30">
        <Card className="w-full max-w-md text-center rounded-[3rem] border-none shadow-[0_0_50px_rgba(255,0,127,0.1)] bg-slate-900/50 backdrop-blur-xl">
          <CardContent className="pt-16 pb-12 space-y-6">
            <div className="h-20 w-20 rounded-[2rem] bg-[#FF007F]/10 flex items-center justify-center mx-auto border border-[#FF007F]/20">
               <ShieldX className="h-10 w-10 text-[#FF007F]" />
            </div>
            <div className="space-y-2">
               <h1 className="text-3xl font-black uppercase tracking-tighter text-white font-montserrat">ACCESO DENEGADO</h1>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                 Esta área está restringida a personal de <br/> <span className="text-[#FF007F]">Estuclub Central</span>
               </p>
            </div>
            <Button asChild className="h-14 px-10 rounded-2xl bg-[#FF007F] text-white font-black uppercase tracking-widest hover:bg-[#FF007F]/90 transition-all shrink-0">
               <Link href="/">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'rider_applications').withConverter(createConverter<RiderApplication>()),
      where('status', '==', 'pending')
    );
  }, [firestore]);

  const { data: applications, isLoading } = useCollection<RiderApplication>(pendingQuery);

  const handleApprove = async (app: RiderApplication) => {
    setProcessingId(app.id);
    try {
      // 1. Update rider application status
      await updateDoc(doc(firestore, 'rider_applications', app.id), {
        status: 'approved',
        approvedAt: serverTimestamp(),
      });

      // 2. PROMOTE TO RIDER & CREATE ROLE ENTRY
      await updateDoc(doc(firestore, 'users', app.userId), {
        role: 'rider',
        isVerified: true,
        subscriptionStatus: 'active',
        approvedAt: serverTimestamp(),
      });

      // Create the roles_rider document so isRider() rules pass
      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(firestore, 'roles_rider', app.userId), {
        userId: app.userId,
        userName: app.userName,
        email: app.email,
        assignedAt: serverTimestamp()
      });

      toast({ title: '✅ RIDER ACTIVADO', description: `${app.userName} ya es parte de la flota oficial.` });
    } catch (error) {
      console.error('Approve error:', error);
      toast({ variant: 'destructive', title: 'Error Fatídico', description: 'No se pudo completar la activación.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (app: RiderApplication) => {
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

  const handleVerifyCluber = async (cluber: SupplierProfile) => {
    setProcessingId(cluber.id);
    try {
      const docRef = doc(firestore, 'roles_supplier', cluber.id);
      await updateDoc(docRef, {
        verified: true,
        verifiedAt: serverTimestamp()
      });
      toast({ title: '✅ CLUBER VERIFICADO', description: `${cluber.name} tiene sello oficial.` });
    } catch (error) {
      console.error('Verify error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo verificar.' });
    } finally {
      setProcessingId(null);
    }
  };

  const pendingClubersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()),
      where('verified', '!=', true)
    );
  }, [firestore]);

  const { data: pendingClubers, isLoading: isLoadingClubers } = useCollection<SupplierProfile>(pendingClubersQuery);

  return (
    <div className="min-h-screen bg-[#050505] p-4 md:p-8 selection:bg-[#FF007F]/30 overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* ✨ PREMIUM HEADER ✨ */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 py-10 opacity-in">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
               <div className="h-14 w-1 flex bg-[#FF007F] rounded-full shadow-[0_0_20px_rgba(255,0,127,0.5)]" />
               <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter leading-none text-white font-montserrat italic">
                 CONTROL <span className="text-[#FF007F]">CENTRAL</span>
               </h1>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] ml-6">SISTEMA INTEGRAL DE VERIFICACIÓN</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-900/50 backdrop-blur-md border border-[#FF007F]/30 p-6 rounded-[2.5rem] flex flex-col items-center justify-center min-w-[140px] shadow-[0_0_30px_rgba(255,0,127,0.05)]">
               <p className="text-[8px] font-black text-[#FF007F] uppercase tracking-widest mb-1">Pendientes</p>
               <p className="text-4xl font-black text-white leading-none">{(applications?.length || 0) + (pendingClubers?.length || 0)}</p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="riders" onValueChange={(v: any) => setActiveTab(v)} className="space-y-10">
          <TabsList className="bg-slate-900/50 border border-white/5 p-2 rounded-3xl w-full max-w-lg h-20 shadow-2xl">
            <TabsTrigger value="riders" className="flex-1 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] data-[state=active]:bg-[#FF007F] data-[state=active]:text-white transition-all duration-500 h-full">
              Riders
            </TabsTrigger>
            <TabsTrigger value="clubers" className="flex-1 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] data-[state=active]:bg-[#FF007F] data-[state=active]:text-white transition-all duration-500 h-full">
            Clubers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="riders" className="space-y-10 focus-visible:outline-none">
            {isLoading ? (
              <div className="grid gap-8">
                {[1, 2].map(i => <Skeleton key={i} className="h-[500px] rounded-[3rem]" />)}
              </div>
            ) : (!applications || applications.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/5">
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">No hay solicitudes pendientes</p>
              </div>
            ) : (
              <div className="grid gap-12">
                {applications.map((app) => (
                  <div key={app.id} className="bg-card rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Identification Gallery Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
                      {/* Document Side 1: Face */}
                      <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden group">
                        <img 
                          src={app.fotoRostroUrl} 
                          alt="Selfie" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-8 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Validación Facial</p>
                            <h4 className="text-white font-black uppercase text-sm tracking-tight">{app.userName}</h4>
                          </div>
                        </div>
                        <a href={app.fotoRostroUrl} target="_blank" className="absolute top-6 right-8 p-3 rounded-full bg-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="h-4 w-4 text-white" />
                        </a>
                      </div>

                      {/* Document Side 2: Vehicle/ID */}
                      <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden group">
                        <img 
                          src={app.fotoVehiculoUrl} 
                          alt="Vehicle" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-8 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                            <Car className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">Vehículo Registrado</p>
                            <h4 className="text-white font-black uppercase text-sm tracking-tight">PATENTE: {app.patente}</h4>
                          </div>
                        </div>
                        <a href={app.fotoVehiculoUrl} target="_blank" className="absolute top-6 right-8 p-3 rounded-full bg-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="h-4 w-4 text-white" />
                        </a>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-10 flex flex-col md:flex-row gap-10 items-center justify-between">
                      <div className="flex-1 grid grid-cols-2 gap-8 w-full md:w-auto">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Documento de Identidad</p>
                          <p className="font-bold text-xl tracking-tight">{app.dni}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Contacto Directo</p>
                          <p className="font-bold text-xl tracking-tight">{app.phone}</p>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Dirección de Email</p>
                          <p className="font-bold text-sm tracking-tight opacity-70">{app.email}</p>
                        </div>
                      </div>

                      <div className="flex gap-4 w-full md:w-auto">
                        <Button 
                          onClick={() => handleReject(app)}
                          disabled={!!processingId}
                          variant="outline" 
                          className="h-20 px-8 rounded-[1.5rem] border-destructive/20 text-destructive font-black uppercase tracking-widest text-xs hover:bg-destructive/10 transition-all flex-1 md:flex-none"
                        >
                          {processingId === app.id ? <Loader2 className="h-6 w-6 animate-spin" /> : "Rechazar"}
                        </Button>
                        <Button 
                          onClick={() => handleApprove(app)}
                          disabled={!!processingId}
                          className="h-20 px-12 rounded-[1.5rem] bg-green-500 hover:bg-green-400 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-green-500/20 active:scale-95 transition-all flex-1 md:flex-none"
                        >
                          {processingId === app.id ? <Loader2 className="h-6 w-6 animate-spin" /> : "APROBAR RIDER"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="clubers" className="space-y-6 focus-visible:outline-none">
             {/* Clubers implementation remains similar but with updated styling */}
             {pendingClubers?.map((cluber) => (
                <Card key={cluber.id} className="rounded-[2.5rem] border-white/5 bg-card/50 backdrop-blur-sm p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-[1.5rem] bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                      {cluber.logoUrl ? <img src={cluber.logoUrl} className="w-full h-full object-cover" /> : <Building className="h-10 w-10 text-primary opacity-20" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">{cluber.name}</h3>
                      <p className="text-xs font-bold text-muted-foreground opacity-70 italic mb-2">{cluber.address}</p>
                      <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-[8px] uppercase tracking-widest">{cluber.type}</Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleVerifyCluber(cluber)}
                    disabled={processingId === cluber.id}
                    className="h-16 px-10 rounded-2xl bg-white text-primary font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-primary/10 hover:text-white border-2 border-white transition-all"
                  >
                    {processingId === cluber.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "VERIFICAR COMERCIO"}
                  </Button>
                </Card>
             ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
