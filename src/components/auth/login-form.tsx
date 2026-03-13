
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { KeyRound, Mail, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/firebase/client-config'; 
import { signInWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';
import ResetPasswordDialog from './reset-password-dialog';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useState } from 'react';

const formSchema = z.object({
  email: z.string().email('Por favor, introduce un correo electrónico válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export default function LoginForm() {
  const { toast } = useToast();
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function handleResendVerification() {
    if (!auth.currentUser) return;
    setIsResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: 'Correo de verificación reenviado',
        description: 'Por favor, revisa tu bandeja de entrada.',
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo reenviar el correo. Inténtalo más tarde.",
      });
    } finally {
      setIsResending(false);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setShowVerificationAlert(false);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      
      if (!userCredential.user.emailVerified) {
        setShowVerificationAlert(true);
        // Sign out the user immediately so they can't navigate while unverified
        await signOut(auth);
        return;
      }
      
      // The redirect is now handled by the useEffect in login/page.tsx,
      // which waits for the useUser() hook to be fully updated.
      toast({
        title: 'Iniciando sesión...',
        description: 'Serás redirigido en un momento.',
      });
    } catch (error: any) {
      let description = "Las credenciales son incorrectas. Por favor, inténtalo de nuevo.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        description = "El correo o la contraseña son incorrectos.";
      }
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: description,
      });
    }
  }

  return (
    <>
    {showVerificationAlert && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Verifica tu correo electrónico</AlertTitle>
          <AlertDescription>
            Debes verificar tu correo para poder iniciar sesión.
            <Button
              variant="link"
              className="p-0 h-auto ml-1 text-destructive font-bold"
              onClick={handleResendVerification}
              disabled={isResending}
            >
              {isResending ? 'Reenviando...' : 'Reenviar correo'}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 pt-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="tu@email.com" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Contraseña</FormLabel>
                      <ResetPasswordDialog>
                        <span className="text-sm font-medium text-primary hover:underline cursor-pointer">
                            ¿Olvidaste tu contraseña?
                          </span>
                      </ResetPasswordDialog>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
}
