'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore, useAuthService } from '@/firebase';
import { doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, Mail, KeyRound, MapPin, FileText, Loader2, ArrowLeft, CheckCircle, Tag, LogIn } from 'lucide-react';
import { haptic } from '@/lib/haptics';
import { motion, AnimatePresence } from 'framer-motion';

const RUBROS = [
  'Comidas & Bebidas',
  'Kiosco & Snacks',
  'Librería & Fotocopias',
  'Indumentaria',
  'Tecnología',
  'Salud & Bienestar',
  'Servicios',
  'Otro',
];

// ─── LOGIN FORM ──────────────────────────────────────────
function CluberLogin({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
    const auth = useAuthService();
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            haptic.vibrateSuccess();
            router.push('/panel-cluber');
        } catch (err: any) {
            haptic.vibrateError();
            toast({ variant: 'destructive', title: 'Error', description: err.code === 'auth/invalid-credential' ? 'Email o contraseña incorrectos.' : 'Error al iniciar sesión.' });
        } finally {
            setLoading(false);
        }
    };

    const ic = "h-12 pl-12 rounded-xl bg-amber-500/5 border-amber-500/10 focus:border-amber-500/30 focus:ring-amber-500/10 transition-all font-medium placeholder:text-muted-foreground/40";

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto z-10">
            <header className="mb-8 flex flex-col items-center text-center space-y-3">
                <Link href="/" className="self-start flex items-center gap-2 text-muted-foreground hover:text-amber-500 transition-colors mb-4">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Estuclub</span>
                </Link>
                <div className="h-16 w-16 rounded-[2rem] bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                    <Store className="h-8 w-8 text-amber-500" />
                </div>
                <h1 className="text-3xl font-black tracking-tighter text-amber-500 uppercase">Cluber</h1>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">Acceso Comercios</p>
            </header>

            <Card className="rounded-[2rem] border-amber-500/10 overflow-hidden bg-background/80 backdrop-blur-xl">
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4 pt-8 px-6">
                        <div className="space-y-1.5">
                            <Label className="font-black uppercase tracking-widest text-[10px] text-amber-500/60 ml-1">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input type="email" placeholder="comercio@email.com" value={email} onChange={e => setEmail(e.target.value)} className={ic} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="font-black uppercase tracking-widest text-[10px] text-amber-500/60 ml-1">Contraseña</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className={ic} />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="px-6 pb-6 pt-2 flex flex-col gap-3">
                        <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl bg-amber-500 text-black font-black uppercase tracking-[0.2em] text-sm hover:bg-amber-400 disabled:opacity-30">
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><LogIn className="mr-2 h-5 w-5" />Ingresar a mi Comercio</>}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <button onClick={onSwitchToSignup} className="mt-6 block mx-auto text-xs font-bold text-muted-foreground hover:text-amber-500 transition-colors">
                ¿No tenés cuenta? <span className="font-black text-amber-500 uppercase tracking-widest text-[10px] ml-1">Registrá tu comercio</span>
            </button>
        </motion.div>
    );
}

// ─── SIGNUP FORM ─────────────────────────────────────────
function CluberSignup({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useAuthService();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [nombreLocal, setNombreLocal] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cuit, setCuit] = useState('');
  const [direccion, setDireccion] = useState('');
  const [rubro, setRubro] = useState('');
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const isValid = nombreLocal && email && password.length >= 8 && cuit && direccion && rubro && acceptPrivacy;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      await updateProfile(user, { displayName: nombreLocal });
      await new Promise(resolve => setTimeout(resolve, 800));

      const batch = writeBatch(firestore);
      batch.set(doc(firestore, 'users', user.uid), {
        id: user.uid, uid: user.uid, email, firstName: nombreLocal, lastName: '',
        role: 'supplier', photoURL: '', points: 0, isEmailVerified: false, createdAt: serverTimestamp(),
      });
      batch.set(doc(firestore, 'roles_supplier', user.uid), {
        name: nombreLocal, cuit, address: direccion, category: rubro,
        isApproved: false, isActive: true, ownerId: user.uid,
        ownerEmail: email, createdAt: serverTimestamp(),
      });
      await batch.commit();

      try { await sendEmailVerification(user, { url: `${window.location.origin}/cluber` }); } catch (emailErr) {}

      haptic.vibrateSuccess();
      setShowSuccess(true);
    } catch (error: any) {
      if (auth.currentUser) await deleteUser(auth.currentUser);
      haptic.vibrateError();
      toast({ variant: 'destructive', title: 'Error', description: error.code === 'auth/email-already-in-use' ? 'Este email ya está en uso.' : 'Error al crear la cuenta.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (showSuccess) {
    return (
      <div className="w-full max-w-md mx-auto z-10 text-center space-y-6 animate-in fade-in slide-in-from-bottom-6">
          <div className="mx-auto w-20 h-20 bg-amber-500/20 rounded-[2rem] flex items-center justify-center border border-amber-500/30">
            <CheckCircle className="h-10 w-10 text-amber-500 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tighter uppercase text-amber-500">¡Bienvenido, Cluber!</h3>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              Tu cuenta está lista. Ya podés cargar tus productos. Aparecerán en la app cuando nuestro equipo valide tu comercio.
            </p>
          </div>
          <Button onClick={onSwitchToLogin} className="w-full h-12 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-xs hover:bg-amber-400">
            Ir a Iniciar Sesión
          </Button>
      </div>
    );
  }

  const ic = "h-11 pl-11 rounded-xl bg-amber-500/5 border-amber-500/10 focus:border-amber-500/30 focus:ring-amber-500/10 transition-all font-medium placeholder:text-muted-foreground/40 text-sm";
  const lc = "font-black uppercase tracking-widest text-[9px] ml-1 text-amber-500/60";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto z-10">
        <header className="mb-6 flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 rounded-[2rem] bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <Store className="h-8 w-8 text-amber-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-amber-500 uppercase">Registro Cluber</h1>
        </header>

        <Card className="rounded-[2rem] border-amber-500/10 overflow-hidden bg-background/80 backdrop-blur-xl">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-3.5 pt-6 px-5">
              <div className="space-y-1">
                <Label className={lc}>Nombre del Local</Label>
                <div className="relative"><Store className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Mi Comercio" value={nombreLocal} onChange={e => setNombreLocal(e.target.value)} className={ic} /></div>
              </div>
              <div className="space-y-1">
                <Label className={lc}>Email</Label>
                <div className="relative"><Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="email" placeholder="comercio@email.com" value={email} onChange={e => setEmail(e.target.value)} className={ic} /></div>
              </div>
              <div className="space-y-1">
                <Label className={lc}>Contraseña</Label>
                <div className="relative"><KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="password" placeholder="Min 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} className={ic} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className={lc}>CUIT</Label>
                    <div className="relative"><FileText className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="20-12345678-9" value={cuit} onChange={e => setCuit(e.target.value)} className={ic} /></div>
                  </div>
                  <div className="space-y-1">
                    <Label className={lc}>Rubro</Label>
                    <div className="relative">
                      <Tag className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
                      <Select onValueChange={setRubro}>
                        <SelectTrigger className={`${ic} pr-4`}><SelectValue placeholder="Categoría" /></SelectTrigger>
                        <SelectContent className="rounded-xl">{RUBROS.map(r => (<SelectItem key={r} value={r} className="rounded-lg">{r}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </div>
              </div>
              <div className="space-y-1">
                <Label className={lc}>Dirección del Local</Label>
                <div className="relative"><MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Av. Corrientes 1234" value={direccion} onChange={e => setDireccion(e.target.value)} className={ic} /></div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <Checkbox checked={acceptPrivacy} onCheckedChange={(v) => setAcceptPrivacy(!!v)} className="border-amber-500/30 data-[state=checked]:bg-amber-500" />
                <p className="text-[9px] font-bold text-muted-foreground">Acepto la <Link href="/politica-de-privacidad" className="text-amber-500 font-black uppercase tracking-widest text-[9px]" target="_blank">Privacidad</Link></p>
              </div>
            </CardContent>
            <CardFooter className="pb-6 pt-2 px-5">
              <Button type="submit" disabled={!isValid || isSubmitting} className="w-full h-14 rounded-2xl bg-amber-500 text-black font-black uppercase tracking-[0.2em] text-sm hover:bg-amber-400 disabled:opacity-30">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Store className="mr-2 h-5 w-5" />Registrar Comercio</>}
              </Button>
            </CardFooter>
          </form>
        </Card>
        <button onClick={onSwitchToLogin} className="mt-4 block mx-auto text-xs font-bold text-muted-foreground hover:text-amber-500 transition-colors">
            ¿Ya tenés cuenta? <span className="font-black text-amber-500 uppercase tracking-widest text-[10px] ml-1">Ingresar</span>
        </button>
    </motion.div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────
export default function CluberPage() {
    const { user, isUserLoading, userData } = useUser();
    const router = useRouter();
    const [view, setView] = useState<'login' | 'signup'>('login');

    useEffect(() => {
        if (!isUserLoading && user && userData) {
            if (userData.role === 'supplier' || userData.role === 'admin') {
                router.push('/panel-cluber');
            } else {
                router.push('/');
            }
        }
    }, [user, isUserLoading, userData, router]);

    if (isUserLoading || user) return null;

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-6 overflow-hidden py-16">
            <div className="absolute top-[-5%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-5%] left-[-10%] w-[50%] h-[50%] bg-amber-500/5 blur-[120px] rounded-full" />

            <AnimatePresence mode="wait">
                {view === 'login' ? (
                    <CluberLogin key="login" onSwitchToSignup={() => setView('signup')} />
                ) : (
                    <CluberSignup key="signup" onSwitchToLogin={() => setView('login')} />
                )}
            </AnimatePresence>
        </div>
    );
}
