'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { 
  Building, 
  Search, 
  Globe, 
  Star, 
  Truck, 
  Megaphone, 
  Gift, 
  Utensils, 
  Edit3, 
  Settings2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Hash,
  MapPin,
  TrendingDown,
  Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { SupplierProfile } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { useAdmin } from '@/context/admin-context';

export default function CluberManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { setImpersonatedUserId } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCluber, setEditingCluber] = useState<SupplierProfile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch all clubers sorted by name
  const clubersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()),
      orderBy('name', 'asc')
    );
  }, [firestore]);

  const { data: clubers, isLoading } = useCollection<SupplierProfile>(clubersQuery);

  const filteredClubers = useMemo(() => {
    if (!searchQuery) return clubers || [];
    const lowerQuery = searchQuery.toLowerCase();
    return clubers?.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) || 
      c.id.toLowerCase().includes(lowerQuery) ||
      c.address?.toLowerCase().includes(lowerQuery)
    ) || [];
  }, [clubers, searchQuery]);

  const handleToggleField = async (cluberId: string, field: string, value: boolean) => {
    try {
      const docRef = doc(firestore, 'roles_supplier', cluberId);
      await updateDoc(docRef, { [field]: value });
      
      // If updating CincoDos, sync with user document as well
      if (field === 'isCincoDos') {
        const userRef = doc(firestore, 'users', cluberId);
        await updateDoc(userRef, { isCincoDos: value });
      }

      toast({ 
        title: 'Sincronizado', 
        description: `Campo ${field} actualizado a ${value ? 'ACTIVADO' : 'DESACTIVADO'}.` 
      });
    } catch (error) {
      console.error('Toggle error:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el ajuste remoto.' });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCluber || !firestore) return;

    setIsUpdating(true);
    try {
      const docRef = doc(firestore, 'roles_supplier', editingCluber.id);
      await updateDoc(docRef, {
        name: editingCluber.name,
        address: editingCluber.address,
        commissionPercentage: Number(editingCluber.commissionPercentage) || 0,
        updatedAt: serverTimestamp()
      });

      toast({ title: 'Perfil Guardado', description: `Se actualizaron los datos de ${editingCluber.name}.` });
      setEditingCluber(null);
    } catch (error) {
      console.error('Update profile error:', error);
      toast({ variant: 'destructive', title: 'Error fatal', description: 'No se pudieron guardar los cambios.' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 text-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin opacity-40 mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground animate-pulse">Escaneando Red Local...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Search & Stats Header */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative w-full max-w-xl group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="BUSCAR CLUBER POR NOMBRE, ID O DIRECCIÓN..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-16 pl-16 rounded-[2rem] bg-card/50 border-white/5 focus:border-primary/40 text-sm font-bold uppercase tracking-widest transition-all shadow-premium placeholder:text-black/20 dark:placeholder:text-white/20"
          />
        </div>
        <div className="flex gap-4">
            <Badge variant="outline" className="text-foreground border-white/5 px-4 py-2 rounded-xl flex items-center gap-2">
                <Hash className="h-3 w-3" />
                {clubers?.length || 0} TOTALES
            </Badge>
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 rounded-xl flex items-center gap-2">
                <Star className="h-3 w-3" />
                {clubers?.filter(c => c.isFeatured).length || 0} DESTACADOS
            </Badge>
        </div>
      </div>

      {/* Cluber Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredClubers.map((cluber) => (
          <Card key={cluber.id} className="bg-card/30 border-white/5 rounded-[3rem] overflow-hidden group hover:bg-card/50 transition-all duration-500 relative shadow-premium border-none ring-1 ring-white/5">
            <Building className="absolute -right-8 -bottom-8 h-48 w-48 text-primary/[0.03] -rotate-12 transition-colors" />
            
            <CardContent className="p-10 space-y-10 relative z-10">
              {/* Top Info Section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-3xl bg-background border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:border-primary/40 transition-colors">
                    {cluber.logoUrl ? (
                      <img src={cluber.logoUrl} alt={cluber.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building className="h-10 w-10 text-foreground/20" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase font-montserrat leading-none">
                        {cluber.name}
                      </h3>
                      {cluber.verified && <CheckCircle2 className="h-5 w-5 text-blue-400" />}
                      {!cluber.isVisible && <XCircle className="h-5 w-5 text-red-500/50" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                       <p className="text-[10px] font-black uppercase tracking-widest text-foreground italic truncate max-w-[200px]">{cluber.address || 'Sin dirección'}</p>
                       <div className="h-1 w-1 rounded-full bg-white/10" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">ID: {cluber.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/20 hover:text-primary transition-all shadow-xl shrink-0"
                        onClick={() => {
                          toast({ title: 'Cargando EstuSim', description: `Impersonando a ${cluber.name}...` });
                          setImpersonatedUserId(cluber.id);
                        }}
                        title="Simular Sesión"
                    >
                        <Zap className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-primary/10 transition-all opacity-40 hover:opacity-100 shrink-0"
                      onClick={() => setEditingCluber(cluber)}
                    >
                      <Edit3 className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 hover:bg-blue-500/10 hover:text-blue-400 transition-all opacity-40 hover:opacity-100 shrink-0"
                      asChild
                    >
                      <a href={`/delivery/commerce/${cluber.id}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    </Button>
                </div>
              </div>

              {/* Toggles Command Center */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <ManagementToggle 
                    icon={<Globe className="h-4 w-4" />}
                    label="Visible"
                    value={!!cluber.isVisible}
                    onChange={(v) => handleToggleField(cluber.id, 'isVisible', v)}
                />
                <ManagementToggle 
                    icon={<Star className="h-4 w-4" />}
                    label="Destacado"
                    value={!!cluber.isFeatured}
                    onChange={(v) => handleToggleField(cluber.id, 'isFeatured', v)}
                />
                <ManagementToggle 
                    icon={<Truck className="h-4 w-4" />}
                    label="Delivery"
                    value={!!cluber.deliveryEnabled}
                    onChange={(v) => handleToggleField(cluber.id, 'deliveryEnabled', v)}
                />
                <ManagementToggle 
                    icon={<Gift className="h-4 w-4" />}
                    label="Beneficios"
                    value={!!cluber.canCreateBenefits}
                    onChange={(v) => handleToggleField(cluber.id, 'canCreateBenefits', v)}
                />
                <ManagementToggle 
                    icon={<Megaphone className="h-4 w-4" />}
                    label="Anuncios"
                    value={!!cluber.announcementsEnabled}
                    onChange={(v) => handleToggleField(cluber.id, 'announcementsEnabled', v)}
                />
                
                {/* Special CincoDos Toggle */}
                <div className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all duration-500",
                  cluber.isCincoDos 
                    ? "bg-amber-400/10 border-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.05)]" 
                    : "bg-white/5 border-white/5 opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center transition-all",
                      cluber.isCincoDos ? "bg-amber-400 text-black shadow-[0_0_15px_#fbbf24] rotate-6" : "bg-white/10 text-white/20"
                    )}>
                      <Utensils className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-[0.2em] leading-none",
                        cluber.isCincoDos ? "text-amber-400" : "text-white/40"
                      )}>Cinco Dos</span>
                      <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">Proyecto Social</span>
                    </div>
                  </div>
                  <Switch 
                    checked={!!cluber.isCincoDos} 
                    onCheckedChange={(v) => handleToggleField(cluber.id, 'isCincoDos', v)}
                    className="data-[state=checked]:bg-amber-400"
                  />
                </div>
              </div>
              
              {/* Quick Status Bar */}
              <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
                    <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Active Core</span>
                </div>
                <div className="flex items-center gap-2">
                    <TrendingDown className="h-3 w-3 text-primary/40" />
                    <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Service Fee: {cluber.commissionPercentage || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results Fallback */}
      {filteredClubers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 space-y-6 bg-card/20 rounded-[4rem] border-2 border-dashed border-white/5 text-center">
            <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center">
               <Search className="h-10 w-10 text-white/10" />
            </div>
            <div className="space-y-1">
                <p className="text-xl font-bold uppercase italic tracking-tighter">No se encontraron Clubers</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Refina tu búsqueda maestro</p>
            </div>
            <Button variant="outline" onClick={() => setSearchQuery('')} className="rounded-2xl border-white/10 font-black uppercase text-[10px] px-8 py-6">Resetear Filtros</Button>
        </div>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={!!editingCluber} onOpenChange={(open) => !open && setEditingCluber(null)}>
        <DialogContent className="bg-card border-none rounded-[3rem] p-12 max-w-xl shadow-2xl selection:bg-primary/30 ring-1 ring-white/10">
          <DialogHeader className="space-y-4 mb-8">
             <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Settings2 className="h-7 w-7 text-primary" />
             </div>
             <div>
                <DialogTitle className="text-4xl font-black italic tracking-tighter uppercase font-montserrat">
                    Editar Perfil
                </DialogTitle>
                <DialogDescription className="text-xs font-bold opacity-30 uppercase tracking-[0.3em] font-inter">
                    Ajustando parámetros de <span className="text-primary">{editingCluber?.name}</span>
                </DialogDescription>
             </div>
          </DialogHeader>

          <form onSubmit={handleUpdateProfile} className="space-y-10">
             <div className="space-y-8">
                <div className="space-y-3">
                   <Label className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] ml-2">Nombre del Local</Label>
                   <Input 
                      value={editingCluber?.name || ''} 
                      onChange={(e) => editingCluber && setEditingCluber({...editingCluber, name: e.target.value})}
                      className="h-16 rounded-[1.5rem] bg-background border-white/5 focus:border-primary/50 text-base font-bold"
                   />
                </div>

                <div className="space-y-3">
                   <Label className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] ml-2">Dirección Física</Label>
                   <div className="relative">
                       <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/20" />
                       <Input 
                          value={editingCluber?.address || ''} 
                          onChange={(e) => editingCluber && setEditingCluber({...editingCluber, address: e.target.value})}
                          className="h-16 pl-16 rounded-[1.5rem] bg-background border-white/5 focus:border-primary/50 text-base font-bold"
                       />
                   </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] ml-2">Comisión de Venta (%)</Label>
                    <div className="relative">
                        <TrendingDown className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                        <Input 
                            type="number"
                            step="0.1"
                            value={editingCluber?.commissionPercentage || 0} 
                            onChange={(e) => editingCluber && setEditingCluber({...editingCluber, commissionPercentage: Number(e.target.value)})}
                            className="h-16 pl-16 rounded-[1.5rem] bg-background border-white/5 focus:border-primary/50 text-2xl font-black transition-all shadow-inner"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black opacity-20 text-xl">%</div>
                    </div>
                </div>
             </div>

             <DialogFooter className="gap-4">
                <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setEditingCluber(null)}
                    className="h-16 px-10 rounded-2xl font-black opacity-40 uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                    Cancelar
                </Button>
                <Button 
                    type="submit" 
                    disabled={isUpdating}
                    className="h-16 px-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl hover:bg-primary/90 transition-all flex-1"
                >
                    {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : "GUARDAR CAMBIOS"}
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ManagementToggle({ icon, label, value, onChange }: { icon: any, label: string, value: boolean, onChange: (v: boolean) => void }) {
    return (
        <div className={cn(
            "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 border",
            value ? "bg-primary/10 border-primary/20" : "bg-white/5 border-white/5 opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0"
        )}>
            <div className="flex items-center gap-3 font-inter">
                <div className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                    value ? "bg-primary text-white" : "bg-white/10 text-white/20"
                )}>
                    {icon}
                </div>
                <Label className={cn(
                    "text-[10px] font-black uppercase tracking-widest leading-none cursor-pointer",
                    value ? "" : "opacity-40"
                )}>{label}</Label>
            </div>
            <Switch 
                checked={value} 
                onCheckedChange={onChange} 
                className="data-[state=checked]:bg-primary"
            />
        </div>
    );
}

