'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useUser } from '@/firebase';
import BenefitList from '@/components/dashboard/benefit-list';
import SplashScreen from '@/components/layout/splash-screen';
import type { UserRole } from '@/types/data';
import { Button } from '@/components/ui/button';
import { Plus, Gift, Info } from 'lucide-react';
import { BenefitDialog } from '@/components/admin/benefits/benefit-dialog';
import BackButton from '@/components/layout/back-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';

// This is the type expected by BenefitList component
interface UserForList {
  uid: string;
  email: string | null;
  roles: UserRole[];
}

export default function PanelCluberBenefitsPage() {
  const { user, roles, userData, isUserLoading } = useUser();
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (isUserLoading || !user) {
    return <SplashScreen />;
  }

  const userForList: UserForList = {
    uid: user.uid,
    email: user.email,
    roles: roles as UserRole[],
  };
  
  // Real-time reactivity via userData.permitsBenefits
  const canCreate = roles.includes('admin') || !!userData?.permitsBenefits;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 px-2">
        <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-[2.5rem] bg-primary/5 flex items-center justify-center border border-primary/10 shadow-inner group hover:scale-105 transition-transform duration-500">
                <Gift className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-1">
               <div className="flex items-center gap-2">
                   <h1 className="text-4xl font-black uppercase tracking-tighter italic text-black leading-none">Gestionar <span className="text-primary italic">Beneficios</span></h1>
               </div>
               <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/30 ml-1">Catálogo de Promociones & Estuclub Perks</p>
            </div>
        </div>

        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div tabIndex={0}>
                        <Button 
                            onClick={() => setIsFormOpen(true)} 
                            disabled={!canCreate}
                            className="rounded-[1.5rem] h-16 px-10 font-black uppercase tracking-widest text-[11px] bg-primary text-white shadow-2xl shadow-[0_0_20px_rgba(203,70,90,0.4)] hover:scale-105 active:scale-95 transition-all border-none"
                        >
                            <Plus className="mr-3 h-5 w-5" />
                            Lanzar Nuevo Beneficio
                        </Button>
                    </div>
                </TooltipTrigger>
                {!canCreate && (
                    <TooltipContent className="bg-black text-white border-none rounded-xl p-3 shadow-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Requiere activación <br/> de Estuclub Central</p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
      </div>

      <Card className="rounded-[3rem] border border-black/5 bg-white shadow-2xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
        <CardContent className="p-8 md:p-12 relative z-10">
            <BenefitList user={userForList} />
        </CardContent>
      </Card>

      {!canCreate && (
          <div className="p-10 rounded-[3rem] bg-black/[0.02] border border-dashed border-black/10 text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-xl">
                  <Info className="h-6 w-6 text-black/20" />
              </div>
              <div className="space-y-1">
                  <p className="text-lg font-black uppercase tracking-tighter italic text-black opacity-40">Módulo Bloqueado</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/20">Tu comercio aún no cuenta con permisos de publicación de beneficios</p>
              </div>
          </div>
      )}

      {canCreate && (
        <BenefitDialog isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
      )}
    </div>
  );
}


