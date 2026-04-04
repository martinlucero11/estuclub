'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import BenefitList from '@/components/dashboard/benefit-list';
import SplashScreen from '@/components/layout/splash-screen';
import type { UserRole } from '@/types/data';
import { Button } from '@/components/ui/button';
import { Plus, ShieldAlert, Gift } from 'lucide-react';
import { BenefitFormDialog } from '@/components/dashboard/benefit-form-dialog';
import BackButton from '@/components/layout/back-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function PanelCluberBeneficiosPage() {
  const { user, roles, userData, isUserLoading } = useUser();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Sync state for real-time reactivity check
  const canCreate = roles.includes('admin') || !!userData?.permitsBenefits;

  if (isUserLoading) {
    return <SplashScreen />;
  }

  if (!user) {
    return null;
  }

  if (!canCreate && !roles.includes('admin')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-fade-in">
        <div className="h-20 w-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(255,0,127,0.1)]">
           <ShieldAlert className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2 max-w-md">
           <h1 className="text-3xl font-black uppercase tracking-tighter text-white">ACCESO RESTRINGIDO</h1>
           <p className="text-xs font-bold text-foreground uppercase tracking-widest leading-relaxed">
             Tu comercio aún no tiene habilitada la <br/> <span className="text-primary underline">Gestión de Beneficios</span>
           </p>
           <p className="text-[9px] font-medium text-foreground/40 mt-4">
             Solicita la activación a Estuclub Central para empezar a crear promociones exclusivas.
           </p>
        </div>
        <Button asChild variant="outline" className="h-12 px-8 rounded-xl border-white/10 hover:bg-white/5 transition-all">
           <Link href="/panel-cluber">Volver al Panel</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(255,0,127,0.3)]">
                <Gift className="h-7 w-7 text-primary" />
            </div>
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none">Gestionar <span className="text-primary italic">Beneficios</span></h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mt-1 ml-1">Control de Perks & Descuentos</p>
            </div>
        </div>

        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div tabIndex={0}>
                        <Button 
                            onClick={() => setIsFormOpen(true)} 
                            disabled={!canCreate}
                            className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs bg-primary text-white shadow-[0_0_20px_rgba(255,0,127,0.4)] hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Añadir Nuevo Beneficio
                        </Button>
                    </div>
                </TooltipTrigger>
                {!canCreate && (
                    <TooltipContent className="bg-black border-white/10 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-white uppercase tracking-widest">Requiere permiso del administrador</p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
      </div>

      <Card className="rounded-[3rem] border border-white/5 bg-black/40 backdrop-blur-3xl overflow-hidden shadow-2xl">
        <CardContent className="p-8">
            <BenefitList user={{ uid: user.uid, email: user.email, roles: roles as UserRole[] }} />
        </CardContent>
      </Card>
      
      {canCreate && (
        <BenefitFormDialog isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
      )}
    </div>
  );
}
