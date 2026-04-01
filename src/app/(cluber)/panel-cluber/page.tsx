'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/context/admin-context';
import { 
  Store, Package, QrCode, BarChart3, Settings, 
  Users, Bell, LayoutDashboard, UtensilsCrossed, 
  Clock, AlertCircle, CheckCircle2, ChevronRight, ShieldCheck
} from 'lucide-react';
import { ProductManager } from '@/components/delivery/product-manager';
import { cn } from '@/lib/utils';

export default function PanelCluberPage() {
  const { userData, roles, supplierData } = useUser();
  const { isAdmin, impersonatedSupplierId } = useAdmin();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Shop ID: Either the user's own supplier ID or the impersonated one for admins
  const shopId = (isAdmin && impersonatedSupplierId) ? impersonatedSupplierId : userData?.uid;
  const isOpen = supplierData?.isOpen ?? false;

  const toggleStoreStatus = async () => {
    if (!shopId) return;
    setIsUpdating(true);
    try {
      const docRef = doc(firestore, 'roles_supplier', shopId);
      await updateDoc(docRef, { isOpen: !isOpen });
      toast({
        title: isOpen ? "Tienda Cerrada" : "Tienda Abierta",
        description: isOpen ? "Ya no recibirás pedidos por ahora." : "¡Listo para vender!",
        variant: isOpen ? "destructive" : "default"
      });
    } catch (error) {
      console.error("Error toggling status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el estado de la tienda."
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!roles.includes('supplier') && !roles.includes('cluber') && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#FF007F] flex items-center justify-center p-6 selection:bg-black/20">
        <Card className="w-full max-w-md rounded-[3rem] border-none shadow-[0_20px_60px_rgba(0,0,0,0.2)] bg-white text-[#FF007F] animate-in fade-in zoom-in duration-700">
          <CardContent className="pt-16 pb-12 text-center space-y-8">
            <div className="h-20 w-20 rounded-[2.5rem] bg-[#FF007F]/10 flex items-center justify-center mx-auto border border-[#FF007F]/20">
              <AlertCircle className="h-10 w-10 text-[#FF007F]" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black uppercase tracking-tighter font-montserrat">ACCESO DENEGADO</h1>
              <p className="text-xs font-bold opacity-60 uppercase tracking-widest leading-relaxed">
                Esta área está reservada para <br/> <span className="font-black">Comercios Aliados</span>
              </p>
            </div>
            <Button asChild className="h-14 px-10 rounded-2xl bg-[#FF007F] text-white font-black uppercase tracking-widest hover:bg-[#FF007F]/90 transition-all shadow-[0_10px_30px_rgba(255,0,127,0.3)]">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FF007F] pb-24 transition-colors duration-500 selection:bg-black/20">
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-12 space-y-12">
        
        {/* Header Section: Branding + Role */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="space-y-4">
             <div className="flex items-center gap-4">
               <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/40 shadow-xl">
                  <Store className="h-8 w-8 text-white" />
               </div>
               <div className="space-y-1">
                 <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none text-white italic font-montserrat drop-shadow-2xl">
                   Cluber <span className="text-black">Panel</span>
                 </h1>
                 <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.5em] ml-2">
                   {isAdmin ? "Admin Overlord Active" : "Gestor Logístico Integral"}
                 </p>
               </div>
             </div>
          </div>

          {/* Shop Switcher Card: White */}
          <Card className={cn(
            "rounded-[2.5rem] border-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-700 overflow-hidden min-w-[320px]",
            isOpen ? "bg-white text-[#FF007F]" : "bg-black text-white"
          )}>
            <CardContent className="p-8 flex items-center justify-between gap-8">
               <div className="flex items-center gap-5">
                 <div className={cn(
                   "h-14 w-14 rounded-2xl flex items-center justify-center animate-pulse shadow-inner",
                   isOpen ? "bg-[#FF007F]/10" : "bg-white/10"
                 )}>
                   {isOpen ? <UtensilsCrossed className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
                 </div>
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Local Status</p>
                   <h3 className="font-black text-2xl uppercase tracking-tighter leading-none font-inter">
                     {isOpen ? "ABIERTO" : "CERRADO"}
                   </h3>
                 </div>
               </div>
               <Switch 
                 checked={isOpen} 
                 onCheckedChange={toggleStoreStatus}
                 disabled={isUpdating}
                 className="data-[state=checked]:bg-[#FF007F] data-[state=unchecked]:bg-slate-700 h-10 w-16"
               />
            </CardContent>
          </Card>
        </header>

        {/* Action Grid: Pure White Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
          {[
            { label: "ESCANEAR", icon: QrCode, href: "/panel-cluber/scan", color: "bg-blue-500" },
            { label: "PRODUCTOS", icon: Package, href: "/panel-cluber/products", color: "bg-[#FF007F]" },
            { label: "PEDIDOS", icon: Bell, href: "/panel-cluber/orders", color: "bg-orange-500" },
            { label: "MÉTRICAS", icon: BarChart3, href: "/panel-cluber/analytics", color: "bg-emerald-500" },
            { label: "PERFIL", icon: Settings, href: "/profile", color: "bg-slate-800" },
            { label: "EQUIPO", icon: Users, href: "/panel-cluber/team", color: "bg-indigo-500" },
          ].map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className="rounded-[2.5rem] border-none shadow-[0_15px_35px_rgba(0,0,0,0.1)] bg-white hover:translate-y-[-8px] transition-all duration-500 active:scale-95 group overflow-hidden h-full"> 
                <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-4">
                  <div className={cn("p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform", action.color)}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-800 group-hover:text-[#FF007F] transition-colors">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Integrated Product Manager: Explicit White and Premium */}
        <div className="space-y-6">
           <div className="flex items-center gap-6 px-4">
              <h2 className="text-xs font-black text-white uppercase tracking-[0.5em] whitespace-nowrap drop-shadow-lg">ADMINISTRACIÓN DE CATÁLOGO</h2>
              <div className="h-[2px] w-full bg-white/20 rounded-full" />
           </div>

           <Card className="rounded-[4rem] border-none shadow-[0_40px_80px_rgba(0,0,0,0.2)] overflow-hidden p-4 md:p-12 bg-white min-h-[700px]">
              <CardContent className="p-0">
                <ProductManager supplierId={shopId || ''} />
              </CardContent>
           </Card>
        </div>

        {/* Overlord Overlay: Dark & Sleek */}
        {isAdmin && (
           <div className="p-8 rounded-[3rem] bg-black/90 backdrop-blur-2xl text-white border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-1000">
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-2xl bg-[#FF007F]/20 flex items-center justify-center border border-[#FF007F]/40">
                   <ShieldCheck className="h-7 w-7 text-[#FF007F]" />
                </div>
                <div>
                   <p className="text-[12px] font-black uppercase tracking-[0.2em] text-[#FF007F]">ADMIN OVERLORD MODE</p>
                   <p className="text-xs font-medium text-white/60">Gestionando local ID: <span className="text-white font-mono">{shopId}</span></p>
                </div>
              </div>
              <Badge className="bg-white text-black font-black px-6 py-2 rounded-xl border-none text-[10px] uppercase tracking-widest">ESTADO: DIOS</Badge>
           </div>
        )}

      </div>
    </div>
  );
}
