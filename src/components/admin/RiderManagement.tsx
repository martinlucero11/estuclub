'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Truck, 
  Search, 
  ShieldCheck, 
  MapPin, 
  Zap, 
  Edit3, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Hash,
  Bike,
  Navigation,
  FileText
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/admin-context';

export default function RiderManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { setImpersonatedUserId } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch all riders
  const ridersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'roles_rider'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: riders, isLoading } = useCollection(ridersQuery);

  const filteredRiders = useMemo(() => {
    if (!searchQuery) return riders || [];
    const lowerQuery = searchQuery.toLowerCase();
    return riders?.filter((r: any) => 
      r.id.toLowerCase().includes(lowerQuery) ||
      r.vehicleType?.toLowerCase().includes(lowerQuery)
    ) || [];
  }, [riders, searchQuery]);

  const handleToggleVerify = async (riderId: string, value: boolean) => {
    try {
      const docRef = doc(firestore!, 'roles_rider', riderId);
      await updateDoc(docRef, { isVerified: value });
      
      toast({ 
        title: value ? 'Rider Verificado' : 'Verificación Removida', 
        description: `El rider ahora tiene acceso ${value ? 'total' : 'restringido'} a pedidos.` 
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado.' });
    }
  };

  if (isLoading) {
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
            placeholder="BUSCAR RIDER POR ID O VEHÍCULO..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-16 pl-16 rounded-[2rem] bg-card/50 border-white/5 focus:border-primary/40 text-sm font-bold uppercase tracking-widest transition-all placeholder:text-black/20 dark:placeholder:text-white/20"
          />
        </div>
        <div className="flex gap-4">
            <Badge variant="outline" className="text-foreground border-white/5 px-4 py-2 rounded-xl flex items-center gap-2">
                <Hash className="h-3 w-3" />
                {riders?.length || 0} RIDERS
            </Badge>
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 rounded-xl flex items-center gap-2">
                <Navigation className="h-3 w-3" />
                {riders?.filter((r: any) => r.isOnline).length || 0} EN LÍNEA
            </Badge>
        </div>
      </div>

      {/* Rider List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRiders.map((rider: any) => (
          <Card key={rider.id} className="bg-card/30 border-white/5 rounded-[2.5rem] overflow-hidden group hover:bg-card/50 transition-all duration-500 shadow-premium border-none ring-1 ring-white/5 relative">
            <CardContent className="p-8 space-y-8 relative z-10">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-background flex items-center justify-center border border-white/10 group-hover:border-primary/40 transition-colors shadow-inner">
                            {rider.vehicleType === 'bike' ? <Bike className="h-6 w-6 text-primary" /> : <Truck className="h-6 w-6 text-primary" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black italic tracking-tighter uppercase font-montserrat text-lg">ID: {rider.id.slice(0, 8)}</h3>
                                {rider.isVerified ? <ShieldCheck className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500/30" />}
                            </div>
                            <p className="text-[10px] font-black uppercase text-foreground tracking-widest leading-none mt-1">{rider.vehicleType || 'Motocicleta'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button 
                            variant="ghost" size="icon" 
                            className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 hover:bg-primary/20 hover:text-primary transition-all shrink-0"
                            onClick={() => {
                                toast({ title: 'Cargando EstuSim', description: `Impersonando Rider ${rider.id.slice(0, 8)}` });
                                setImpersonatedUserId(rider.id);
                            }}
                        >
                            <Zap className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className={cn(
                        "p-4 rounded-2xl border transition-all flex items-center justify-between",
                        rider.isVerified ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/5 opacity-40"
                    )}>
                        <div className="flex items-center gap-3">
                            <ShieldCheck className={cn("h-4 w-4", rider.isVerified ? "text-emerald-500" : "text-white/20")} />
                            <span className={cn("text-[9px] font-black uppercase tracking-widest", rider.isVerified ? "text-white" : "text-white/40")}>Verificado</span>
                        </div>
                        <Switch checked={!!rider.isVerified} onCheckedChange={(v) => handleToggleVerify(rider.id, v)} />
                    </div>

                    <div className={cn(
                        "p-4 rounded-2xl border transition-all flex items-center justify-between",
                        rider.isOnline ? "bg-primary/10 border-primary/20" : "bg-white/5 border-white/5 opacity-40"
                    )}>
                        <div className="flex items-center gap-3">
                            <Zap className={cn("h-4 w-4", rider.isOnline ? "text-primary" : "text-white/20")} />
                            <span className={cn("text-[9px] font-black uppercase tracking-widest", rider.isOnline ? "text-white" : "text-white/40")}>{rider.isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                        <div className={cn("h-2 w-2 rounded-full", rider.isOnline ? "bg-primary animate-pulse" : "bg-white/10")} />
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <Button variant="ghost" className="h-8 px-0 text-[10px] font-bold text-foreground hover:text-primary uppercase italic tracking-widest flex items-center gap-2 transition-colors">
                        <FileText className="h-3 w-3" />
                        <span>Ver Documentación</span>
                    </Button>
                    <Badge variant="outline" className="text-[8px] font-black border-white/10 rounded-lg">Alem Sede</Badge>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

