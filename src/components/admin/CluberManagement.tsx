'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Building, 
  Search, 
  Globe, 
  Star, 
  Truck, 
  Megaphone, 
  Gift, 
  Crown, 
  Edit3, 
  Settings2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Hash,
  MapPin,
  TrendingDown
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

export default function CluberManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
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

      toast({ title: 'Perfil Guuardado', description: `Se actualizaron los datos de ${editingCluber.name}.` });
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
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="h-12 w-12 text-[#d93b64] animate-spin opacity-40" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 animate-pulse">Enganche de Datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Search & Stats Header */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative w-full max-w-xl group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-[#d93b64] transition-colors" />
          <Input 
            placeholder="BUSCAR CLUBER POR NOMBRE, ID O DIRECCIÓN..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-16 pl-16 rounded-2xl bg-white/5 border-white/5 focus:ring-[#d93b64]/20 focus:border-[#d93b64]/40 text-sm font-bold uppercase tracking-widest text-white transition-all shadow-2xl"
          />
        </div>
        <div className="flex gap-4">
            <Badge className="bg-white/5 text-white/40 border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                <Hash className="h-3 w-3" />
                Totales: {clubers?.length || 0}
            </Badge>
            <Badge className="bg-[#d93b64]/10 text-[#d93b64] border-[#d93b64]/20 px-4 py-2 rounded-xl flex items-center gap-2">
                <Star className="h-3 w-3" />
                Destacados: {clubers?.filter(c => c.isFeatured).length || 0}
            </Badge>
        </div>
      </div>

      {/* Cluber Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {filteredClubers.map((cluber) => (
          <Card key={cluber.id} className="bg-slate-900/40 border-white/5 rounded-[3rem] overflow-hidden group hover:border-[#d93b64]/30 transition-all duration-500 relative shadow-2xl">
            {/* Background Decoration */}
            <Building className="absolute -right-8 -bottom-8 h-48 w-48 text-white/[0.02] -rotate-12 group-hover:text-[#d93b64]/[0.03] transition-colors" />
            
            <CardContent className="p-10 space-y-10 relative z-10">
              {/* Top Info Section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-3xl bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl group-hover:border-[#d93b64]/40 transition-colors">
                    {cluber.logoUrl ? (
                      <img src={cluber.logoUrl} alt={cluber.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building className="h-10 w-10 text-white/20" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase font-montserrat leading-none">
                        {cluber.name}
                      </h3>
                      {cluber.verified && <CheckCircle2 className="h-5 w-5 text-blue-400" />}
                      {!cluber.isVisible && <XCircle className="h-5 w-5 text-red-500/50" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">{cluber.address || 'Sin dirección'}</p>
                       <div className="h-1 w-1 rounded-full bg-white/20" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-[#d93b64]/60">ID: {cluber.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-2xl bg-white/5 border border-white/5 hover:bg-[#d93b64]/10 hover:text-[#d93b64] transition-all"
                      onClick={() => setEditingCluber(cluber)}
                    >
                      <Edit3 className="h-5 w-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-2xl bg-white/5 border border-white/5 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
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
                    ? "bg-gradient-to-br from-amber-400/20 to-[#d93b64]/20 border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.1)]" 
                    : "bg-white/5 border-white/5 opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center transition-all",
                      cluber.isCincoDos ? "bg-amber-400 shadow-[0_0_15px_#fbbf24] rotate-12" : "bg-white/10"
                    )}>
                      <Crown className={cn("h-5 w-5", cluber.isCincoDos ? "text-black" : "text-white/20")} />
                    </div>
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-[0.2em] leading-none",
                        cluber.isCincoDos ? "text-amber-400" : "text-white/40"
                      )}>Cinco Dos</span>
                      <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">Status Plus</span>
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
              <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Active Core</span>
                </div>
                <div className="flex items-center gap-2">
                    <TrendingDown className="h-3 w-3 text-[#d93b64]/40" />
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Fee: {cluber.commissionPercentage || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results Fallback */}
      {filteredClubers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 space-y-6 bg-white/5 rounded-[4rem] border-2 border-dashed border-white/5 text-center">
            <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center">
               <Search className="h-10 w-10 text-white/10" />
            </div>
            <div className="space-y-2">
                <p className="text-xl font-bold text-white uppercase italic tracking-tighter">No se encontraron Clubers</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#d93b64]/40">Refina tu búsqueda maestro</p>
            </div>
            <Button variant="outline" onClick={() => setSearchQuery('')} className="rounded-2xl border-white/10 text-white font-black uppercase text-[10px] px-8">Resetear Filtros</Button>
        </div>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={!!editingCluber} onOpenChange={(open) => !open && setEditingCluber(null)}>
        <DialogContent className="bg-slate-950 border-white/10 rounded-[3rem] p-12 max-w-xl shadow-[0_0_100px_rgba(255,0,127,0.15)] selection:bg-[#d93b64]/30">
          <DialogHeader className="space-y-4 mb-8">
             <div className="h-16 w-16 rounded-2xl bg-[#d93b64]/10 border border-[#d93b64]/20 flex items-center justify-center">
                <Settings2 className="h-7 w-7 text-[#d93b64]" />
             </div>
             <div>
                <DialogTitle className="text-4xl font-black text-white italic tracking-tighter uppercase font-montserrat">
                    Editar Perfil
                </DialogTitle>
                <DialogDescription className="text-xs font-bold text-white/30 uppercase tracking-[0.3em] font-inter">
                    Ajustando parámetros de <span className="text-[#d93b64]">{editingCluber?.name}</span>
                </DialogDescription>
             </div>
          </DialogHeader>

          <form onSubmit={handleUpdateProfile} className="space-y-10">
             <div className="space-y-8">
                <div className="space-y-3">
                   <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">Nombre del Local</Label>
                   <Input 
                      value={editingCluber?.name || ''} 
                      onChange={(e) => editingCluber && setEditingCluber({...editingCluber, name: e.target.value})}
                      className="h-16 rounded-2xl bg-white/5 border-white/10 focus:border-[#d93b64]/50 text-base font-bold text-white"
                   />
                </div>

                <div className="space-y-3">
                   <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">Dirección Física</Label>
                   <div className="relative">
                       <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                       <Input 
                          value={editingCluber?.address || ''} 
                          onChange={(e) => editingCluber && setEditingCluber({...editingCluber, address: e.target.value})}
                          className="h-16 pl-16 rounded-2xl bg-white/5 border-white/10 focus:border-[#d93b64]/50 text-base font-bold text-white"
                       />
                   </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">Comisión de Venta (%)</Label>
                    <div className="relative">
                        <TrendingDown className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#d93b64]" />
                        <Input 
                            type="number"
                            step="0.1"
                            value={editingCluber?.commissionPercentage || 0} 
                            onChange={(e) => editingCluber && setEditingCluber({...editingCluber, commissionPercentage: Number(e.target.value)})}
                            className="h-16 pl-16 rounded-2xl bg-white/5 border-white/10 focus:border-[#d93b64]/50 text-2xl font-black text-white transition-all shadow-inner"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-white/20 text-xl">%</div>
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground italic px-2">Este porcentaje se aplica automáticamente a las órdenes pagadas vía MP.</p>
                </div>
             </div>

             <DialogFooter className="gap-4">
                <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setEditingCluber(null)}
                    className="h-16 px-10 rounded-2xl font-black text-white/40 uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                    Cancelar
                </Button>
                <Button 
                    type="submit" 
                    disabled={isUpdating}
                    className="h-16 px-12 rounded-2xl bg-[#d93b64] text-white font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,0,127,0.3)] hover:bg-[#d93b64]/90 transition-all flex-1"
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
            value ? "bg-[#d93b64]/10 border-[#d93b64]/20" : "bg-white/5 border-white/5 opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0"
        )}>
            <div className="flex items-center gap-3">
                <div className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-colors",
                    value ? "bg-[#d93b64] text-white" : "bg-white/10 text-white/20"
                )}>
                    {icon}
                </div>
                <Label className={cn(
                    "text-[10px] font-black uppercase tracking-widest leading-none cursor-pointer",
                    value ? "text-white" : "text-white/40"
                )}>{label}</Label>
            </div>
            <Switch 
                checked={value} 
                onCheckedChange={onChange} 
                className="data-[state=checked]:bg-[#d93b64]"
            />
        </div>
    );
}
