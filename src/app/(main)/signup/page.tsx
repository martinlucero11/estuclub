
'use client';

import Link from 'next/link';
import SignupForm from '@/components/auth/signup-form';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SplashScreen from '@/components/layout/splash-screen';

export default function SignupPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return <SplashScreen />;
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-6 overflow-hidden py-20">
      {/* Background decoration */}
      <div className="absolute top-[-5%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-5%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
      
      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <header className="mb-10 flex flex-col items-center text-center">
          <Link href="/" className="mb-6 transition-transform hover:scale-105 duration-300">
            <div
                className="h-[48px] w-[160px] bg-primary [mask-image:url(/logo.svg)] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center] drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]"
                aria-label="EstuClub Logo"
            />
          </Link>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase sr-only">
            Crear Cuenta
          </h1>
          <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px] opacity-70">
            Regístrate en el Club
          </p>
          <p className="mt-1 text-sm font-medium text-muted-foreground/60 italic px-4">
            Únete para disfrutar de beneficios exclusivos y premios
          </p>
        </header>

        <SignupForm />

        <p className="mt-10 text-center text-xs font-bold text-muted-foreground tracking-wide">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="font-black text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline uppercase tracking-widest text-[10px] ml-1">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
