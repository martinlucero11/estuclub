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
  isStudent: z.boolean().default(false),
  institution: z.string().optional(),
  educationLevel: z.enum(['Secundario', 'Terciario', 'Universitario', 'Academia', 'Cursos', 'Talleres']).optional(),
  career: z.string().optional(),
  educationYear: z.string().optional(),
  acceptPrivacy: z.boolean().refine(val => val === true, {
    message: "Debes aceptar la política de privacidad.",
  }),
  birthDate: z.string().min(10, 'La fecha de nacimiento es obligatoria.'),
  requestCluber: z.boolean().default(false),
}).refine((data) => {
    if (data.isStudent) {
        return !!data.institution && data.institution.length >= 3;
    }
    return true;
}, {
    message: "La institución es obligatoria para estudiantes.",
    path: ["institution"]
}).refine((data) => {
    if (data.isStudent && data.educationLevel !== 'Secundario') {
        return !!data.career && data.career.length >= 3;
    }
    return true;
}, {
    message: "La carrera es obligatoria para este nivel.",
    path: ["career"]
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
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

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
      isStudent: false,
      institution: '',
      career: '',
      acceptPrivacy: false,
      birthDate: '',
      gender: 'Masculino',
      educationLevel: 'Universitario',
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

      // 1. Create User in Auth FIRST (to get UID for filename)
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      setCreatedUser(user);
      console.log("Auth user created successfully:", user.uid);

      // 2. Upload certificate to Google Drive via API
      let certificateUrl = '';
      if (values.isStudent && certificateFile) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', certificateFile);
          uploadFormData.append('userId', user.uid);
          uploadFormData.append('firstName', values.firstName);
          uploadFormData.append('lastName', values.lastName);
          uploadFormData.append('dni', values.dni);

          try {
              const uploadRes = await fetch('/api/upload-student-doc', {
                  method: 'POST',
                  body: uploadFormData,
              });

              if (!uploadRes.ok) {
                  const errorData = await uploadRes.json();
                  throw new Error(errorData.error || 'Fallo la carga del certificado');
              }

              const uploadData = await uploadRes.json();
              certificateUrl = uploadData.webViewLink || uploadData.fileId;
              console.log("Certificate uploaded successfully:", certificateUrl);
          } catch (uploadError: any) {
              console.error("Error uploading certificate:", uploadError);
              // Rollback Auth user if upload fails
              await deleteUser(user);
              throw new Error(`Error al subir el certificado: ${uploadError.message}`);
          }
      }

      // ADDED: Small delay to ensure Auth state propagates to Security Rules
      console.log("Waiting for auth state to propagate...");
      await new Promise(resolve => setTimeout(resolve, 800));

      // 3. Prepare Firestore Profile
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
        isStudent: values.isStudent,
        studentStatus: values.isStudent ? (certificateFile ? 'submitted' : 'pending') : undefined,
        certificateDeadline: (values.isStudent && !certificateFile) 
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
          : null,
        educationLevel: values.isStudent ? values.educationLevel : '',
        educationYear: values.isStudent ? values.educationYear || '' : '',
        institution: values.isStudent ? values.institution || '' : '',
        career: values.isStudent ? values.career || '' : '',
        studentCertificateUrl: certificateUrl,
        points: 0,
        photoURL: '',
        role: 'user',
        isEmailVerified: false,
        wantsToBeCluber: !!values.requestCluber,
        createdAt: serverTimestamp(),
      });
      
      const newUsernameRef = doc(firestore, 'usernames', values.username.toLowerCase());
      batch.set(newUsernameRef, { userId: user.uid });

      // If they want to be a Cluber
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
      }

      console.log("Committing Firestore batch...");
      await batch.commit();

      // 4. Update Auth Profile
      await updateProfile(user, {
        displayName: `${values.firstName} ${values.lastName}`,
      });

      // 5. Send Email Verification
      try {
        const actionCodeSettings = {
            url: `${window.location.origin}/login?email=${user.email}`,
        };
        await sendEmailVerification(user, actionCodeSettings);
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
      }

      haptic.vibrateSuccess();
      setShowVerificationMessage(true);

    } catch (error: any) {
      console.error("Error en el registro:", error);
      if (auth.currentUser) await deleteUser(auth.currentUser);
      let errorMessage = 'No se pudo crear la cuenta. Inténtalo de nuevo.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este correo electrónico ya está en uso.';
        form.setError('email', { message: errorMessage });
      }
      haptic.vibrateError();
      toast({ variant: "destructive", title: "Error en el registro", description: errorMessage });
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
            <div className="flex flex-col gap-3 pt-4">
                <Button onClick={() => router.push('/login')} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
                    Ir a Iniciar Sesión
                </Button>
                <Button variant="ghost" onClick={handleResendVerification} disabled={isResending} className="w-full font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all">
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
            <div className="p-5 rounded-[1.5rem] bg-primary/5 border border-primary/10 space-y-3 mb-2">
                <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Inscripción</h4>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground/70">Completa tus datos para unirte al club.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClasses}>Nombre</FormLabel>
                    <div className="relative group/input">
                      <UserIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <FormControl><Input placeholder="Juan" {...field} className={inputClasses} /></FormControl>
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
                      <UserIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <FormControl><Input placeholder="Pérez" {...field} className={inputClasses} /></FormControl>
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
                    <AtSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <FormControl><Input placeholder="juanperez" {...field} className={inputClasses} /></FormControl>
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
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <FormControl><Input placeholder="tu@email.com" {...field} className={inputClasses} /></FormControl>
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
                    <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <FormControl><Input type="password" placeholder="••••••••" {...field} className={inputClasses} /></FormControl>
                  </div>
                  <FormMessage className="text-[10px] font-bold" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dni"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClasses}>DNI</FormLabel>
                    <div className="relative group/input">
                      <Fingerprint className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <FormControl><Input placeholder="12345678" {...field} className={inputClasses} /></FormControl>
                    </div>
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
                      <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <FormControl><Input placeholder="1122334455" {...field} className={inputClasses} /></FormControl>
                    </div>
                    <FormMessage className="text-[10px] font-bold" />
                  </FormItem>
                )}
              />
            </div>

            {/* Student Toggle */}
            <FormField
              control={form.control}
              name="isStudent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-2xl bg-primary/10 p-4 border border-primary/20 shadow-lg shadow-primary/5">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} className="rounded-md border-primary/40 data-[state=checked]:bg-primary" />
                  </FormControl>
                  <div className="space-y-0.5">
                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-primary cursor-pointer select-none">Soy Estudiante</FormLabel>
                    <p className="text-[9px] font-bold text-muted-foreground/60 leading-none">Accede al club de beneficios exclusivos.</p>
                  </div>
                </FormItem>
              )}
            />

            {/* Conditional Student Fields */}
            {form.watch('isStudent') && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="space-y-4 p-4 rounded-2xl border border-primary/10 bg-primary/5"
              >
                <FormField
                  control={form.control}
                  name="institution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Institución Educativa</FormLabel>
                      <div className="relative group/input">
                        <University className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <FormControl><Input placeholder="Ej: Universidad de Buenos Aires" {...field} className={inputClasses} /></FormControl>
                      </div>
                      <FormMessage className="text-[10px] font-bold" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="educationLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Nivel Educativo</FormLabel>
                      <div className="relative group/input">
                        <Library className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className={cn(inputClasses, "pr-4")}><SelectValue placeholder="Selecciona nivel" /></SelectTrigger></FormControl>
                          <SelectContent className="rounded-2xl border-primary/10 glass glass-dark">
                            {['Secundario', 'Terciario', 'Universitario', 'Academia', 'Cursos', 'Talleres'].map((level) => (
                              <SelectItem key={level} value={level} className="rounded-xl">{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch('educationLevel') !== 'Secundario' && (
                  <FormField
                    control={form.control}
                    name="career"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={labelClasses}>Carrera / Especialidad</FormLabel>
                        <div className="relative group/input">
                          <Briefcase className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <FormControl><Input placeholder="Ej: Ingeniería en Informática" {...field} className={inputClasses} /></FormControl>
                        </div>
                        <FormMessage className="text-[10px] font-bold" />
                      </FormItem>
                    )}
                  />
                )}

                {/* File Upload Field */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <FormLabel className={labelClasses}>Certificado de Alumno Regular</FormLabel>
                        {!certificateFile && (
                            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                <p className="text-[9px] font-bold text-amber-500/80 leading-tight">
                                    ¡Ojo! Si no lo subís ahora, tenés <span className="underline">7 días</span> para hacerlo desde tu perfil.
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/20 rounded-2xl bg-background/50 hover:bg-background/80 transition-all cursor-pointer relative group/file">
                        <input 
                            type="file" 
                            accept=".pdf,image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                            onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                        />
                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="p-3 bg-primary/10 rounded-xl group-hover/file:scale-110 transition-transform">
                                <UserPlus className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                {certificateFile ? certificateFile.name : "Subir archivo (PDF o Imagen)"}
                            </span>
                            <p className="text-[9px] font-bold text-muted-foreground/60 italic">Máximo 5MB • Formato PDF o JPG/PNG</p>
                        </div>
                    </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelClasses}>Nacimiento</FormLabel>
                      <FormControl><Input type="date" {...field} className={cn(inputClasses, "pl-4 block w-full text-xs")} /></FormControl>
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
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                             <FormControl><SelectTrigger className={cn(inputClasses, "pl-4 pr-4")}><SelectValue placeholder="Género" /></SelectTrigger></FormControl>
                             <SelectContent className="rounded-2xl border-primary/10 glass glass-dark">
                                 <SelectItem value="Femenino" className="rounded-xl">Femenino</SelectItem>
                                 <SelectItem value="Masculino" className="rounded-xl">Masculino</SelectItem>
                                 <SelectItem value="Otro" className="rounded-xl">Otro</SelectItem>
                                 <SelectItem value="Prefiero no decirlo" className="rounded-xl">Prefiero no decirlo</SelectItem>
                             </SelectContent>
                         </Select>
                      </div>
                    </FormItem>
                  )}
                />
            </div>

            <FormField
              control={form.control}
              name="acceptPrivacy"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl bg-primary/5 p-4 border border-primary/5">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-[11px] font-bold text-muted-foreground/80 cursor-pointer">He leído y acepto la <Link href="/politica-de-privacidad" className="text-primary font-black uppercase tracking-widest text-[10px] hover:underline" target="_blank">Política de Privacidad</Link></FormLabel>
                    <FormMessage className="text-[10px] font-bold" />
                  </div>
                </FormItem>
              )}
            />

            {/* Cluber Request */}
            <FormField
              control={form.control}
              name="requestCluber"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-2xl bg-primary/5 p-4 border border-primary/5 mb-2">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <div className="space-y-0.5">
                    <FormLabel className="text-[11px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer">Solicitar ser Cluber</FormLabel>
                    <p className="text-[9px] font-bold text-muted-foreground/40 leading-none italic">Si tienes un comercio, únete a nuestra red.</p>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="pb-10 pt-4 px-8">
            <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.98]">
              {isSubmitting ? 'Registrando...' : <><UserPlus className="mr-2 h-4 w-4" />Registrarse</>}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
