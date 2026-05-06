'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useAuthService } from '@/firebase';
import { signOut } from 'firebase/auth';
import { haptic } from '@/lib/haptics';
import { createSubscription } from '@/lib/actions/subscription-actions';
import { useToast } from '@/hooks/use-toast';

export default function SuscripcionVencida() {
  const router = useRouter();
  const { userData, roles, isUserLoading } = useUser();
  const auth = useAuthService();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If user is loaded and their subscription is actually active, send them back
    if (!isUserLoading && userData) {
      const paidUntil = userData.membershipPaidUntil as any;
      const isExpired = paidUntil ? paidUntil.toMillis() < Date.now() : false;
      
      if (userData.subscriptionStatus === 'active' && !isExpired) {
        if (roles.includes('cluber')) {
          router.replace('/panel-cluber');
        } else if (roles.includes('rider')) {
          router.replace('/rider');
        } else {
          router.replace('/');
        }
      }
    }
  }, [userData, isUserLoading, roles, router]);

  const handleLogout = async () => {
    haptic.vibrateSubtle();
    await signOut(auth);
    router.replace('/login');
  };

  const handleRenew = async () => {
    haptic.vibrateSubtle();
    setIsSubmitting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("No hay token de sesión");

      // Determine plan based on role
      let planType: 'rider' | 'cluber_basic' | 'cluber_plus' | 'cluber_pro' = 'rider';
      
      if (roles.includes('cluber')) {
        // Fallback or read from past plan if available. For now, default to cluber_basic
        // It could also be read from userData.planType
        if (userData?.planType) {
           planType = userData.planType as any;
        } else {
           planType = 'cluber_basic';
        }
      }

      const result = await createSubscription(planType, idToken);
      
      if (result.success && result.initPoint) {
        window.location.href = result.initPoint;
      } else {
        throw new Error(result.error || "Error al generar link");
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No pudimos procesar la renovación.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 selection:bg-[#cb465a]/30">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#cb465a]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="p-[1px] rounded-[2.5rem] bg-gradient-to-b from-white/10 to-white/5 shadow-2xl">
          <div className="bg-[#0A0A0A]/90 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 text-center overflow-hidden relative">
            
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 border border-primary/20 shadow-[0_0_40px_rgba(203,70,90,0.2)]">
              <Lock className="w-10 h-10 text-primary" />
            </div>

            <div className="space-y-3 mb-10">
              <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white">
                Suscripción Vencida
              </h1>
              <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest leading-relaxed">
                Tu acceso ha sido pausado. Renueva tu suscripción para continuar usando la plataforma.
              </p>
            </div>

            <div className="space-y-4 mb-10 text-left">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Reactivación Inmediata</p>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Cobro Automático Mensual</p>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/80">Cancela cuando quieras</p>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleRenew} 
                disabled={isSubmitting || isUserLoading}
                className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98] group"
              >
                {isSubmitting ? 'Procesando...' : (
                  <>
                    Renovar Ahora 
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="w-full h-12 text-white/30 hover:text-white/70 hover:bg-white/5 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-colors"
              >
                <LogOut className="w-3 h-3 mr-2" />
                Cerrar Sesión
              </Button>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
