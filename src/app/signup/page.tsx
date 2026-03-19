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
            <div
                className="h-[42px] w-[140px] bg-primary [mask-image:url(/logo.svg)] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]"
                aria-label="EstuClub Logo"
            />
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
