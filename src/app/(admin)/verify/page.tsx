'use client';

import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { createConverter } from '@/lib/firestore-converter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  ExternalLink, Loader2, CheckCircle, XCircle, Bike, AlertTriangle,
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
  const { userData, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'riders' | 'clubers'>('riders');

  // Only admin access
  if (!isUserLoading && userData?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md text-center rounded-[2rem]">
          <CardContent className="pt-10 pb-8 space-y-4">
            <ShieldX className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-black uppercase tracking-tighter">Acceso Denegado</h1>
            <p className="text-sm text-muted-foreground">No tenés permisos de administrador.</p>
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
      // 1. Update rider application
      const appRef = doc(firestore, 'rider_applications', app.id);
      await updateDoc(appRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
      });

      // 2. Update user role to 'rider' + activate subscription
      const userRef = doc(firestore, 'users', app.userId);
      await updateDoc(userRef, {
        role: 'rider',
        subscriptionStatus: 'active',
        approvedAt: serverTimestamp(),
      });

      toast({ title: '✅ Rider Aprobado', description: `${app.userName} ya puede recibir pedidos.` });
    } catch (error) {
      console.error('Approve error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo aprobar.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (app: RiderApplication) => {
    setProcessingId(app.id);
    try {
      const appRef = doc(firestore, 'rider_applications', app.id);
      await updateDoc(appRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
      });

      const userRef = doc(firestore, 'users', app.userId);
      await updateDoc(userRef, {
        role: 'rider_rejected',
      });

      toast({ title: 'Rider Rechazado', description: `${app.userName} fue rechazado.` });
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
      toast({ title: '✅ Cluber Verificado', description: `${cluber.name} ya tiene el sello de confianza.` });
    } catch (error) {
      console.error('Verify error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo verificar el cluber.' });
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
    <div className="min-h-screen bg-background p-6 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Verificaciones</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Panel de Aprobación de Riders</p>
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="flex gap-3">
          <Badge variant="outline" className="font-black text-xs px-4 py-2 rounded-xl">
            <Bike className="h-3.5 w-3.5 mr-1.5" />
            {applications?.length || 0} Pendientes
          </Badge>
        </div>

        {/* Tabs System */}
        <Tabs defaultValue="riders" onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl w-full">
            <TabsTrigger value="riders" className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all py-3">
              Riders ({applications?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="clubers" className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all py-3">
              Clubers ({pendingClubers?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="riders" className="space-y-4 focus-visible:outline-none">
            {/* Loading */}
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-48 rounded-2xl" />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && (!applications || applications.length === 0) && (
              <Card className="rounded-2xl text-center">
                <CardContent className="pt-12 pb-10 space-y-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto opacity-40" />
                  <p className="text-sm font-bold text-muted-foreground">No hay riders pendientes</p>
                </CardContent>
              </Card>
            )}

            {applications?.map((app) => (
              <Card key={app.id} className="rounded-2xl border-cyan-500/10 overflow-hidden">
                <CardContent className="p-0">
                  {/* Top: Info */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-black uppercase tracking-tight">{app.userName}</h3>
                        <div className="flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                          <span className="flex items-center gap-1"><Fingerprint className="h-3 w-3" /> {app.dni}</span>
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {app.phone}</span>
                          <span className="flex items-center gap-1"><Car className="h-3 w-3" /> {app.patente}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/60">
                          <Mail className="h-3 w-3" /> {app.email}
                        </div>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-black text-[8px] uppercase tracking-widest">
                        Pendiente
                      </Badge>
                    </div>

                    {app.ddjjAntecedentes && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                        <ShieldCheck className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-green-500">DDJJ Antecedentes ✓</span>
                      </div>
                    )}
                  </div>

                  {/* Photos */}
                  <div className="grid grid-cols-2 gap-px bg-border">
                    <a href={app.fotoRostroUrl || '#'} target="_blank" rel="noopener noreferrer" className="bg-card p-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors">
                      <Camera className="h-6 w-6 text-cyan-500" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Rostro</span>
                      {app.fotoRostroUrl ? (
                        <span className="text-[8px] font-bold text-cyan-500 flex items-center gap-1"><ExternalLink className="h-2.5 w-2.5" /> Ver en Drive</span>
                      ) : (
                        <span className="text-[8px] font-bold text-destructive">No disponible</span>
                      )}
                    </a>
                    <a href={app.fotoVehiculoUrl || '#'} target="_blank" rel="noopener noreferrer" className="bg-card p-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors">
                      <Car className="h-6 w-6 text-cyan-500" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Vehículo</span>
                      {app.fotoVehiculoUrl ? (
                        <span className="text-[8px] font-bold text-cyan-500 flex items-center gap-1"><ExternalLink className="h-2.5 w-2.5" /> Ver en Drive</span>
                      ) : (
                        <span className="text-[8px] font-bold text-destructive">No disponible</span>
                      )}
                    </a>
                  </div>

                  {/* Actions */}
                  <div className="p-4 flex gap-3 border-t">
                    <Button
                      onClick={() => handleApprove(app)}
                      disabled={processingId === app.id}
                      className="flex-1 h-12 rounded-xl bg-green-500 text-white font-black uppercase tracking-widest text-[10px] hover:bg-green-400 transition-all"
                    >
                      {processingId === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1.5" /> Aprobar</>}
                    </Button>
                    <Button
                      onClick={() => handleReject(app)}
                      disabled={processingId === app.id}
                      variant="outline"
                      className="flex-1 h-12 rounded-xl border-destructive/30 text-destructive font-black uppercase tracking-widest text-[10px] hover:bg-destructive/10 transition-all"
                    >
                      <XCircle className="h-4 w-4 mr-1.5" /> Rechazar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="clubers" className="space-y-4 focus-visible:outline-none">
            {isLoadingClubers && (
              <div className="space-y-4">
                {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
              </div>
            )}

            {!isLoadingClubers && (!pendingClubers || pendingClubers.length === 0) && (
              <Card className="rounded-2xl text-center">
                <CardContent className="pt-12 pb-10 space-y-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto opacity-40" />
                  <p className="text-sm font-bold text-muted-foreground">No hay clubers pendientes</p>
                </CardContent>
              </Card>
            )}

            {pendingClubers?.map((cluber) => (
              <Card key={cluber.id} className="rounded-2xl border-primary/10 overflow-hidden">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center overflow-hidden">
                      {cluber.logoUrl ? <img src={cluber.logoUrl} className="w-full h-full object-cover" /> : <Building className="h-6 w-6 text-primary opacity-20" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-tight">{cluber.name}</h3>
                      <p className="text-[10px] font-bold text-muted-foreground italic">{cluber.address}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary">{cluber.type}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleVerifyCluber(cluber)}
                      disabled={processingId === cluber.id}
                      className="h-10 px-6 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20"
                    >
                      {processingId === cluber.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verificar Local"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
