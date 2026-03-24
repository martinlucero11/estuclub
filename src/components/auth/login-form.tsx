
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { KeyRound, Mail, AlertCircle, UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '@/firebase/client-config'; 
import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  setPersistence, 
  browserSessionPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';
import ResetPasswordDialog from './reset-password-dialog';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useState } from 'react';
import { haptic } from '@/lib/haptics';

const formSchema = z.object({
  identifier: z.string().min(3, 'Por favor, introduce tu email o nombre de usuario.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  rememberMe: z.boolean().default(true),
});

export default function LoginForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [unverifiedCredentials, setUnverifiedCredentials] = useState({ email: '', password: '' });
  const [isResending, setIsResending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: '',
      password: '',
      rememberMe: true,
    },
  });

  async function handleResendVerification() {
    if (!unverifiedCredentials.email) return;
    setIsResending(true);
    try {
      const result = await signInWithEmailAndPassword(auth, unverifiedCredentials.email, unverifiedCredentials.password);
      await sendEmailVerification(result.user);
      await signOut(auth);
      toast({
        title: 'Correo de verificación reenviado',
        description: 'Por favor, revisa tu bandeja de entrada. Recuerda revisar la carpeta de Spam.',
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
      let loginEmail = values.identifier;

      // 1. Resolve Username if needed
      if (!values.identifier.includes('@')) {
          const usernameDocRef = doc(firestore, 'usernames', values.identifier.toLowerCase());
          const usernameDoc = await getDoc(usernameDocRef);
          
          if (!usernameDoc.exists()) {
              toast({
                  variant: "destructive",
                  title: "Usuario no encontrado",
                  description: "El nombre de usuario ingresado no existe."
              });
              return;
          }
          
          const userId = usernameDoc.data().userId;
          const userDocRef = doc(firestore, 'users', userId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists() && userDoc.data().email) {
              loginEmail = userDoc.data().email;
          } else {
              toast({
                  variant: "destructive",
                  title: "Error de perfil",
                  description: "No se pudo recuperar el correo asociado a este usuario."
              });
              return;
          }
      }

      const persistence = values.rememberMe 
        ? browserLocalPersistence 
        : browserSessionPersistence;
        
      await setPersistence(auth, persistence);

      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, values.password);
      
      if (!userCredential.user.emailVerified) {
        setUnverifiedCredentials({ email: loginEmail, password: values.password });
        setShowVerificationAlert(true);
        await signOut(auth);
        return;
      }
      
      haptic.vibrateSuccess();
      toast({
        title: 'Iniciando sesión...',
        description: 'Serás redirigido en un momento.',
      });
    } catch (error: any) {
      let description = "Las credenciales son incorrectas. Por favor, inténtalo de nuevo.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        description = "El correo o la contraseña son incorrectos.";
      }
      haptic.vibrateError();
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
      <Card className="rounded-[2rem] border-primary/5 glass glass-dark shadow-premium overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 pt-10 px-8">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-black uppercase tracking-widest text-[10px] ml-1 opacity-70">Email o Usuario</FormLabel>
                    <div className="relative group/input">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <FormControl>
                        <Input 
                            placeholder="tu@email.com" 
                            {...field} 
                            className="h-12 pl-12 rounded-xl bg-primary/5 border-primary/5 focus:border-primary/20 focus:ring-primary/10 transition-all font-medium" 
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between ml-1">
                      <FormLabel className="font-black uppercase tracking-widest text-[10px] opacity-70">Contraseña</FormLabel>
                      <ResetPasswordDialog>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/70 hover:text-primary transition-colors cursor-pointer">
                            ¿Olvidaste tu contraseña?
                          </span>
                      </ResetPasswordDialog>
                    </div>
                    <div className="relative group/input">
                      <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <FormControl>
                        <Input 
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                            className="h-12 pl-12 rounded-xl bg-primary/5 border-primary/5 focus:border-primary/20 focus:ring-primary/10 transition-all font-medium" 
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 ml-1">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="rounded-md border-primary/20 data-[state=checked]:bg-primary"
                      />
                    </FormControl>
                    <FormLabel className="text-xs font-bold text-muted-foreground/80 cursor-pointer select-none">
                        Mantener sesión iniciada
                    </FormLabel>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="pb-10 pt-4 px-8">
              <Button 
                type="submit" 
                onClick={() => haptic.vibrateImpact()}
                className="w-full h-12 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Cargando...' : 'Iniciar Sesión'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
}
