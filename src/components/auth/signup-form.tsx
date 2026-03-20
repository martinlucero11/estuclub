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
import { KeyRound, Mail, UserPlus, Fingerprint, Phone, User as UserIcon, AtSign, VenetianMask, University, Library, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, User } from 'firebase/auth';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

const formSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres.'),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres.').regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos.'),
  email: z.string().min(1, { message: "El correo electrónico es obligatorio." }).refine(email => /.+@.+\..+/.test(email), {
    message: "Por favor, introduce un correo electrónico válido.",
  }),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  dni: z.string().regex(/^\d{7,8}$/, 'El DNI debe tener entre 7 y 8 dígitos numéricos.'),
  phone: z.string().min(6, 'El número de teléfono no es válido.'),
  gender: z.enum(['Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo'], {
    errorMap: () => ({ message: 'Por favor, selecciona un género.' }),
  }),
  university: z.string().min(3, 'El centro educativo debe tener al menos 3 caracteres.'),
  major: z.string().min(3, 'La carrera debe tener al menos 3 caracteres.'),
  acceptPrivacy: z.boolean().refine(val => val === true, {
    message: "Debes aceptar la política de privacidad.",
  }),
});

export default function SignupForm() {
  const router = useRouter();
  const auth = getAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [createdUser, setCreatedUser] = useState<User | null>(null);
  const [isResending, setIsResending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      dni: '',
      phone: '',
      university: '',
      major: '',
      acceptPrivacy: false,
    },
  });

  async function handleResendVerification() {
    if (!createdUser) return;
    setIsResending(true);
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/login?email=${createdUser.email}`,
      };
      await sendEmailVerification(createdUser, actionCodeSettings);
      toast({
        title: "Correo reenviado",
        description: "Hemos enviado un nuevo enlace de verificación a tu correo.",
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
    setIsSubmitting(true);
    form.clearErrors();
    
    try {
      const usernameDocRef = doc(firestore, 'usernames', values.username.toLowerCase());
      const usernameDoc = await getDoc(usernameDocRef);
      if (usernameDoc.exists()) {
          form.setError('username', { message: 'Este nombre de usuario ya está en uso.' });
          setIsSubmitting(false);
          return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      setCreatedUser(user);

      try {
        const actionCodeSettings = {
            url: `${window.location.origin}/login?email=${user.email}`,
        };
        await sendEmailVerification(user, actionCodeSettings);
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        toast({
            variant: "destructive",
            title: "Error Crítico",
            description: "No pudimos enviar el correo de verificación. Por favor, contacta a soporte."
        });
        setIsSubmitting(false);
        return;
      }

      const batch = writeBatch(firestore);
      const userDocRef = doc(firestore, 'users', user.uid);
      batch.set(userDocRef, {
        id: user.uid,
        uid: user.uid,
        email: values.email,
        username: values.username.toLowerCase(),
        dni: values.dni,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        gender: values.gender,
        university: values.university,
        major: values.major,
        dateOfBirth: '',
        points: 0,
        photoURL: '',
        role: 'user',
        createdAt: serverTimestamp(),
      });
      
      const newUsernameRef = doc(firestore, 'usernames', values.username.toLowerCase());
      batch.set(newUsernameRef, { userId: user.uid });

      await batch.commit();
      
      await updateProfile(user, {
        displayName: `${values.firstName} ${values.lastName}`,
      });

      setShowVerificationMessage(true);

    } catch (error: any) {
      console.error("Error en el registro:", error);
      let errorMessage = 'No se pudo crear la cuenta. Inténtalo de nuevo.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo electrónico ya está en uso.';
        form.setError('email', { message: errorMessage });
      }
      toast({
        variant: "destructive",
        title: "Error en el registro",
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (showVerificationMessage) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>¡Último paso! Revisa tu correo</AlertTitle>
                <AlertDescription>
                    Te hemos enviado un enlace para verificar tu cuenta. Por favor, haz clic en él para poder iniciar sesión.
                    <br />
                    <span className="text-xs text-muted-foreground">¿No lo encuentras? Revisa tu carpeta de spam.</span>
                </AlertDescription>
            </Alert>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button onClick={() => router.push('/login')} className="w-full">Ir a Iniciar Sesión</Button>
                <Button variant="outline" onClick={handleResendVerification} disabled={isResending} className="w-full">
                    {isResending ? 'Reenviando...' : 'Reenviar correo'}
                </Button>
            </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
           <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="Juan" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                     <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="Pérez" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de usuario</FormLabel>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="juanperez" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  <FormLabel>Contraseña</FormLabel>
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
             <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Género</FormLabel>
                     <div className="relative">
                       <VenetianMask className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger className="pl-10">
                                    <SelectValue placeholder="Selecciona tu género" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Femenino">Femenino</SelectItem>
                                <SelectItem value="Masculino">Masculino</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                                <SelectItem value="Prefiero no decirlo">Prefiero no decirlo</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DNI</FormLabel>
                  <div className="relative">
                    <Fingerprint className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                      <Input placeholder="12345678" {...field} className="pl-10" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                      <Input placeholder="1122334455" {...field} className="pl-10" />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="university"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Centro Educativo</FormLabel>
                    <div className="relative">
                      <University className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="Ej: Universidad de Buenos Aires" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="major"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carrera</FormLabel>
                    <div className="relative">
                      <Library className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="Ej: Ingeniería en Informática" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="acceptPrivacy"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm mt-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        He leído y acepto la{' '}
                        <Link href="/politica-de-privacidad" className="text-primary hover:underline font-bold" target="_blank">
                          Política de Privacidad
                        </Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : <><UserPlus className="mr-2" />Registrarse</>}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
