'use client';

import Link from 'next/link';
import Image from 'next/image';
import SignupForm from '@/components/auth/signup-form';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SplashScreen from '@/components/layout/splash-screen';


function EstuClubLogo() {
  return (
    <div
      className="w-40 h-14 mx-auto mb-6"
      style={{
          backgroundColor: 'hsl(var(--primary))',
          maskImage: "url('/logo.svg')",
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskImage: "url('/logo.svg')",
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
      }}
    />
  );
}

export default function SignupPage() {
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
            Crear una Cuenta
          </h1>
          <p className="mt-2 text-muted-foreground">
            Únete para empezar a disfrutar de beneficios exclusivos.
          </p>
        </header>
        <SignupForm />
        <p className="mt-8 text-center text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
