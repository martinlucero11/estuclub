
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
import { KeyRound, Mail, UserPlus, Fingerprint, Phone, User as UserIcon, AtSign, VenetianMask, University, Library } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, getDoc, writeBatch, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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
});

export default function SignupForm() {
  const router = useRouter();
  const auth = getAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
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

      if (user) {
        await updateProfile(user, {
          displayName: `${values.firstName} ${values.lastName}`,
        });
        
        // Temporarily disabled email verification
        // await sendEmailVerification(user);

        const batch = writeBatch(firestore);

        const userProfileRef = doc(firestore, 'users', user.uid);
        const newUsernameRef = doc(firestore, 'usernames', values.username.toLowerCase());

        const userProfile = {
          id: user.uid,
          email: values.email,
          username: values.username.toLowerCase(),
          dni: values.dni,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          gender: values.gender,
          university: values.university,
          major: values.major,
          dateOfBirth: '', // This can be added later
          points: 0,
          photoURL: '', // Initialize with empty photoURL
        };

        batch.set(userProfileRef, userProfile);
        batch.set(newUsernameRef, { userId: user.uid });

        await batch.commit();

        toast({
          title: '¡Cuenta Creada!',
          description: 'Tu cuenta ha sido creada con éxito. Serás redirigido.',
        });
        
        router.push('/');
      }
    } catch (error: any) {
      console.error("Signup failed:", error);
      toast({
        variant: "destructive",
        title: "Error en el registro",
        description: error.code === 'auth/email-already-in-use' 
            ? 'Este correo electrónico ya está en uso.'
            : 'No se pudo crear la cuenta. Inténtalo de nuevo.'
      });
    } finally {
        setIsSubmitting(false);
    }
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
