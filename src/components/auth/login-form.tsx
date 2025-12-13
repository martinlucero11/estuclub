
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
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
import { Fingerprint, KeyRound, Mail, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { biometricService } from '@/services/biometric-service';
import { useEffect, useState } from 'react';
import ResetPasswordDialog from './reset-password-dialog';

const formSchema = z.object({
  email: z.string().email('Por favor, introduce un correo electrónico válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export default function LoginForm() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    biometricService.isAvailable().then(setIsBiometricAvailable);
  }, []);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      
       if (!userCredential.user.emailVerified) {
        toast({
          variant: "destructive",
          title: "Verificación de correo requerida",
          description: "Por favor, verifica tu correo antes de iniciar sesión.",
          action: (
            <Button
              variant="secondary"
              onClick={async () => {
                await sendEmailVerification(userCredential.user);
                toast({ title: "Correo de verificación enviado." });
              }}
            >
              Reenviar correo
            </Button>
          ),
        });
        await auth.signOut(); // Log out the user if email is not verified
        return;
      }

      // After successful login, offer to set up biometrics
      if (userCredential.user) {
        await biometricService.askToSetupBiometrics(values.email, values.password);
      }

      toast({
        title: 'Iniciando sesión...',
        description: 'Serás redirigido en un momento.',
      });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: "Las credenciales son incorrectas. Por favor, inténtalo de nuevo.",
      });
    }
  }

  async function handleBiometricLogin() {
    try {
      const credentials = await biometricService.loginWithBiometrics();
      if (credentials) {
        await onSubmit(credentials);
      } else {
         toast({
          variant: "destructive",
          title: "Inicio de sesión biométrico cancelado",
          description: "No se proporcionaron credenciales.",
        });
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error Biométrico",
        description: error.message || "No se pudo iniciar sesión con biometría.",
      });
    }
  }


  return (
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
            {isBiometricAvailable && (
              <>
                <div className="relative w-full">
                    <Separator className="absolute left-0 top-1/2 -translate-y-1/2"/>
                    <p className="text-center text-xs text-muted-foreground bg-card px-2 relative">O CONTINUAR CON</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleBiometricLogin}
                >
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Iniciar Sesión con Biometría
                </Button>
              </>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
