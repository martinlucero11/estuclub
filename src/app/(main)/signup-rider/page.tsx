'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirestore, useAuthService } from '@/firebase';
import { doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, deleteUser } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Bike, User, Fingerprint, Phone, Mail, KeyRound, Camera, Car, ShieldCheck, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/lib/haptics';

export default function SignupRiderPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useAuthService();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [patente, setPatente] = useState('');
  const [fotoRostro, setFotoRostro] = useState<File | null>(null);
  const [fotoVehiculo, setFotoVehiculo] = useState<File | null>(null);
  const [acceptDDJJ, setAcceptDDJJ] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const isValid = firstName && lastName && email && password.length >= 8 && dni && phone && patente && fotoRostro && fotoVehiculo && acceptDDJJ && acceptPrivacy;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 1. Create Auth User
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      await updateProfile(user, { displayName: `${firstName} ${lastName}` });

      // 2. Upload photos to Google Drive
      let fotoRostroUrl = '';
      let fotoVehiculoUrl = '';

      try {
        const formData = new FormData();
        formData.append('fotoRostro', fotoRostro!);
        formData.append('fotoVehiculo', fotoVehiculo!);
        formData.append('userId', user.uid);
        formData.append('firstName', firstName);
        formData.append('lastName', lastName);
        formData.append('dni', dni);

        const uploadRes = await fetch('/api/upload-rider-docs', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          fotoRostroUrl = uploadData.fotoRostroLink || '';
          fotoVehiculoUrl = uploadData.fotoVehiculoLink || '';
        } else {
          console.error('Drive upload failed, continuing without photos');
        }
      } catch (uploadErr) {
        console.error('Drive upload error:', uploadErr);
      }

      // 3. Wait for auth propagation
      await new Promise(resolve => setTimeout(resolve, 800));

      // 4. Create Firestore profile + rider application
      const batch = writeBatch(firestore);

      const userRef = doc(firestore, 'users', user.uid);
      batch.set(userRef, {
        id: user.uid,
        uid: user.uid,
        email,
        firstName,
        lastName,
        dni,
        phone,
        role: 'rider_pending',
        patente: patente.toUpperCase(),
        photoURL: '',
        points: 0,
        isEmailVerified: false,
        createdAt: serverTimestamp(),
      });

      const appRef = doc(firestore, 'rider_applications', user.uid);
      batch.set(appRef, {
        userId: user.uid,
        userName: `${firstName} ${lastName}`,
        email,
        dni,
        phone,
        patente: patente.toUpperCase(),
        fotoRostroUrl,
        fotoVehiculoUrl,
        ddjjAntecedentes: true,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      await batch.commit();

      // 5. Send verification email
      try {
        await sendEmailVerification(user, { url: `${window.location.origin}/login` });
      } catch (emailErr) {
        console.error('Email verification error:', emailErr);
      }

      haptic.vibrateSuccess();
      setShowSuccess(true);

    } catch (error: any) {
      console.error('Rider signup error:', error);
      if (auth.currentUser) await deleteUser(auth.currentUser);

      let msg = 'Error al crear la cuenta. Intentá de nuevo.';
      if (error.code === 'auth/email-already-in-use') msg = 'Este email ya está en uso.';

      haptic.vibrateError();
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6">
        <Card className="w-full max-w-md rounded-[2rem] bg-slate-900 border-cyan-500/20 text-center">
          <CardContent className="pt-10 pb-8 px-8 space-y-6">
            <div className="mx-auto w-20 h-20 bg-cyan-500/20 rounded-[2rem] flex items-center justify-center border border-cyan-500/30">
              <ShieldCheck className="h-10 w-10 text-cyan-400 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tighter uppercase text-cyan-400">¡Solicitud Enviada!</h3>
              <p className="text-sm font-medium text-slate-400 leading-relaxed">
                Tu solicitud está siendo revisada por nuestro equipo. Te notificaremos cuando seas aprobado para recibir pedidos.
              </p>
            </div>
            <Button onClick={() => router.push('/login')} className="w-full h-12 rounded-xl bg-cyan-500 text-black font-black uppercase tracking-widest text-xs hover:bg-cyan-400">
              Ir a Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const inputClasses = "h-12 pl-12 rounded-xl bg-cyan-500/5 border-cyan-500/10 focus:border-cyan-500/30 focus:ring-cyan-500/10 transition-all font-medium text-slate-200 placeholder:text-slate-500";
  const labelClasses = "font-black uppercase tracking-widest text-[10px] ml-1 text-cyan-500/60";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#050505] p-6 overflow-hidden py-20">
      <div className="absolute top-[-5%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-5%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/5 blur-[120px] rounded-full" />

      <div className="w-full max-w-md z-10">
        <header className="mb-8 flex flex-col items-center text-center space-y-3">
          <Link href="/signup-choice" className="self-start flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
          </Link>
          <div className="h-16 w-16 rounded-[2rem] bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
            <Bike className="h-8 w-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-cyan-400 uppercase">Rider</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Registro de Repartidor</p>
        </header>

        <Card className="rounded-[2rem] bg-slate-900/80 border-cyan-500/10 backdrop-blur-xl overflow-hidden">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5 pt-8 px-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className={labelClasses}>Nombre</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input placeholder="Juan" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClasses} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClasses}>Apellido</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input placeholder="Pérez" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClasses} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={labelClasses}>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input type="email" placeholder="rider@email.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={labelClasses}>Contraseña</Label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className={inputClasses} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className={labelClasses}>DNI</Label>
                  <div className="relative">
                    <Fingerprint className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input placeholder="12345678" value={dni} onChange={e => setDni(e.target.value)} className={inputClasses} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClasses}>Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input placeholder="1122334455" value={phone} onChange={e => setPhone(e.target.value)} className={inputClasses} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={labelClasses}>Patente del Vehículo</Label>
                <div className="relative">
                  <Car className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input placeholder="AB123CD" value={patente} onChange={e => setPatente(e.target.value.toUpperCase())} className={`${inputClasses} uppercase`} />
                </div>
              </div>

              {/* Photo Uploads */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className={labelClasses}>Foto Rostro</Label>
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-cyan-500/20 rounded-xl bg-cyan-500/5 cursor-pointer hover:bg-cyan-500/10 transition-all">
                    <input type="file" accept="image/*" capture="user" className="hidden" onChange={e => setFotoRostro(e.target.files?.[0] || null)} />
                    <Camera className="h-6 w-6 text-cyan-400 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-cyan-500/60 text-center">
                      {fotoRostro ? '✅ Cargada' : 'Selfie'}
                    </span>
                  </label>
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClasses}>Foto Vehículo</Label>
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-cyan-500/20 rounded-xl bg-cyan-500/5 cursor-pointer hover:bg-cyan-500/10 transition-all">
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setFotoVehiculo(e.target.files?.[0] || null)} />
                    <Car className="h-6 w-6 text-cyan-400 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-cyan-500/60 text-center">
                      {fotoVehiculo ? '✅ Cargada' : 'Vehículo'}
                    </span>
                  </label>
                </div>
              </div>

              {/* DDJJ */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Checkbox checked={acceptDDJJ} onCheckedChange={(v) => setAcceptDDJJ(!!v)} className="mt-0.5 border-amber-500/40 data-[state=checked]:bg-amber-500" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" /> Declaración Jurada
                  </p>
                  <p className="text-[9px] text-amber-500/70 font-medium leading-relaxed">
                    Declaro bajo juramento no poseer antecedentes penales y que la información proporcionada es verídica. Entiendo que cualquier falsedad puede derivar en acciones legales.
                  </p>
                </div>
              </div>

              {/* Privacy */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                <Checkbox checked={acceptPrivacy} onCheckedChange={(v) => setAcceptPrivacy(!!v)} className="border-cyan-500/30 data-[state=checked]:bg-cyan-500" />
                <p className="text-[10px] font-bold text-slate-400">
                  Acepto la <Link href="/politica-de-privacidad" className="text-cyan-400 font-black uppercase tracking-widest text-[9px]" target="_blank">Política de Privacidad</Link>
                </p>
              </div>
            </CardContent>

            <CardFooter className="pb-8 pt-4 px-6">
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="w-full h-14 rounded-2xl bg-cyan-500 text-black font-black uppercase tracking-[0.2em] text-sm hover:bg-cyan-400 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(6,182,212,0.3)] disabled:opacity-30"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Bike className="mr-2 h-5 w-5" />Enviar Solicitud</>}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs font-bold text-slate-500">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-widest text-[10px] ml-1">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
