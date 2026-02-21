
'use client';

import Link from 'next/link';
import LoginForm from '@/components/auth/login-form';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SplashScreen from '@/components/layout/splash-screen';

function EstuClubLogo() {
  return (
    <div className="flex items-center justify-center gap-2">
        <h1 className="flex items-baseline text-center font-bold text-primary">
          <span className="font-sans text-[3rem] font-black tracking-tighter">Estu</span>
          <span className="font-logo-script text-[3.5rem]">Club</span>
        </h1>
    </div>
  );
}

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  if (isUserLoading || user) {
    return <SplashScreen />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <header className="mb-8 flex flex-col items-center">
            <Link href="/" className="mb-4">
                <EstuClubLogo />
            </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sr-only">
            EstuClub
          </h1>
          <p className="mt-2 text-muted-foreground">
            Inicia sesión para acceder a tus beneficios.
          </p>
        </header>
        <LoginForm />
        <p className="mt-8 text-center text-sm text-muted-foreground">
          ¿No tienes una cuenta?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
