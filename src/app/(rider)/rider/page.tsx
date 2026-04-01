'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useAuthService } from '@/firebase';
import { collection, query, where, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Order } from '@/types/data';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag, CreditCard, Navigation, AlertCircle, ExternalLink,
    CheckCircle2, Wallet, Clock, MapPin, ArrowRight, Map as MapIcon,
    Bike, Mail, KeyRound, Loader2, User, Fingerprint, Phone, Car,
    Camera, ShieldCheck, AlertTriangle, LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { haptic } from '@/lib/haptics';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, deleteUser } from 'firebase/auth';
import { createConverter } from '@/lib/firestore-converter';

// ─── MAP COMPONENT ──────────────────────────────────────────
function RiderMap({ orders, onOrderSelect }: { orders: Order[], onOrderSelect: (order: Order) => void }) {
    return (
        <div className="w-full h-[50vh] bg-slate-900 rounded-[2.5rem] border border-cyan-500/20 shadow-[0_0_50px_rgba(0,245,255,0.05)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-50 z-10" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <MapIcon className="h-12 w-12 text-cyan-400/20 mx-auto animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/40">Visualizando {orders.length} pedidos cercanos</p>
                </div>
            </div>
            {orders.map((order, i) => (
                <motion.button
                    key={order.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.2 }}
                    onClick={() => onOrderSelect(order)}
                    style={{
                        position: 'absolute',
                        top: `${30 + (i * 15) % 40}%`,
                        left: `${20 + (i * 20) % 60}%`
                    }}
                    className="z-20 h-8 w-8 rounded-full bg-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,245,255,0.6)] border-2 border-black"
                >
                    <ShoppingBag className="h-4 w-4 text-black" />
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 backdrop-blur-md border border-cyan-400/20 text-[8px] px-2 py-0.5 rounded-full font-black text-cyan-400 uppercase tracking-widest">
                        ${order.deliveryCost}
                    </span>
                </motion.button>
            ))}
        </div>
    );
}

// ─── LOGIN FORM ──────────────────────────────────────────
function RiderLogin({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
    const auth = useAuthService();
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
        } catch (err: any) {
            haptic.vibrateError();
            toast({ variant: 'destructive', title: 'Error', description: err.code === 'auth/invalid-credential' ? 'Email o contraseña incorrectos.' : 'Error al iniciar sesión.' });
        } finally {
            setLoading(false);
        }
    };

    const ic = "h-12 pl-12 rounded-xl bg-cyan-500/5 border-cyan-500/10 focus:border-cyan-500/30 focus:ring-cyan-500/10 transition-all font-medium text-slate-200 placeholder:text-slate-500";

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto">
            <Card className="rounded-[2rem] bg-slate-900/80 border-cyan-500/10 backdrop-blur-xl">
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4 pt-8 px-6">
                        <div className="space-y-1.5">
                            <Label className="font-black uppercase tracking-widest text-[10px] text-cyan-500/60 ml-1">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <Input type="email" placeholder="rider@email.com" value={email} onChange={e => setEmail(e.target.value)} className={ic} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="font-black uppercase tracking-widest text-[10px] text-cyan-500/60 ml-1">Contraseña</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className={ic} />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="px-6 pb-6 pt-2 flex flex-col gap-3">
                        <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl bg-cyan-500 text-black font-black uppercase tracking-[0.2em] text-sm hover:bg-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] disabled:opacity-30">
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><LogIn className="mr-2 h-5 w-5" />Ingresar</>}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <button onClick={onSwitchToSignup} className="mt-6 block mx-auto text-xs font-bold text-slate-500 hover:text-cyan-400 transition-colors">
                ¿No tenés cuenta? <span className="font-black text-cyan-400 uppercase tracking-widest text-[10px] ml-1">Registrate como Rider</span>
            </button>
        </motion.div>
    );
}

// ─── SIGNUP FORM ─────────────────────────────────────────
function RiderSignup({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
    const firestore = useFirestore();
    const auth = useAuthService();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            const user = cred.user;
            await updateProfile(user, { displayName: `${firstName} ${lastName}` });

            let fotoRostroUrl = '';
            let fotoVehiculoUrl = '';
            try {
                const fd = new FormData();
                fd.append('fotoRostro', fotoRostro!);
                fd.append('fotoVehiculo', fotoVehiculo!);
                fd.append('userId', user.uid);
                fd.append('firstName', firstName);
                fd.append('lastName', lastName);
                fd.append('dni', dni);
                const res = await fetch('/api/upload-rider-docs', { method: 'POST', body: fd });
                if (res.ok) {
                    const data = await res.json();
                    fotoRostroUrl = data.fotoRostroLink || '';
                    fotoVehiculoUrl = data.fotoVehiculoLink || '';
                }
            } catch (e) { console.error('Drive upload error:', e); }

            await new Promise(r => setTimeout(r, 800));
            const batch = writeBatch(firestore);
            batch.set(doc(firestore, 'users', user.uid), {
                id: user.uid, uid: user.uid, email, firstName, lastName, dni, phone,
                role: 'rider_pending', patente: patente.toUpperCase(), photoURL: '', points: 0,
                isEmailVerified: false, createdAt: serverTimestamp(),
            });
            batch.set(doc(firestore, 'rider_applications', user.uid), {
                userId: user.uid, userName: `${firstName} ${lastName}`, email, dni, phone,
                patente: patente.toUpperCase(), fotoRostroUrl, fotoVehiculoUrl,
                ddjjAntecedentes: true, status: 'pending', createdAt: serverTimestamp(),
            });
            await batch.commit();
            try { await sendEmailVerification(user, { url: `${window.location.origin}/rider` }); } catch (e) {}
            haptic.vibrateSuccess();
            toast({ title: '✅ Solicitud enviada', description: 'Te notificaremos cuando seas aprobado.' });
        } catch (error: any) {
            if (auth.currentUser) await deleteUser(auth.currentUser);
            haptic.vibrateError();
            toast({ variant: 'destructive', title: 'Error', description: error.code === 'auth/email-already-in-use' ? 'Este email ya está en uso.' : 'Error al registrarse.' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const ic = "h-11 pl-11 rounded-xl bg-cyan-500/5 border-cyan-500/10 focus:border-cyan-500/30 focus:ring-cyan-500/10 transition-all font-medium text-slate-200 placeholder:text-slate-500 text-sm";
    const lc = "font-black uppercase tracking-widest text-[9px] ml-1 text-cyan-500/60";

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto">
            <Card className="rounded-[2rem] bg-slate-900/80 border-cyan-500/10 backdrop-blur-xl">
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-3.5 pt-6 px-5">
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                                <Label className={lc}>Nombre</Label>
                                <div className="relative"><User className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" /><Input placeholder="Juan" value={firstName} onChange={e => setFirstName(e.target.value)} className={ic} /></div>
                            </div>
                            <div className="space-y-1">
                                <Label className={lc}>Apellido</Label>
                                <div className="relative"><User className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" /><Input placeholder="Pérez" value={lastName} onChange={e => setLastName(e.target.value)} className={ic} /></div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className={lc}>Email</Label>
                            <div className="relative"><Mail className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" /><Input type="email" placeholder="rider@email.com" value={email} onChange={e => setEmail(e.target.value)} className={ic} /></div>
                        </div>
                        <div className="space-y-1">
                            <Label className={lc}>Contraseña</Label>
                            <div className="relative"><KeyRound className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" /><Input type="password" placeholder="Min. 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} className={ic} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                            <div className="space-y-1">
                                <Label className={lc}>DNI</Label>
                                <div className="relative"><Fingerprint className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" /><Input placeholder="12345678" value={dni} onChange={e => setDni(e.target.value)} className={ic} /></div>
                            </div>
                            <div className="space-y-1">
                                <Label className={lc}>Teléfono</Label>
                                <div className="relative"><Phone className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" /><Input placeholder="1122334455" value={phone} onChange={e => setPhone(e.target.value)} className={ic} /></div>
                            </div>
                            <div className="space-y-1">
                                <Label className={lc}>Patente</Label>
                                <div className="relative"><Car className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" /><Input placeholder="AB123CD" value={patente} onChange={e => setPatente(e.target.value.toUpperCase())} className={`${ic} uppercase`} /></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-cyan-500/20 rounded-xl bg-cyan-500/5 cursor-pointer hover:bg-cyan-500/10 transition-all">
                                <input type="file" accept="image/*" capture="user" className="hidden" onChange={e => setFotoRostro(e.target.files?.[0] || null)} />
                                <Camera className="h-5 w-5 text-cyan-400 mb-1" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-cyan-500/60">{fotoRostro ? '✅ Rostro' : 'Foto Rostro'}</span>
                            </label>
                            <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-cyan-500/20 rounded-xl bg-cyan-500/5 cursor-pointer hover:bg-cyan-500/10 transition-all">
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setFotoVehiculo(e.target.files?.[0] || null)} />
                                <Car className="h-5 w-5 text-cyan-400 mb-1" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-cyan-500/60">{fotoVehiculo ? '✅ Vehículo' : 'Foto Vehículo'}</span>
                            </label>
                        </div>
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <Checkbox checked={acceptDDJJ} onCheckedChange={(v) => setAcceptDDJJ(!!v)} className="mt-0.5 border-amber-500/40 data-[state=checked]:bg-amber-500" />
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1"><AlertTriangle className="h-2.5 w-2.5" /> DDJJ Antecedentes</p>
                                <p className="text-[8px] text-amber-500/70 font-medium leading-relaxed">Declaro bajo juramento no poseer antecedentes penales.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                            <Checkbox checked={acceptPrivacy} onCheckedChange={(v) => setAcceptPrivacy(!!v)} className="border-cyan-500/30 data-[state=checked]:bg-cyan-500" />
                            <p className="text-[9px] font-bold text-slate-400">Acepto la <Link href="/politica-de-privacidad" className="text-cyan-400 font-black uppercase tracking-widest text-[8px]" target="_blank">Privacidad</Link></p>
                        </div>
                    </CardContent>
                    <CardFooter className="pb-6 pt-2 px-5">
                        <Button type="submit" disabled={!isValid || isSubmitting} className="w-full h-14 rounded-2xl bg-cyan-500 text-black font-black uppercase tracking-[0.2em] text-sm hover:bg-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)] disabled:opacity-30">
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Bike className="mr-2 h-5 w-5" />Enviar Solicitud</>}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <button onClick={onSwitchToLogin} className="mt-4 block mx-auto text-xs font-bold text-slate-500 hover:text-cyan-400 transition-colors">
                ¿Ya tenés cuenta? <span className="font-black text-cyan-400 uppercase tracking-widest text-[10px] ml-1">Ingresar</span>
            </button>
        </motion.div>
    );
}

// ─── PENDING SCREEN ──────────────────────────────────────
function RiderPending() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="h-20 w-20 rounded-[2rem] bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Clock className="h-10 w-10 text-amber-400 animate-pulse" />
            </div>
            <div className="space-y-2">
                <h1 className="text-2xl font-black tracking-tighter uppercase italic text-amber-400">En Revisión</h1>
                <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
                    Tu solicitud está siendo revisada. Te notificaremos cuando seas aprobado para recibir pedidos.
                </p>
            </div>
            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-full">
                Pendiente de Aprobación
            </Badge>
        </div>
    );
}

// ─── MAIN PAGE ───────────────────────────────────────────
export default function RiderPage() {
    const { userData, user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [view, setView] = useState<'login' | 'signup'>('login');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isAccepting, setIsAccepting] = useState(false);

    const ordersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'orders').withConverter(createConverter<Order>()), where('status', '==', 'searching_rider'));
    }, [firestore]);

    const { data: availableOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

    if (isUserLoading) return null;

    // ── STATE 1: Not logged in → Login / Signup ──
    if (!user) {
        return (
            <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#050505] p-6 overflow-hidden py-16">
                <div className="absolute top-[-5%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-5%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/5 blur-[120px] rounded-full" />

                <header className="mb-8 text-center space-y-3 z-10">
                    <div className="h-16 w-16 rounded-[2rem] bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)] mx-auto">
                        <Bike className="h-8 w-8 text-cyan-400" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-cyan-400 uppercase">Rider Mode</h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Estuclub Logística</p>
                </header>

                <div className="z-10 w-full">
                    <AnimatePresence mode="wait">
                        {view === 'login' ? (
                            <RiderLogin key="login" onSwitchToSignup={() => setView('signup')} />
                        ) : (
                            <RiderSignup key="signup" onSwitchToLogin={() => setView('login')} />
                        )}
                    </AnimatePresence>
                </div>

                <Link href="/" className="mt-8 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] hover:text-slate-400 transition-colors z-10">
                    ← Volver a EstuClub
                </Link>
            </div>
        );
    }

    // ── STATE 2: Logged in but pending approval ──
    if (userData?.role === 'rider_pending') {
        return <RiderPending />;
    }

    // ── STATE 3: Logged in but not a rider ──
    if (userData?.role !== 'rider' && userData?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <AlertCircle className="h-12 w-12 text-destructive opacity-40" />
                <p className="text-sm text-muted-foreground font-bold">Tu cuenta no tiene permisos de Rider.</p>
                <Button asChild variant="outline"><Link href="/">Volver al inicio</Link></Button>
            </div>
        );
    }

    // ── STATE 4: Active Rider Dashboard ──
    const isAdmin = userData?.role === 'admin';
    const isSubscribed = userData?.subscriptionStatus === 'active' || isAdmin;
    const isMpLinked = userData?.mp_linked === true || isAdmin;

    if (!isSubscribed || !isMpLinked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <div className="h-20 w-20 rounded-[2rem] bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(0,245,255,0.2)]">
                    <AlertCircle className="h-10 w-10 text-cyan-400" />
                </div>
                <div className="space-y-3">
                    <h1 className="text-3xl font-black tracking-tighter uppercase italic">Acceso Restringido</h1>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto text-sm leading-relaxed">
                        Para recibir pedidos debés estar al día con tu suscripción y vincular tu cuenta de cobros.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
                    {!isMpLinked ? (
                        <Button asChild className="h-14 bg-cyan-500 text-black font-black uppercase tracking-widest hover:bg-cyan-400 rounded-2xl">
                            <Link href={`/api/auth/mercadopago?userId=${user?.uid}`}><CreditCard className="mr-2 h-5 w-5" /> Vincular Mercado Pago</Link>
                        </Button>
                    ) : (
                        <div className="h-14 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest">
                            <CheckCircle2 className="h-5 w-5" /> Cuenta Vinculada
                        </div>
                    )}
                    {!isSubscribed && (
                        <Button className="h-14 bg-transparent border-2 border-cyan-500 text-cyan-400 font-black uppercase tracking-widest hover:bg-cyan-500/10 rounded-2xl">
                            <Link href="/rider/subscribe"><Wallet className="mr-2 h-5 w-5" /> Activar Suscripción</Link>
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    // ── FULL DASHBOARD ──
    const handleAcceptOrder = async () => {
        if (!selectedOrder || !user?.uid) return;
        setIsAccepting(true);
        haptic.vibrateMedium();
        try {
            const orderRef = doc(firestore, 'orders', selectedOrder.id);
            await updateDoc(orderRef, { riderId: user.uid, status: 'assigned', updatedAt: Timestamp.now() });
            setSelectedOrder(null);
        } catch (error) {
            console.error('Error accepting order:', error);
        } finally {
            setIsAccepting(false);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <header className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-900/50 border-cyan-500/10 rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-4 bg-cyan-500/5 border-b border-cyan-500/10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 opacity-60">Balance Semanal</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black tracking-tighter text-cyan-400">$0,00</span>
                            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(0,245,255,1)]" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-cyan-500/10 rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-4 bg-cyan-500/5 border-b border-cyan-500/10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 opacity-60">Suscripción</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Badge className="bg-cyan-500 text-black font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border-0">ACTIVA</Badge>
                    </CardContent>
                </Card>
            </header>

            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                        <Navigation className="h-4 w-4 animate-bounce" /> Pedidos en Vivo
                    </h2>
                    <Badge variant="outline" className="border-cyan-500/20 text-cyan-400 font-black text-[9px]">RADIO 5KM</Badge>
                </div>
                <RiderMap orders={availableOrders || []} onOrderSelect={setSelectedOrder} />
            </section>

            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 z-[70] bg-[#0A0A0A] border-t border-cyan-500/30 rounded-t-[3rem] p-8 pb-12 shadow-[0_-20px_50px_rgba(0,245,255,0.1)]">
                            <div className="w-12 h-1.5 bg-cyan-500/20 rounded-full mx-auto mb-8" />
                            <div className="space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black tracking-tighter uppercase italic text-cyan-400">Detalles del Envío</h3>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">ID: {selectedOrder.id.slice(0, 8)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Tu ganancia</p>
                                        <p className="text-4xl font-black tracking-tighter text-cyan-400">${selectedOrder.deliveryCost}</p>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <MapPin className="h-4 w-4 text-cyan-400" />
                                        <span className="text-xs font-bold uppercase tracking-tight truncate flex-1">{selectedOrder.supplierName}</span>
                                        <ArrowRight className="h-3 w-3 opacity-30" />
                                        <span className="text-xs font-bold uppercase tracking-tight truncate flex-1">{selectedOrder.deliveryAddress}</span>
                                    </div>
                                </div>
                                <Button onClick={handleAcceptOrder} disabled={isAccepting} className="w-full h-16 bg-cyan-500 text-black font-black text-lg uppercase tracking-[0.2em] hover:bg-cyan-400 rounded-[2rem] shadow-[0_0_30px_rgba(0,245,255,0.3)] mt-6">
                                    {isAccepting ? "Procesando..." : "ACEPTAR ENVÍO"}
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
