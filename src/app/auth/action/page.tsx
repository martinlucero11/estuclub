'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { auth } from '@/firebase/client-config';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function AuthActionHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const mode = searchParams.get('mode');
  const actionCode = searchParams.get('oobCode');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Specific states for password reset
  const [email, setEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!mode || !actionCode) {
      setError('Enlace inválido o incompleto.');
      setLoading(false);
      return;
    }

    const handleAction = async () => {
      try {
        if (mode === 'verifyEmail') {
          await applyActionCode(auth, actionCode);
          setSuccess('¡Tu correo electrónico ha sido verificado con éxito!');
        } else if (mode === 'resetPassword') {
          const userEmail = await verifyPasswordResetCode(auth, actionCode);
          setEmail(userEmail);
        } else {
          setError('Acción no soportada.');
        }
      } catch (err: any) {
        let msg = 'El enlace ha expirado o ya fue utilizado.';
        if (err.code === 'auth/invalid-action-code') msg = 'El código de acción es inválido.';
        else if (err.code === 'auth/expired-action-code') msg = 'El enlace ha expirado. Por favor, solicita uno nuevo.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    handleAction();
  }, [mode, actionCode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionCode) return;
    if (newPassword.length < 6) {
      toast({ variant: 'destructive', title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Las contraseñas no coinciden.' });
      return;
    }

    setIsResetting(true);
    try {
      await confirmPasswordReset(auth, actionCode, newPassword);
      setSuccess('Tu contraseña ha sido restablecida correctamente.');
      toast({ title: 'Éxito', description: 'Tu contraseña se ha actualizado.' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Ocurrió un error al restablecer la contraseña.' });
      setError('Error al restablecer la contraseña. Puede que el enlace haya expirado.');
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md shadow-lg border-muted">
        <CardHeader className="text-center space-y-4 py-8">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <CardTitle>Verificando enlace...</CardTitle>
            <CardDescription>Por favor, espera unos segundos.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-muted">
      <CardHeader className="text-center">
        {success ? (
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
        ) : error ? (
          <XCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
        ) : mode === 'resetPassword' ? (
          <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
        ) : null}

        <CardTitle className="text-2xl">
          {success
            ? mode === 'verifyEmail'
              ? '¡Correo Verificado!'
              : '¡Contraseña Actualizada!'
            : error
            ? 'Enlace Inválido'
            : mode === 'resetPassword'
            ? 'Restablecer Contraseña'
            : 'Procesando...'}
        </CardTitle>
        <CardDescription className="text-base mt-2">
          {success
            ? 'Ya puedes iniciar sesión en tu cuenta con normalidad.'
            : error
            ? error
            : mode === 'resetPassword'
            ? `Ingresa una nueva contraseña para ${email}`
            : ''}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {mode === 'resetPassword' && !success && !error && (
          <form onSubmit={handleResetPassword} className="space-y-5 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Nueva Contraseña</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Confirmar Contraseña</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={isResetting}>
              {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isResetting ? 'Guardando...' : 'Cambiar Contraseña'}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center border-t border-border/40 p-6 bg-muted/20">
        <Button asChild className="w-full h-11">
          <Link href="/login">Ir a Iniciar Sesión</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function ActionPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
        
        <Link href="/" className="mb-8 z-10 hover:opacity-80 transition-opacity">
            <div
                className="h-[48px] w-[160px] bg-primary dark:bg-primary-foreground [mask-image:url(/logo.svg)] [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]"
                aria-label="EstuClub Logo"
            />
        </Link>
        
        <div className="z-10 w-full max-w-md">
            <Suspense fallback={
                <Card className="w-full max-w-md shadow-lg border-muted">
                    <CardHeader className="text-center space-y-4 py-8">
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                        <CardTitle>Cargando...</CardTitle>
                    </CardHeader>
                </Card>
            }>
                <AuthActionHandler />
            </Suspense>
        </div>
    </div>
  );
}
