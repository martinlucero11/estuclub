'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useAuthService } from '@/firebase';
import { collection, query, where, doc, updateDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Order } from '@/types/data';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/common/Logo';
import {
    ShoppingBag, CreditCard, Navigation, AlertCircle, ExternalLink,
    CheckCircle2, Wallet, Clock, MapPin, ArrowRight, Map as MapIcon,
    Bike, Mail, KeyRound, Loader2, User, Fingerprint, Phone, Car,
    Camera, ShieldCheck, AlertTriangle, LogIn, Trophy, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { haptic } from '@/lib/haptics';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, deleteUser } from 'firebase/auth';
import { createConverter } from '@/lib/firestore-converter';
import MPRestrictionOverlay from '@/components/payment/mp-restriction-overlay';
import { StarRating } from '@/components/reviews/star-rating';

// ─── MAP COMPONENT ──────────────────────────────────────────
function RiderMap({ orders, onOrderSelect }: { orders: Order[], onOrderSelect: (order: Order) => void }) {
    return (
        <div className="w-full h-[40vh] bg-[#000000] rounded-[2.5rem] border border-[#cb465a]/20 shadow-[0_0_50px_rgba(203, 70, 90,0.05)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#cb465a]/10 via-transparent to-transparent opacity-50 z-10 pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <MapIcon className="h-12 w-12 text-[#cb465a]/40 mx-auto animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#cb465a]/60">Visualizando {orders.length} pedidos cercanos</p>
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
                    className="z-20 h-8 w-8 rounded-full bg-[#cb465a] flex items-center justify-center shadow-[0_0_20px_rgba(203, 70, 90,0.6)] border-2 border-black"
                >
                    <ShoppingBag className="h-4 w-4 text-black" />
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 backdrop-blur-md border border-[#cb465a]/20 text-[8px] px-2 py-0.5 rounded-full font-black text-[#cb465a] uppercase tracking-widest">
                        ${order.deliveryCost}
                    </span>
                </motion.button>
            ))}
        </div>
    );
}

function AverageRating({ rating, count }: { rating?: number; count?: number }) {
    if (!count || count === 0) return null;
    
    return (
        <div className="flex items-center gap-1.5 bg-[#cb465a]/10 text-[#cb465a] px-3 py-1 rounded-full border border-[#cb465a]/20 shadow-sm animate-in fade-in duration-500">
            <StarRating rating={rating || 0} readonly size="sm" />
            <span className="text-xs font-black">{(rating || 0).toFixed(1)}</span>
            <span className="text-[10px] opacity-60 font-bold">({count})</span>
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

    const ic = "h-12 pl-12 rounded-xl bg-[#cb465a]/5 border-[#cb465a]/10 focus:border-[#cb465a]/30 focus:ring-[#cb465a]/10 transition-all font-medium text-foreground placeholder:text-foreground";

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto">
            <Card className="rounded-[2rem] glass-dark border-primary/10">
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4 pt-8 px-6">
                        <div className="space-y-1.5">
                            <Label className="font-black uppercase tracking-widest text-[10px] text-[#cb465a]/60 ml-1">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
                                <Input type="email" placeholder="rider@email.com" value={email} onChange={e => setEmail(e.target.value)} className={ic} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="font-black uppercase tracking-widest text-[10px] text-[#cb465a]/60 ml-1">Contraseña</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
                                <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className={ic} />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="px-6 pb-6 pt-2 flex flex-col gap-3">
                        <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl bg-[#cb465a] text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-[#cb465a]/90 shadow-[0_0_30px_rgba(203, 70, 90,0.3)] disabled:opacity-30">
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><LogIn className="mr-2 h-5 w-5" />Ingresar</>}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <button onClick={onSwitchToSignup} className="mt-6 block mx-auto text-xs font-bold text-foreground hover:text-[#cb465a] transition-colors">
                ¿No tenés cuenta? <span className="font-black text-[#cb465a] uppercase tracking-widest text-[10px] ml-1">Registrate como Rider</span>
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
            try { await sendEmailVerification(user, { url: `${window.location.origin}/rider` }); } catch (e) { }
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

    const ic = "h-11 pl-11 rounded-xl bg-[#cb465a]/5 border-[#cb465a]/10 focus:border-[#cb465a]/30 focus:ring-[#cb465a]/10 transition-all font-medium text-foreground placeholder:text-foreground text-sm";
    const lc = "font-black uppercase tracking-widest text-[9px] ml-1 text-[#cb465a]/60";

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto">
            <Card className="rounded-[2rem] bg-background/80 border-[#cb465a]/10 backdrop-blur-xl">
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-3.5 pt-6 px-5">
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                                <Label className={lc}>Nombre</Label>
                                <div className="relative"><User className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground" /><Input placeholder="Juan" value={firstName} onChange={e => setFirstName(e.target.value)} className={ic} /></div>
                            </div>
                            <div className="space-y-1">
                                <Label className={lc}>Apellido</Label>
                                <div className="relative"><User className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground" /><Input placeholder="Pérez" value={lastName} onChange={e => setLastName(e.target.value)} className={ic} /></div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className={lc}>Email</Label>
                            <div className="relative"><Mail className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground" /><Input type="email" placeholder="rider@email.com" value={email} onChange={e => setEmail(e.target.value)} className={ic} /></div>
                        </div>
                        <div className="space-y-1">
                            <Label className={lc}>Contraseña</Label>
                            <div className="relative"><KeyRound className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground" /><Input type="password" placeholder="Min. 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} className={ic} /></div>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                            <div className="space-y-1">
                                <Label className={lc}>DNI</Label>
                                <div className="relative"><Fingerprint className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground" /><Input placeholder="12345678" value={dni} onChange={e => setDni(e.target.value)} className={ic} /></div>
                            </div>
                            <div className="space-y-1">
                                <Label className={lc}>Teléfono</Label>
                                <div className="relative"><Phone className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground" /><Input placeholder="1122334455" value={phone} onChange={e => setPhone(e.target.value)} className={ic} /></div>
                            </div>
                            <div className="space-y-1">
                                <Label className={lc}>Patente</Label>
                                <div className="relative"><Car className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground" /><Input placeholder="AB123CD" value={patente} onChange={e => setPatente(e.target.value.toUpperCase())} className={`${ic} uppercase`} /></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-[#cb465a]/20 rounded-xl bg-[#cb465a]/5 cursor-pointer hover:bg-[#cb465a]/10 transition-all">
                                <input type="file" accept="image/*" capture="user" className="hidden" onChange={e => setFotoRostro(e.target.files?.[0] || null)} />
                                <Camera className="h-5 w-5 text-[#cb465a] mb-1" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-[#cb465a]/60">{fotoRostro ? '✅ Rostro' : 'Foto Rostro'}</span>
                            </label>
                            <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-[#cb465a]/20 rounded-xl bg-[#cb465a]/5 cursor-pointer hover:bg-[#cb465a]/10 transition-all">
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setFotoVehiculo(e.target.files?.[0] || null)} />
                                <Car className="h-5 w-5 text-[#cb465a] mb-1" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-[#cb465a]/60">{fotoVehiculo ? '✅ Vehículo' : 'Foto Vehículo'}</span>
                            </label>
                        </div>
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <Checkbox checked={acceptDDJJ} onCheckedChange={(v) => setAcceptDDJJ(!!v)} className="mt-0.5 border-amber-500/40 data-[state=checked]:bg-amber-500" />
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1"><AlertTriangle className="h-2.5 w-2.5" /> DDJJ Antecedentes</p>
                                <p className="text-[8px] text-amber-500/70 font-medium leading-relaxed">Declaro bajo juramento no poseer antecedentes penales.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#cb465a]/5 border border-[#cb465a]/10">
                            <Checkbox checked={acceptPrivacy} onCheckedChange={(v) => setAcceptPrivacy(!!v)} className="border-[#cb465a]/30 data-[state=checked]:bg-[#cb465a]" />
                            <p className="text-[9px] font-bold text-foreground">Acepto la <Link href="/politica-de-privacidad" className="text-[#cb465a] font-black uppercase tracking-widest text-[8px]" target="_blank">Privacidad</Link></p>
                        </div>
                    </CardContent>
                    <CardFooter className="pb-6 pt-2 px-5">
                        <Button type="submit" disabled={!isValid || isSubmitting} className="w-full h-14 rounded-2xl bg-[#cb465a] text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-[#cb465a]/90 shadow-[0_0_30px_rgba(203, 70, 90,0.3)] disabled:opacity-30">
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Bike className="mr-2 h-5 w-5" />Enviar Solicitud</>}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <button onClick={onSwitchToLogin} className="mt-4 block mx-auto text-xs font-bold text-foreground hover:text-[#cb465a] transition-colors">
                ¿Ya tenés cuenta? <span className="font-black text-[#cb465a] uppercase tracking-widest text-[10px] ml-1">Ingresar</span>
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
                <p className="text-sm text-foreground font-medium max-w-xs mx-auto leading-relaxed">
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
    const { userData, user, roles, isUserLoading } = useUser();
    const { toast } = useToast();
    const firestore = useFirestore();
    const [view, setView] = useState<'login' | 'signup'>('login');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isOnline, setIsOnline] = useState(userData?.isOnline === true);

    // Sync isOnline state with Firestore effectively
    useEffect(() => {
        if (userData?.isOnline !== undefined) {
            setIsOnline(userData.isOnline);
        }
    }, [userData?.isOnline]);

    const handleToggleOnline = async () => {
        if (!user?.uid) return;
        if (!hasActiveAccess) {
            toast({ 
                variant: 'destructive',
                title: "Membresía Requerida", 
                description: "Tu acceso gratuito de 48hs expiró. Regularizá tu membresía para seguir operando." 
            });
            haptic.vibrateError();
            return;
        }

        const newStatus = !isOnline;
        setIsOnline(newStatus);
        haptic.vibrateMedium();

        try {
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, { 
                isOnline: newStatus,
                lastStatusChange: serverTimestamp()
            });
        } catch (error) {
            // Rollback on error
            setIsOnline(!newStatus);
            toast({ variant: 'destructive', title: 'Error de Red', description: 'No se pudo sincronizar tu estado.' });
        }
    };

    // ── REAL-TIME ORDER SYNC ──
    const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !user?.uid || !isOnline) {
            setAvailableOrders([]);
            setOrdersLoading(false);
            return;
        }

        const q = query(
            collection(firestore, 'orders').withConverter(createConverter<Order>()), 
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setAvailableOrders(orders);
            setOrdersLoading(false);
            
            if (!snapshot.metadata.hasPendingWrites && snapshot.docChanges().some(c => c.type === 'added')) {
                haptic.vibrateSuccess();
            }
        }, (error) => {
            console.error('Order stream error:', error);
            setOrdersLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, user?.uid, isOnline]);

    // ── ADMIN OVERLORD BYPASS ──
    const isAdmin = roles.includes('admin');
    const isApprovedRider = userData?.role === 'rider' || isAdmin;
    const isPendingRider = userData?.role === 'rider_pending' && !isAdmin;

    const myOrdersQuery = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, 'orders').withConverter(createConverter<Order>()),
            where('riderId', '==', user.uid),
            where('status', 'in', ['assigned', 'at_store', 'on_the_way', 'delivered', 'completed'])
        );
    }, [firestore, user]);

    const { data: myOrders, isLoading: myOrdersLoading } = useCollection(myOrdersQuery);

    const activeOrders = useMemo(() => myOrders?.filter(o => ['assigned', 'at_store', 'on_the_way'].includes(o.status)) || [], [myOrders]);
    const historyOrders = useMemo(() => myOrders?.filter(o => ['delivered', 'completed'].includes(o.status)) || [], [myOrders]);
    const totalEarnings = useMemo(() => historyOrders.reduce((sum, o) => sum + (o.deliveryCost || 0), 0), [historyOrders]);


    if (isUserLoading) return null;

    // ── STATE 1: Not logged in → Login / Signup ──
    if (!user) {
        return (
            <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#000000] p-6 overflow-hidden py-16">
                <div className="absolute top-[-5%] right-[-10%] w-[50%] h-[50%] bg-[#cb465a]/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-5%] left-[-10%] w-[50%] h-[50%] bg-[#cb465a]/5 blur-[120px] rounded-full" />

                <header className="mb-10 text-center space-y-4 z-10 flex flex-col items-center">
                    <div className="relative mb-2">
                        <div className="absolute inset-x-0 -bottom-2 h-1 bg-[#cb465a]/30 blur-md rounded-full" />
                        <Logo 
                            variant="rosa-glow"
                            className="h-16 w-auto filter drop-shadow-[0_2px_15px_rgba(255,0,127,0.4)]"
                        />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic font-montserrat">
                        MODO <span className="text-[#cb465a]">RIDER</span>
                    </h1>
                    <p className="text-[10px] font-black text-foreground uppercase tracking-[0.4em]">Estuclub Logística</p>
                </header>

                <div className="z-10 w-full max-w-md">
                    <AnimatePresence mode="wait">
                        {view === 'login' ? (
                            <RiderLogin key="login" onSwitchToSignup={() => setView('signup')} />
                        ) : (
                            <RiderSignup key="signup" onSwitchToLogin={() => setView('login')} />
                        )}
                    </AnimatePresence>
                </div>

                <Link href="/" className="mt-8 text-[9px] font-black text-foreground uppercase tracking-[0.3em] hover:text-[#cb465a] transition-colors z-10">
                    ← Volver a EstuClub
                </Link>
            </div>
        );
    }
    if (isPendingRider) {
        return <RiderPending />;
    }

    // ── STATE 3: Logged in but not a rider ──
    if (!isApprovedRider) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 px-6">
                <div className="h-24 w-24 rounded-[3rem] bg-[#cb465a]/10 border border-[#cb465a]/20 flex items-center justify-center shadow-[0_0_40px_rgba(203, 70, 90,0.1)]">
                    <AlertCircle className="h-12 w-12 text-[#cb465a]" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white font-montserrat">Sin Permisos</h2>
                    <p className="text-sm text-foreground font-bold max-w-xs mx-auto leading-relaxed">
                        Tu cuenta no tiene el rol de Rider habilitado. Contactá con soporte si crees que es un error.
                    </p>
                </div>
                <Button asChild className="h-14 px-10 rounded-2xl bg-[#cb465a] text-white font-black uppercase tracking-widest hover:bg-[#cb465a]/90 shadow-[0_0_30px_rgba(203, 70, 90,0.3)] transition-all">
                    <Link href="/">Volver al inicio</Link>
                </Button>
            </div>
        );
    }

    // ── STATE 4: Active Rider Dashboard ──
    // ── MEMBERSHIP LOGIC ──
    const trialEndsAt = userData?.trialEndsAt?.seconds ? userData.trialEndsAt.seconds * 1000 : 0;
    const membershipPaidUntil = userData?.membershipPaidUntil?.seconds ? userData.membershipPaidUntil.seconds * 1000 : 0;
    const isTrialActive = Date.now() < trialEndsAt;
    const isMembershipActive = Date.now() < membershipPaidUntil;
    const isMembershipWaived = userData?.isMembershipWaived === true;
    
    const hasActiveAccess = isTrialActive || isMembershipActive || isMembershipWaived || isAdmin;
    const isMpLinked = userData?.mp_linked === true || isAdmin;

    // NO LONGER BLOCKING ACCESS - Protocolo Demo 4 AM
    /* 
    if (!isSubscribed || !isMpLinked) {
        ...
    }
    */

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
        <div className="space-y-12 animate-in fade-in duration-700">
            <MPRestrictionOverlay />
            {/* KPI Section */}
            <header className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white/[0.03] border-[#cb465a]/20 rounded-[2rem] overflow-hidden backdrop-blur-md">
                    <CardHeader className="p-4 bg-[#cb465a]/5 border-b border-[#cb465a]/10">
                        <CardTitle className="text-[9px] font-black uppercase tracking-[0.2em] text-[#cb465a]">Billetera</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black tracking-tighter text-white font-inter">${totalEarnings.toLocaleString()}</span>
                            <Wallet className="h-3.5 w-3.5 text-[#cb465a]/40" />
                        </div>
                    </CardContent>
                </Card>
                <Card className={cn(
                    "rounded-[2rem] overflow-hidden backdrop-blur-md border-b-4",
                    hasActiveAccess ? "bg-white/[0.03] border-[#cb465a]/20 border-b-emerald-500/50" : "bg-red-500/5 border-red-500/20 border-b-red-500"
                )}>
                    <CardHeader className="p-4 bg-[#cb465a]/5 border-b border-[#cb465a]/10">
                        <CardTitle className="text-[9px] font-black uppercase tracking-[0.2em] text-[#cb465a]">Suscripción</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 text-center flex flex-col items-center justify-center gap-2">
                        {hasActiveAccess ? (
                             <Badge className="bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full border-0 shadow-lg shadow-emerald-500/30">ACTIVA</Badge>
                        ) : (
                            <>
                                <Badge className="bg-red-500 text-white font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full border-0 shadow-lg shadow-red-500/30">VENCIDA</Badge>
                                <Button size="sm" className="h-7 px-3 bg-white/10 hover:bg-white/20 text-white text-[8px] font-black uppercase rounded-lg">Renovar</Button>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card className="bg-white/[0.03] border-[#cb465a]/20 rounded-[2rem] overflow-hidden backdrop-blur-md">
                    <CardHeader className="p-4 bg-[#cb465a]/5 border-b border-[#cb465a]/10">
                        <CardTitle className="text-[9px] font-black uppercase tracking-[0.2em] text-[#cb465a]">Entregas</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black tracking-tighter text-white font-inter">{historyOrders.length}</span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500/40" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/[0.03] border-[#cb465a]/20 rounded-[2rem] overflow-hidden backdrop-blur-md">
                    <CardHeader className="p-4 bg-[#cb465a]/5 border-b border-[#cb465a]/10">
                        <CardTitle className="text-[9px] font-black uppercase tracking-[0.2em] text-[#cb465a]">Reputación</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 flex flex-col items-center justify-center">
                        <AverageRating rating={userData?.avgRating} count={userData?.reviewCount} />
                        {!userData?.reviewCount && <span className="text-[10px] font-black opacity-20 italic">SIN RESEÑAS</span>}
                    </CardContent>
                </Card>
            </header>

            {!hasActiveAccess && (
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-6 rounded-[2.5rem] bg-gradient-to-br from-red-500/20 to-black border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)] relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="h-12 w-12 text-red-500" /></div>
                    <div className="relative z-10 space-y-2">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">Acceso Restringido</p>
                        <h3 className="text-lg font-black text-white uppercase italic leading-none">Tu acceso de 48hs ha expirado</h3>
                        <p className="text-xs font-bold text-foreground/60 leading-relaxed max-w-sm">
                            Tu período de prueba ha finalizado. Regularizá tu membresía mensual para seguir recibiendo pedidos en tiempo real.
                        </p>
                        <div className="pt-2">
                            <Button className="h-10 px-8 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-red-500/20">Regularizar Ahora</Button>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="flex items-center justify-center px-4">
                <Button 
                    onClick={() => {
                        if (!hasActiveAccess) {
                            toast({ 
                                variant: 'destructive',
                                title: "Membresía Requerida", 
                                description: "Tu acceso gratuito de 48hs expiró. Regularizá tu membresía para seguir operando." 
                            });
                            haptic.vibrateError();
                            return;
                        }
                        handleToggleOnline();
                    }}
                    className={cn(
                        "w-full max-w-xs h-20 rounded-[2.5rem] font-black uppercase italic tracking-[0.2em] text-lg transition-all duration-500 shadow-2xl overflow-hidden relative group",
                        isOnline && hasActiveAccess 
                            ? "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600" 
                            : "bg-white/5 border border-white/10 text-foreground/40 hover:bg-white/10"
                    )}
                >
                    {isOnline && hasActiveAccess && (
                        <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: '200%' }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                        />
                    )}
                    <div className="flex items-center gap-4 relative z-10">
                        {isOnline && hasActiveAccess ? (
                            <><Zap className="h-6 w-6 animate-pulse fill-white" /> RECIBIENDO PEDIDOS</>
                        ) : (
                            <><Bike className="h-6 w-6 opacity-40" /> RECIBIR PEDIDOS</>
                        )}
                    </div>
                </Button>
            </div>

            {/* Active Orders Section */}
            {activeOrders.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#cb465a] flex items-center gap-2 font-montserrat">
                            <Bike className="h-4 w-4 animate-bounce" /> En Curso ({activeOrders.length})
                        </h2>
                    </div>
                    <div className="grid gap-4">
                        {activeOrders.map(order => (
                            <Card key={order.id} className="bg-white/[0.03] border-[#cb465a]/30 rounded-[2rem] overflow-hidden">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-white/10 text-white font-black text-[8px] uppercase tracking-tighter">{order.status.replace('_', ' ')}</Badge>
                                            <p className="text-sm font-black text-white uppercase italic">{order.supplierName}</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-foreground">{order.deliveryAddress}</p>
                                    </div>
                                    <Button asChild size="sm" className="bg-[#cb465a] hover:bg-[#cb465a]/90 rounded-xl font-black text-[10px] uppercase tracking-widest px-6 shadow-xl shadow-[#cb465a]/20">
                                        <Link href={`/rider/trip/${order.id}`}>Ver Ruta</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2 font-montserrat">
                        <Navigation className="h-4 w-4 text-[#cb465a]" /> Mapa de Demanda
                    </h2>
                    <Badge variant="outline" className="border-[#cb465a]/20 text-[#cb465a] font-black text-[9px]">DIRECCIÓN SUR</Badge>
                </div>
                <RiderMap orders={availableOrders || []} onOrderSelect={setSelectedOrder} />
            </section>

            {/* History Section */}
            {historyOrders.length > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground font-montserrat">
                            Historial Reciente
                        </h2>
                        <Button 
                            variant="link" 
                            className="text-[10px] font-black uppercase tracking-widest text-[#cb465a]"
                            onClick={() => toast({ 
                                title: "🚀 Función en desarrollo", 
                                description: "¡Próximamente podrás ver tu historial completo!" 
                            })}
                        >
                            Ver Todo
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {historyOrders.slice(0, 5).map(order => (
                            <div key={order.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-white uppercase italic">{order.supplierName}</p>
                                        <p className="text-[10px] text-foreground font-bold">
                                            {order.createdAt instanceof Timestamp ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'Reciente'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-[#cb465a] font-inter">+${order.deliveryCost}</p>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-foreground">Completado</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 z-[70] bg-[#000000] border-t border-[#cb465a]/30 rounded-t-[3rem] p-8 pb-12 shadow-[0_-20px_50px_rgba(203, 70, 90,0.1)]">
                            <div className="w-12 h-1.5 bg-[#cb465a]/20 rounded-full mx-auto mb-8" />
                            <div className="space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black tracking-tighter uppercase italic text-[#cb465a] font-montserrat">Detalles del Envío</h3>
                                        <p className="text-xs font-bold text-foreground uppercase tracking-widest">ID: {selectedOrder.id.slice(0, 8)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground mb-1">Tu ganancia</p>
                                        <p className="text-4xl font-black tracking-tighter text-[#cb465a] font-inter">${selectedOrder.deliveryFee || selectedOrder.deliveryCost}</p>
                                    </div>
                                </div>

                                {/* GIANT DOOR PAYMENT BANNER FOR RIDER */}
                                {selectedOrder.deliveryPaymentStatus === 'pending' && (
                                    <motion.div
                                        initial={{ scale: 0.95 }}
                                        animate={{ scale: [0.95, 1.05, 1] }}
                                        transition={{ duration: 0.5 }}
                                        className="bg-[#cb465a] rounded-[2rem] p-6 border-4 border-black shadow-[0_0_40px_rgba(203, 70, 90,0.4)] text-center relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-20"><CreditCard className="h-12 w-12 text-black" /></div>
                                        <div className="space-y-1 relative z-10">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white">💰 MONTO A COBRAR EN PUERTA</p>
                                            <h2 className="text-4xl font-black italic tracking-tighter text-black">
                                                $ {(selectedOrder.deliveryFee || selectedOrder.deliveryCost).toLocaleString()}
                                            </h2>
                                            <p className="text-[8px] font-bold text-black/60 uppercase tracking-widest">Cobrar en efectivo al entregar</p>
                                        </div>
                                    </motion.div>
                                )}
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-foreground">
                                        <MapPin className="h-4 w-4 text-[#cb465a]" />
                                        <span className="text-xs font-bold uppercase tracking-tight truncate flex-1">{selectedOrder.supplierName}</span>
                                        <ArrowRight className="h-3 w-3 opacity-30" />
                                        <span className="text-xs font-bold uppercase tracking-tight truncate flex-1">{selectedOrder.deliveryAddress}</span>
                                    </div>
                                </div>
                                <Button 
                                    onClick={handleAcceptOrder} 
                                    disabled={isAccepting || !hasActiveAccess || !isOnline} 
                                    className={cn(
                                        "w-full h-16 text-white font-black text-lg uppercase tracking-[0.2em] rounded-[2rem] mt-6 transition-all active:scale-95",
                                        (!hasActiveAccess || !isOnline) ? "bg-white/5 text-white/20" : "bg-[#cb465a] hover:bg-[#cb465a]/90 shadow-[0_0_30px_rgba(203, 70, 90,0.3)]"
                                    )}
                                >
                                    {isAccepting ? "Procesando..." : (!hasActiveAccess ? "MEMBRESÍA REQUERIDA" : !isOnline ? "PONERSE ONLINE" : "ACEPTAR ENVÍO")}
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}


