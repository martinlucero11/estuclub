
'use client';
// Rebuild trigger

import Link from 'next/link';
import Logo from '@/components/common/Logo';
import LoginForm from '@/components/auth/login-form';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SplashScreen from '@/components/layout/splash-screen';
import MainLayout from '@/components/layout/main-layout';

export default function LoginPage() {
  const { user, roles, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      if (roles && roles.includes('admin')) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [user, roles, isUserLoading, router]);

  if (isUserLoading || user) {
    return <SplashScreen />;
  }

  return (
    <div className="relative flex w-full flex-col items-center justify-center bg-background py-8">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
      
      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <header className="mb-10 flex flex-col items-center text-center">
            <Link href="/" className="mb-6 transition-transform hover:scale-110 duration-300">
            <Logo 
                variant="rosa"
                className="h-16 w-auto"
            />
            </Link>
          <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase sr-only">
            EstuClub
          </h1>
          <p className="text-foreground font-black uppercase tracking-[0.2em] text-[10px]">
            Bienvenido al Club
          </p>
          <p className="mt-1 text-sm font-black text-primary italic">
            Inicia sesión para acceder a tus beneficios
          </p>
        </header>

        <LoginForm />

        <p className="mt-10 text-center text-xs font-bold text-foreground tracking-wide">
          ¿No tienes una cuenta?{' '}
          <Link href="/signup" className="font-black text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline uppercase tracking-widest text-[10px] ml-1">
            Regístrate ahora
          </Link>
        </p>
      </div>
    </div>
  );
}

