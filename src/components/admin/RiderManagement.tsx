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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/admin-context';

export default function RiderManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { setImpersonatedUserId } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch all riders directly from users collection (SSoT)
  const ridersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'),
      where('role', '==', 'rider')
    );
  }, [firestore]);

  const { data: rawRiders, isLoading } = useCollection(ridersQuery);

  // 2. Sort and filter in memory to avoid missing documents without createdAt
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
            placeholder="BUSCAR RIDER POR ID, USERNAME O VEHÍCULO..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-16 pl-16 rounded-[2rem] bg-card/50 border-black/5 dark:border-white/5 focus:border-primary/40 text-sm font-bold uppercase tracking-widest transition-all placeholder:text-black/20 dark:placeholder:text-white/20"
          />
        </div>
        <div className="flex gap-4">
            <Badge variant="outline" className="text-foreground border-black/10 dark:border-white/5 px-4 py-2 rounded-xl flex items-center gap-2">
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
    </div>
  );
}
