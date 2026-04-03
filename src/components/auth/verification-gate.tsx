'use client';

import React, { useState } from 'react';
import { useUser, useAuthService } from '@/firebase';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Loader2 } from 'lucide-react';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

const PUBLIC_PATHS = ['/login', '/register', '/signup', '/forgot-password', '/reset-password', '/be-rider', '/be-cluber'];

export default function VerificationGate({ children }: { children: React.ReactNode }) {
  const { user, userData, roles, isUserLoading } = useUser();
  const auth = useAuthService();
  const { toast } = useToast();
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  // ═══════════════════════════════════════════════════════════
  // RULE 2: ADMIN BYPASS — The Overlord does not queue.
  // This is the FIRST check. If admin, render children immediately.
  // ═══════════════════════════════════════════════════════════
  if (roles.includes('admin')) {
    return <>{children}</>;
  }

  // Loading state — show spinner while Firebase resolves
  if (isUserLoading && !isPublicPath) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="h-10 w-10 text-[#cb465a] animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#cb465a]">
          Cargando Estuclub...
        </p>
      </div>
    );
  }

  // Public paths always pass through
  if (isPublicPath) {
    return <>{children}</>;
  }

  // No user logged in — let the page handle its own login UI
  if (!user) {
    return <>{children}</>;
  }

  // User exists but email not verified
  const needsVerification = user && !user.emailVerified;
  // User exists but Firestore profile missing (registration incomplete)
  const profileMissing = user && !isUserLoading && !userData;

  if (!needsVerification && !profileMissing) {
    return <>{children}</>;
  }

  // ── Verification UI ──
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await user.reload();
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing user:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await sendEmailVerification(user);
      toast({ title: 'Email enviado', description: 'Revisá tu casilla de correo.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/';
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6">
      <Card className="w-full max-w-md rounded-[3rem] border-none shadow-2xl overflow-hidden p-10 text-center space-y-6">
        <Mail className="h-12 w-12 text-[#cb465a] mx-auto opacity-20" />
        <h2 className="text-2xl font-black uppercase tracking-tighter text-[#cb465a]">
          {profileMissing ? 'Configurando perfil...' : 'Verificá tu cuenta'}
        </h2>
        <p className="text-xs font-bold text-foreground uppercase">
          {profileMissing
            ? 'Estamos terminando de crear tu perfil. Esperá unos segundos.'
            : `Enviamos un link a: ${user.email}`}
        </p>
        <div className="grid gap-4">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-14 rounded-2xl bg-[#cb465a] text-white font-black uppercase tracking-widest text-[10px]"
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'YA VERIFIQUÉ MI CUENTA'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResend} disabled={isResending} className="flex-1 h-12 rounded-xl text-[9px] font-black uppercase">
              REENVIAR
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="flex-1 h-12 rounded-xl text-[9px] font-black uppercase">
              SALIR
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

