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
import { KeyRound, Mail, UserPlus, Fingerprint, Phone, User as UserIcon, AtSign, VenetianMask, University, Library, AlertCircle, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useAuthService } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, writeBatch, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, deleteUser, User } from 'firebase/auth';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { haptic } from '@/lib/haptics';
import { motion } from 'framer-motion';

const formSchema = z.object({
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres.'),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres.').regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos.'),
  email: z.string().min(1, { message: "El correo electrónico es obligatorio." }).refine(email => /.+@.+\..+/.test(email), {
    message: "Por favor, introduce un correo electrónico válido.",
  }),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula.')
    .regex(/[0-9]/, 'Debe contener al menos un número.')
    .regex(/[^a-zA-Z0-9]/, 'Debe contener al menos un carácter especial (@, #, $, etc).'),
  dni: z.string().regex(/^\d{7,10}$/, 'El DNI o documento debe ser válido.'),
  phone: z.string().min(6, 'El número de teléfono no es válido.'),
  gender: z.enum(['Masculino', 'Femenino', 'Otro', 'Prefiero no decirlo'], {
    errorMap: () => ({ message: 'Por favor, selecciona un género.' }),
  }),
  university: z.string().min(3, 'El centro educativo debe tener al menos 3 caracteres.'),
  major: z.string().min(3, 'La carrera debe tener al menos 3 caracteres.'),
  acceptPrivacy: z.boolean().refine(val => val === true, {
    message: "Debes aceptar la política de privacidad.",
  }),
  birthDate: z.string().min(10, 'La fecha de nacimiento es obligatoria.'),
  educationLevel: z.enum(['Secundario', 'Superior', 'Terciario', 'Universitario', 'Academia', 'Cursos', 'Talleres'], {
    errorMap: () => ({ message: 'Por favor, selecciona tu nivel educativo.' }),
  }),
  educationYear: z.string().optional(),
  requestCluber: z.boolean().default(false),
});

export default function SignupForm() {
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useAuthService();
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
      birthDate: '',
      gender: 'Masculino',
      educationLevel: 'Universitario' as any,
      educationYear: '1',
      requestCluber: false,
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

      // 1. Create User in Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      setCreatedUser(user);
      console.log("Auth user created successfully:", user.uid);

      // ADDED: Small delay to ensure Auth state propagates to Security Rules
      console.log("Waiting for auth state to propagate...");
      await new Promise(resolve => setTimeout(resolve, 800));

      // 2. Prepare Firestore Profile (ensure it exists before verification)
      const batch = writeBatch(firestore);
      const userDocRef = doc(firestore, 'users', user.uid);
      batch.set(userDocRef, {
        id: user.uid,
        uid: user.uid,
        email: values.email,
        username: values.username.toLowerCase(),
        dni: values.dni,
        firstName: values.firstName || '',
        lastName: values.lastName || '',
        phone: values.phone || '',
        gender: values.gender || 'Masculino',
        educationLevel: values.educationLevel,
        educationYear: values.educationYear || '',
        university: values.university || '',
        major: values.major || '',
        dateOfBirth: values.birthDate || '',
        points: 0,
        photoURL: '',
        role: 'user',
        isEmailVerified: false,
        wantsToBeCluber: !!values.requestCluber,
        createdAt: serverTimestamp(),
      });
      
      const newUsernameRef = doc(firestore, 'usernames', values.username.toLowerCase());
      batch.set(newUsernameRef, { userId: user.uid });

      // If they want to be a Cluber, create a request record
      if (values.requestCluber) {
          const requestRef = doc(collection(firestore, 'supplier_requests'));
          batch.set(requestRef, {
              userId: user.uid,
              userEmail: values.email,
              userName: `${values.firstName} ${values.lastName}`,
              status: 'pending',
              createdAt: serverTimestamp(),
              requestedAt: serverTimestamp(),
          });
          console.log("Cluber request added to batch.");
      }

      console.log("Committing Firestore batch...");
      await batch.commit();
      console.log("Firestore batch committed successfully.");

      // 3. Update Auth Profile
      console.log("Updating Auth profile...");
      await updateProfile(user, {
        displayName: `${values.firstName} ${values.lastName}`,
      });
      console.log("Auth profile updated.");

      // 4. Send Email Verification (Last step)
      console.log("Attempting to send email verification...");
      try {
        const actionCodeSettings = {
            url: `${window.location.origin}/login?email=${user.email}`,
        };
        await sendEmailVerification(user, actionCodeSettings);
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        toast({
            variant: "destructive",
            title: "Correo no enviado",
            description: "Tu cuenta se creó pero no pudimos enviar el correo. Podrás solicitarlo al iniciar sesión."
        });
        // We don't return here because the user is already created and Firestore is set.
      }

      haptic.vibrateSuccess();
      setShowVerificationMessage(true);

      return; // Success

    } catch (error: any) {
      console.error("Error en el registro:", error);
      
      // ROLLBACK: If Auth was created but Firestore failed, delete Auth user
      if (auth.currentUser) {
          try {
              await deleteUser(auth.currentUser);
              console.log("Auth user rolled back due to Firestore/Registration failure.");
          } catch (deleteError) {
              console.error("Failed to rollback Auth user:", deleteError);
          }
      }

      let errorMessage = 'No se pudo crear la cuenta. Inténtalo de nuevo.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo electrónico ya está en uso.';
        form.setError('email', { message: errorMessage });
      } else if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        errorMessage = 'Error de permisos al crear el perfil. Por favor, contacta a soporte.';
      }

      haptic.vibrateError();
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
      <Card className="rounded-[2rem] border-primary/5 glass glass-dark shadow-premium overflow-hidden">
        <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-4 border border-primary/10 shadow-lg shadow-primary/5">
                <Mail className="h-10 w-10 text-primary animate-bounce" />
            </div>
            <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tighter uppercase text-foreground">¡Casi listo!</h3>
                <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed italic">
                    Te hemos enviado un enlace para verificar tu cuenta. Revisa tu bandeja de entrada.
                </p>
            </div>
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-xs font-bold text-muted-foreground/70">
                ¿No lo encuentras? Revisa tu carpeta de spam o promociones.
            </div>
            <div className="flex flex-col gap-3 pt-4">
                <Button 
                    onClick={() => router.push('/login')} 
                    className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                >
                    Ir a Iniciar Sesión
                </Button>
                <Button 
                    variant="ghost" 
                    onClick={handleResendVerification} 
                    disabled={isResending} 
                    className="w-full font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all"
                >
                    {isResending ? 'Reenviando...' : 'Reenviar enlace'}
                </Button>
            </div>
        </CardContent>
      </Card>
    )
  }

  const inputClasses = "h-12 pl-12 rounded-xl bg-primary/5 border-primary/5 focus:border-primary/20 focus:ring-primary/10 transition-all font-medium";
  const labelClasses = "font-black uppercase tracking-widest text-[10px] ml-1 opacity-70";

  return (
    <Card className="rounded-[2rem] border-primary/5 glass glass-dark shadow-premium overflow-hidden">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
           <CardContent className="space-y-6 pt-10 px-8">
            {/* Requirements Card */}
            <div className="p-5 rounded-[1.5rem] bg-primary/5 border border-primary/10 space-y-3 mb-2">
                <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Requisitos de Inscripción</h4>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/70">
                        <div className="w-1 h-1 bg-primary/40 rounded-full" />
                        <span>Contraseña: 8+ caracteres, mayúscula y símbolo</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/70">
                        <div className="w-1 h-1 bg-primary/40 rounded-full" />
                        <span>DNI: Documento nacional de identidad válido</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/70">
                        <div className="w-1 h-1 bg-primary/40 rounded-full" />
                        <span>Email: Requiere verificación posterior</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClasses}>Nombre</FormLabel>
                    <div className="relative group/input">
                      <UserIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <FormControl>
                        <Input placeholder="Juan" {...field} className={inputClasses} />
                      </FormControl>
                    </div>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClasses}>Apellido</FormLabel>
                     <div className="relative group/input">
                      <UserIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <FormControl>
                        <Input placeholder="Pérez" {...field} className={inputClasses} />
                      </FormControl>
                    </div>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClasses}>Nombre de usuario</FormLabel>
                    <div className="relative group/input">
                      <AtSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <FormControl>
                        <Input placeholder="juanperez" {...field} className={inputClasses} />
                      </FormControl>
                    </div>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClasses}>Correo Electrónico</FormLabel>
                   <div className="relative group/input">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                    <FormControl>
                      <Input placeholder="tu@email.com" {...field} className={inputClasses} />
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
                  <FormLabel className={labelClasses}>Contraseña</FormLabel>
                  <div className="relative group/input">
                    <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className={inputClasses} />
                    </FormControl>
                  </div>
                  <FormMessage className="text-[10px] font-bold" />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClasses}>Género</FormLabel>
                     <div className="relative group/input">
                       <VenetianMask className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors z-10" />
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger className={cn(inputClasses, "pr-4")}>
                                    <SelectValue placeholder="Selecciona tu género" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-2xl border-primary/10 glass glass-dark">
                                <SelectItem value="Femenino" className="rounded-xl focus:bg-primary/10">Femenino</SelectItem>
                                <SelectItem value="Masculino" className="rounded-xl focus:bg-primary/10">Masculino</SelectItem>
                                <SelectItem value="Otro" className="rounded-xl focus:bg-primary/10">Otro</SelectItem>
                                <SelectItem value="Prefiero no decirlo" className="rounded-xl focus:bg-primary/10">Prefiero no decirlo</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                     <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="dni"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClasses}>DNI</FormLabel>
                  <div className="relative group/input">
                    <Fingerprint className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                    <FormControl>
                      <Input placeholder="12345678" {...field} className={inputClasses} />
                    </FormControl>
                  </div>
                  <FormMessage className="text-[10px] font-bold" />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Fecha de Nacimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className={cn(inputClasses, "pl-4 block w-full text-xs")} />
                      </FormControl>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Teléfono</FormLabel>
                      <div className="relative group/input">
                        <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                        <FormControl>
                          <Input placeholder="1122334455" {...field} className={inputClasses} />
                        </FormControl>
                      </div>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />
            </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="educationLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Nivel Educativo</FormLabel>
                      <div className="relative group/input">
                        <Library className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors z-10" />
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className={cn(inputClasses, "pr-4")}>
                              <SelectValue placeholder="Selecciona nivel" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl border-primary/10 glass glass-dark">
                            {['Secundario', 'Superior', 'Terciario', 'Universitario', 'Academia', 'Cursos', 'Talleres'].map((level) => (
                              <SelectItem key={level} value={level} className="rounded-xl focus:bg-primary/10">{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />

                {(form.watch('educationLevel') === 'Secundario' || form.watch('educationLevel') === 'Universitario') && (
                  <FormField
                    control={form.control}
                    name="educationYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClasses}>Año de cursada</FormLabel>
                        <div className="relative group/input">
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className={cn(inputClasses, "pl-4 pr-4")}>
                                <SelectValue placeholder="Selecciona año" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-2xl border-primary/10 glass glass-dark">
                              {['1', '2', '3', '4', '5', '6'].map((year) => (
                                <SelectItem key={year} value={year} className="rounded-xl focus:bg-primary/10">{year}° Año</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="university"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClasses}>Institución / Centro</FormLabel>
                    <div className="relative group/input">
                      <University className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <FormControl>
                        <Input placeholder="Ej: Universidad de Buenos Aires" {...field} className={inputClasses} />
                      </FormControl>
                    </div>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="major"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClasses}>Carrera / Especialidad</FormLabel>
                    <div className="relative group/input">
                      <Briefcase className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <FormControl>
                        <Input placeholder="Ej: Ingeniería en Informática" {...field} className={inputClasses} />
                      </FormControl>
                    </div>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="acceptPrivacy"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl bg-primary/5 p-4 border border-primary/5 mt-6 mb-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5 rounded-md border-primary/20 data-[state=checked]:bg-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-[11px] font-bold text-muted-foreground/80 cursor-pointer select-none">
                        He leído y acepto la{' '}
                        <Link href="/politica-de-privacidad" className="text-primary hover:text-primary/80 transition-colors font-black uppercase tracking-widest text-[10px] underline-offset-4 hover:underline" target="_blank">
                          Política de Privacidad
                        </Link>
                      </FormLabel>
                      <FormMessage className="text-[10px] font-bold" />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requestCluber"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-2xl bg-primary/10 p-4 border border-primary/20 mt-4 mb-2 shadow-lg shadow-primary/5">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="rounded-md border-primary/40 data-[state=checked]:bg-primary"
                      />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel className="text-[11px] font-black uppercase tracking-widest text-primary cursor-pointer select-none">
                        Solicitar ser Cluber
                      </FormLabel>
                      <p className="text-[9px] font-bold text-muted-foreground/60 leading-none">
                        Si tienes un comercio, únete a nuestra red.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
          </CardContent>
          <CardFooter className="pb-10 pt-4 px-8">
            <Button 
                type="submit" 
                onClick={() => haptic.vibrateImpact()}
                className="w-full h-12 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
                disabled={isSubmitting}
            >
              {isSubmitting ? 'Registrando...' : <><UserPlus className="mr-2 h-4 w-4" />Registrarse</>}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
