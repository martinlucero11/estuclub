'use client';

import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Calendar, 
  Hash, 
  DollarSign, 
  Percent, 
  Users, 
  Power,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useFirestore, 
  useCollection 
} from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp,
  limit 
} from 'firebase/firestore';
import { Coupon } from '@/types/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { haptic } from '@/lib/haptics';
import { createCoupon, toggleCouponStatus, deleteCoupon } from '@/lib/actions/coupon-actions';
import { auth } from '@/firebase/config';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function CouponManagement() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    type: 'fixed' as 'fixed' | 'percentage',
    value: 0,
    startDate: '',
    endDate: '',
    usageLimit: 100,
  });

  useEffect(() => {
    if (!firestore) return;
    const q = query(
      collection(firestore, 'coupons'), 
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Coupon[];
      setCoupons(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore]);


  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic.vibrateMedium();

    // Basic Validation (Shared with Zod on server)
    if (!formData.code || formData.value <= 0 || !formData.startDate || !formData.endDate) {
      toast({ variant: 'destructive', title: 'Campos incompletos' });
      return;
    }

    if (formData.type === 'percentage' && formData.value > 90) {
      toast({ variant: 'destructive', title: 'Seguridad Estuclub', description: 'El descuento no puede superar el 90%.' });
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) { toast({ variant: 'destructive', title: 'Sesión expirada' }); return; }
      const idToken = await currentUser.getIdToken();

      const res = await createCoupon({
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      }, idToken);

      if (res.success) {
        toast({ title: '✅ Cupón Creado', description: `El código ${formData.code.toUpperCase()} está activo.` });
        setIsAdding(false);
        setFormData({ code: '', type: 'fixed', value: 0, startDate: '', endDate: '', usageLimit: 100 });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: res.message });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Fallo crítico', description: err.message });
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase font-montserrat">Sistema de Cupones</h2>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.4em]">Engine de Ofertas & Descuentos</p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)}
          className={cn(
            "h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
            isAdding ? "bg-black text-white" : "bg-primary text-white shadow-lg shadow-primary/20"
          )}
        >
          {isAdding ? 'CANCELAR' : <><Plus className="mr-2 h-4 w-4" />NUEVO CUPÓN</>}
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="rounded-[2.5rem] bg-card/30 border-black/5 p-8 mb-8">
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-primary/60 ml-1">Código del Cupón</Label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                    <Input 
                      placeholder="EJ: ALEM3D" 
                      className="h-12 pl-12 rounded-xl bg-background/50 border-black/5 font-black uppercase"
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-primary/60 ml-1">Tipo de Descuento</Label>
                  <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                    <SelectTrigger className="h-12 rounded-xl bg-background/50 border-black/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                      <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-primary/60 ml-1">Valor</Label>
                  <div className="relative">
                    {formData.type === 'fixed' ? <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" /> : <Percent className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />}
                    <Input 
                      type="number"
                      className="h-12 pl-12 rounded-xl bg-background/50 border-black/5 font-bold"
                      value={formData.value}
                      onChange={e => setFormData({...formData, value: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-primary/60 ml-1">Inicio de Vigencia</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                    <Input 
                      type="datetime-local"
                      className="h-12 pl-12 rounded-xl bg-background/50 border-black/5 font-bold"
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-primary/60 ml-1">Fin de Vigencia</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                    <Input 
                      type="datetime-local"
                      className="h-12 pl-12 rounded-xl bg-background/50 border-black/5 font-bold"
                      value={formData.endDate}
                      onChange={e => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-primary/60 ml-1">Límite Global de Usos</Label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                    <Input 
                      type="number"
                      className="h-12 pl-12 rounded-xl bg-background/50 border-black/5 font-bold"
                      value={formData.usageLimit}
                      onChange={e => setFormData({...formData, usageLimit: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-3 pt-4">
                  <Button type="submit" className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest">
                    GUARDAR CUPÓN MAESTRO
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEARCH & FILTERS */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-20" />
        <Input 
          placeholder="Buscar cupón por código..." 
          className="h-14 pl-12 rounded-2xl bg-card/30 border-black/5 shadow-sm font-bold"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* COUPONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full py-20 flex justify-center">
             <Loader2 className="h-10 w-10 text-primary animate-spin" />
           </div>
        ) : filteredCoupons.length === 0 ? (
           <div className="col-span-full py-20 text-center space-y-4">
             <div className="h-20 w-20 rounded-[2rem] bg-black/5 flex items-center justify-center mx-auto opacity-20">
                <Ticket className="h-10 w-10" />
             </div>
             <p className="text-[10px] font-black uppercase opacity-20 tracking-[0.3em]">No hay cupones activos</p>
           </div>
        ) : (
          filteredCoupons.map((coupon) => (
            <motion.div 
              layout
              key={coupon.id} 
              className={cn(
                "group relative bg-card/30 border border-black/5 rounded-[2.5rem] p-6 transition-all hover:bg-card/50",
                !coupon.isActive && "opacity-60 saturate-50"
              )}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                   <Switch 
                     checked={coupon.isActive} 
                     onCheckedChange={async (v) => {
                       const currentUser = auth.currentUser;
                       if (!currentUser) return;
                       const idToken = await currentUser.getIdToken();
                       toggleCouponStatus(coupon.id, v, idToken);
                     }}
                     className="data-[state=checked]:bg-primary"
                   />
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="h-8 w-8 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                     onClick={async () => {
                       const currentUser = auth.currentUser;
                       if (!currentUser) return;
                       const idToken = await currentUser.getIdToken();
                       deleteCoupon(coupon.id, idToken);
                     }}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-3xl font-black italic tracking-tighter uppercase font-montserrat">{coupon.code}</h3>
                  <Badge className="bg-primary/10 text-primary border-0 font-black text-[9px]">
                    {coupon.type === 'fixed' ? `$${coupon.value}` : `${coupon.value}% OFF`}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-2xl bg-black/5 space-y-1">
                    <p className="text-[7px] font-black uppercase opacity-40">USOS GLOBALES</p>
                    <p className="text-sm font-black italic">{coupon.usageCount} / {coupon.usageLimit}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/5 space-y-1">
                    <p className="text-[7px] font-black uppercase opacity-40">USUARIOS ÚNICOS</p>
                    <p className="text-sm font-black italic">{coupon.usedBy?.length || 0}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 opacity-20" />
                    <span className="text-[8px] font-bold opacity-40 uppercase">Vencimiento: {format(coupon.endDate.toDate(), 'dd/MM/yy HH:mm')}</span>
                  </div>
                  {Timestamp.now().seconds > coupon.endDate.seconds && (
                    <Badge variant="destructive" className="h-5 rounded-lg text-[7px] font-black uppercase px-2">VENCIDO</Badge>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
