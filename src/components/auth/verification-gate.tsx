'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/firebase/hooks';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, RefreshCw, LogOut, Loader2, CheckCircle2 } from 'lucide-react';
import { getAuth, signOut, sendEmailVerification } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function VerificationGate({ children }: { children: React.ReactNode }) {
  const { user, userData, isUserLoading } = useUser();
  const { toast } = useToast();
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const publicPaths = ['/login', '/register', '/signup', '/verify', '/forgot-password', '/reset-password'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // If user is logged in but NOT verified OR doesn't have a Firestore profile, block the UI (unless it's a public path)
  const isUnverified = user && !user.emailVerified;
  const isProfileMissing = user && !isUserLoading && !userData;
  const needsVerification = (isUnverified || isProfileMissing) && !isPublicPath;

  const handleRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      // Reload the auth user to get fresh emailVerified status
      await user.reload();
      const auth = getAuth();
      const freshUser = auth.currentUser;
      
      if (freshUser?.emailVerified) {
          // If verified, we might still need to wait for userData to sync if it was missing
          if (!userData) {
              toast({
                  title: "Email verificado",
                  description: "Preparando tu perfil...",
              });
              // The hook should eventually pick up the new userData if it exists
          } else {
              toast({
                  title: "¡Cuenta verificada!",
                  description: "Bienvenido a Estuclub.",
              });
          }
      } else {
        toast({
          title: "Aún no verificada",
          description: "Por favor, revisa tu correo y haz clic en el enlace.",
        });
      }
    } catch (error) {
       console.error("Error refreshing user:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResend = async () => {
    if (!user) return;
    setIsResending(true);
    try {
      await sendEmailVerification(user);
      toast({
        title: "Correo enviado",
        description: "Hemos enviado un nuevo enlace de verificación.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo enviar el correo.",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
  };

  if (isUserLoading && !isPublicPath) {
    return (
        <div className="fixed inset-0 z-[9999] mesh-gradient animate-mesh flex flex-col items-center justify-center p-6 space-y-4">
             <div className="relative w-16 h-16">
                 <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                 <Loader2 className="relative h-16 w-16 text-primary animate-spin" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Verificando sesión...</p>
        </div>
    );
  }

  if (needsVerification) {
    return (
      <div className="fixed inset-0 z-[9999] mesh-gradient animate-mesh flex items-center justify-center p-6">
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
        >
          <Card className="rounded-[2.5rem] border-primary/10 glass glass-dark shadow-2xl overflow-hidden">
            <CardContent className="pt-12 pb-10 px-8 text-center space-y-8">
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-primary/20 rounded-[2rem] blur-2xl animate-pulse"></div>
                <div className="relative w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 shadow-xl">
                    <Mail className="h-12 w-12 text-primary animate-bounce" />
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tighter uppercase text-foreground leading-none">
                  {isProfileMissing ? "Completando perfil" : "Verifica tu cuenta"}
                </h2>
                <p className="text-sm font-medium text-muted-foreground/70 leading-relaxed italic">
                  {isProfileMissing 
                    ? "Estamos terminando de configurar tu cuenta. Esto puede tardar unos segundos."
                    : <>Te hemos enviado un correo a <span className="text-primary font-bold not-italic">{user.email}</span>. Verifícalo para activar tu perfil de Estuclub.</>
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-4">
                 <Button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                 >
                    {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Ya verifiqué mi cuenta
                 </Button>

                 <div className="flex gap-3">
                    <Button 
                        variant="secondary"
                        onClick={handleResend}
                        disabled={isResending}
                        className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] glass glass-dark border-white/5 active:scale-95 transition-all"
                    >
                        {isResending ? 'Enviando...' : 'Reenviar Email'}
                    </Button>

                    <Button 
                        variant="ghost"
                        onClick={handleLogout}
                        className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] text-muted-foreground hover:text-red-400 hover:bg-red-400/5 active:scale-95 transition-all"
                    >
                         <LogOut className="h-3 w-3 mr-2" />
                         Cerrar Sesión
                    </Button>
                 </div>
              </div>

              <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
                 Estuclub Security Protocol
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
