'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useUser, useFirestore, useCollection, useAuthService } from '@/firebase';
import { collection, query, where, doc, updateDoc, Timestamp, onSnapshot, serverTimestamp, writeBatch, limit } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, deleteUser } from 'firebase/auth';
import { Order } from '@/types/data';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/common/Logo';
import {
    ShoppingBag, CreditCard, Navigation, AlertCircle, Menu,
    CheckCircle2, Wallet, Clock, MapPin, ArrowRight,
    Bike, Mail, KeyRound, Loader2, User, Fingerprint, Phone, Car,
    Camera, AlertTriangle, LogIn, Zap, Info, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { haptic } from '@/lib/haptics';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { createConverter } from '@/lib/firestore-converter';
import { useMessaging } from '@/firebase/messaging';

import { StarRating } from '@/components/reviews/star-rating';
import { acceptDeliveryOrder } from '@/lib/actions/order-actions';

// --- NEW COMPONENTS ---
import { RiderSidebar } from '@/components/rider/rider-sidebar';
import { RiderMap } from '@/components/rider/rider-map';
import { RiderEarnings } from '@/components/rider/rider-earnings';
import { RiderHistory } from '@/components/rider/rider-history';
import { RiderProfile } from '@/components/rider/rider-profile';
import { RiderPinEntry } from '@/components/rider/rider-pin-entry';
import { RiderBottomNav } from '@/components/rider/rider-bottom-nav';

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

    const ic = "h-12 pl-12 rounded-xl bg-[#cb465a]/5 border-[#cb465a]/10 focus:border-[#cb465a]/30 focus:ring-[#cb465a]/10 transition-all font-medium text-foreground placeholder:text-foreground/40";

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto relative z-20">
            <Card className="rounded-[2.5rem] bg-black/40 backdrop-blur-3xl border-[#cb465a]/20 shadow-2xl">
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4 pt-8 px-8">
                        <div className="space-y-1.5">
                            <Label className="font-black uppercase tracking-widest text-[10px] text-[#cb465a]/60 ml-1">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#cb465a]/60" />
                                <Input type="email" placeholder="rider@estuclub.com" value={email} onChange={e => setEmail(e.target.value)} className={ic} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="font-black uppercase tracking-widest text-[10px] text-[#cb465a]/60 ml-1">Contraseña</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#cb465a]/60" />
                                <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className={ic} />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="px-8 pb-8 pt-4">
                        <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl bg-[#cb465a] text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-[#cb465a]/90 shadow-[0_15px_30px_rgba(203,70,90,0.3)] disabled:opacity-30">
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><LogIn className="mr-2 h-5 w-5" />Ingresar</>}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <button onClick={onSwitchToSignup} className="mt-8 block mx-auto text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 hover:text-[#cb465a] transition-all">
                ¿No tenés cuenta? <span className="text-[#cb465a]">Registrate</span>
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
    const [isMpLinked, setIsMpLinked] = useState(false);

    const isValid = firstName && lastName && email && password.length >= 8 && dni && phone && patente && fotoRostro && fotoVehiculo && acceptDDJJ && acceptPrivacy && isMpLinked;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isValid || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            const user = cred.user;
            await updateProfile(user, { displayName: `${firstName} ${lastName}` });

            await new Promise(r => setTimeout(r, 800));
            const batch = writeBatch(firestore);
            
            // Set trial for 7 days
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 7);

            batch.set(doc(firestore, 'users', user.uid), {
                id: user.uid, uid: user.uid, email, firstName, lastName, dni, phone,
                role: 'rider_pending', patente: patente.toUpperCase(), photoURL: '', points: 0,
                isEmailVerified: false, createdAt: serverTimestamp(),
                mp_linked: true, trialEndsAt: Timestamp.fromDate(trialEndsAt)
            });
            
            batch.set(doc(firestore, 'rider_applications', user.uid), {
                userId: user.uid, userName: `${firstName} ${lastName}`, email, dni, phone,
                patente: patente.toUpperCase(),
                ddjjAntecedentes: true, status: 'pending', createdAt: serverTimestamp(),
            });
            
            await batch.commit();
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

    const ic = "h-11 pl-11 rounded-xl bg-white/5 border-white/10 focus:border-[#cb465a]/30 focus:ring-[#cb465a]/10 transition-all font-medium text-foreground placeholder:text-foreground/20 text-sm";
    const lc = "font-black uppercase tracking-widest text-[9px] ml-1 text-[#cb465a]/60";

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md mx-auto relative z-20">
            <Card className="rounded-[2.5rem] bg-black/40 backdrop-blur-3xl border-[#cb465a]/20">
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-3.5 pt-8 px-6">
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                                <Label className={lc}>Nombre</Label>
                                <div className="relative"><User className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#cb465a]/40" /><Input placeholder="Juan" value={firstName} onChange={e => setFirstName(e.target.value)} className={ic} /></div>
                            </div>
                            <div className="space-y-1">
                                <Label className={lc}>Apellido</Label>
                                <div className="relative"><User className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#cb465a]/40" /><Input placeholder="Pérez" value={lastName} onChange={e => setLastName(e.target.value)} className={ic} /></div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className={lc}>Email</Label>
                            <div className="relative"><Mail className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#cb465a]/40" /><Input type="email" placeholder="rider@email.com" value={email} onChange={e => setEmail(e.target.value)} className={ic} /></div>
                        </div>
                        <div className="space-y-1">
                            <Label className={lc}>Contraseña</Label>
                            <div className="relative"><KeyRound className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#cb465a]/40" /><Input type="password" placeholder="Min. 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} className={ic} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                                <Label className={lc}>DNI</Label>
                                <Input placeholder="12345678" value={dni} onChange={e => setDni(e.target.value)} className={ic} />
                            </div>
                            <div className="space-y-1">
                                <Label className={lc}>Patente</Label>
                                <Input placeholder="AB123CD" value={patente} onChange={e => setPatente(e.target.value.toUpperCase())} className={`${ic} uppercase`} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#cb465a]/20 rounded-xl bg-[#cb465a]/5 cursor-pointer hover:bg-[#cb465a]/10 transition-all">
                                <input type="file" accept="image/*" capture="user" className="hidden" onChange={e => setFotoRostro(e.target.files?.[0] || null)} />
                                <Camera className="h-5 w-5 text-[#cb465a] mb-1" />
                                <span className="text-[8px] font-black uppercase text-[#cb465a]/60">{fotoRostro ? '✅ LISTO' : 'ROSTRO'}</span>
                            </label>
                            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#cb465a]/20 rounded-xl bg-[#cb465a]/5 cursor-pointer hover:bg-[#cb465a]/10 transition-all">
                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setFotoVehiculo(e.target.files?.[0] || null)} />
                                <Car className="h-5 w-5 text-[#cb465a] mb-1" />
                                <span className="text-[8px] font-black uppercase text-[#cb465a]/60">{fotoVehiculo ? '✅ LISTO' : 'VEHÍCULO'}</span>
                            </label>
                        </div>

                        {/* Mercado Pago Linking Mock */}
                        <div className={cn(
                            "p-4 rounded-xl border flex items-center justify-between transition-all",
                            isMpLinked ? "bg-emerald-500/10 border-emerald-500/30" : "bg-[#cb465a]/5 border-[#cb465a]/30"
                        )}>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                                    <CreditCard className={cn("h-4 w-4", isMpLinked ? "text-emerald-400" : "text-[#cb465a]")} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white">Mercado Pago</p>
                                    <p className="text-[8px] font-bold text-foreground/40">{isMpLinked ? 'CUENTA VINCULADA' : 'REQUERIDO PARA PAGOS'}</p>
                                </div>
                            </div>
                            <Button 
                                type="button"
                                size="sm" 
                                onClick={() => {
                                    haptic.vibrateSuccess();
                                    setIsMpLinked(true);
                                }}
                                className={cn(
                                    "h-8 px-4 rounded-lg font-black text-[8px] uppercase tracking-widest",
                                    isMpLinked ? "bg-emerald-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                                )}
                            >
                                {isMpLinked ? 'OK' : 'VINCULAR'}
                            </Button>
                        </div>

                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <Checkbox checked={acceptDDJJ} onCheckedChange={(v) => setAcceptDDJJ(!!v)} className="mt-0.5 border-orange-500/40" />
                            <p className="text-[8px] text-orange-400/70 font-bold leading-relaxed uppercase tracking-tight">Declaro bajo juramento no poseer antecedentes penales.</p>
                        </div>
                        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10">
                            <Checkbox checked={acceptPrivacy} onCheckedChange={(v) => setAcceptPrivacy(!!v)} className="border-[#cb465a]/30" />
                            <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Acepto la Privacidad</p>
                        </div>
                    </CardContent>
                    <CardFooter className="pb-8 pt-4 px-6">
                        <Button type="submit" disabled={!isValid || isSubmitting} className="w-full h-14 rounded-2xl bg-[#cb465a] text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-[#cb465a]/90 shadow-[0_15px_30px_rgba(203,70,90,0.3)] disabled:opacity-30">
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Bike className="mr-2 h-5 w-5" />Enviar Solicitud</>}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <button onClick={onSwitchToLogin} className="mt-6 block mx-auto text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 hover:text-[#cb465a] transition-all">
                ¿Ya tenés cuenta? <span className="text-[#cb465a]">Ingresar</span>
            </button>
        </motion.div>
    );
}

// ─── MAIN PAGE ───────────────────────────────────────────
export default function RiderPage() {
    const { userData, user, roles, isUserLoading } = useUser();
    const { fcmToken } = useMessaging();
    const { toast } = useToast();

    const firestore = useFirestore();
    const [view, setView] = useState<'login' | 'signup'>('login');
    const [currentTab, setCurrentTab] = useState<'map' | 'earnings' | 'profile' | 'history'>('map');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isPinEntryOpen, setIsPinEntryOpen] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isOnline, setIsOnline] = useState(userData?.isOnline === true);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; heading: number | null } | undefined>(undefined);

    // Throttling References for Location Updates
    const lastUpdateAttempt = useRef<number>(0);
    const lastLocationSent = useRef<{ lat: number; lng: number } | null>(null);
    
    // ── AUDITORY FEEDBACK ──
    const radarAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            radarAudioRef.current = audio;
        }
    }, []);


    // Watch Geolocation
    useEffect(() => {
        if (!navigator.geolocation) return;

        const watcher = navigator.geolocation.watchPosition(
            (pos) => {
                const newLoc = { 
                    lat: pos.coords.latitude, 
                    lng: pos.coords.longitude,
                    heading: pos.coords.heading
                };
                setUserLocation(newLoc);

                // PERFORMANCE OPTIMIZATION: Throttled Firestore Updates
                if (isOnline && user?.uid) {
                    const now = Date.now();
                    const timeElapsed = now - lastUpdateAttempt.current;
                    
                    // Update every 20 seconds OR if moved more than ~50 meters (roughly 0.0005 deg)
                    const distanceMoved = lastLocationSent.current 
                        ? Math.sqrt(Math.pow(newLoc.lat - lastLocationSent.current.lat, 2) + Math.pow(newLoc.lng - lastLocationSent.current.lng, 2))
                        : 999;

                    if (timeElapsed > 20000 || distanceMoved > 0.0005) {
                        lastUpdateAttempt.current = now;
                        lastLocationSent.current = { lat: newLoc.lat, lng: newLoc.lng };
                        
                        updateDoc(doc(firestore, 'users', user.uid), {
                            location: { latitude: newLoc.lat, longitude: newLoc.lng },
                            heading: newLoc.heading,
                            lastUpdated: serverTimestamp()
                        }).catch(e => console.error("Throttled update failed", e));
                    }
                }
            },
            (err) => console.warn('Geo Error:', err),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watcher);
    }, [isOnline, user?.uid, firestore]);

    // Sync isOnline state
    useEffect(() => {
        if (userData?.isOnline !== undefined) {
            setIsOnline(userData.isOnline);
        }
    }, [userData?.isOnline]);

    const handleToggleOnline = async () => {
        if (!user?.uid) return;
        if (!hasActiveAccess) {
            toast({ variant: 'destructive', title: "Suscripción Requerida", description: "Tu periodo de prueba finalizó." });
            return;
        }

        const newStatus = !isOnline;
        setIsOnline(newStatus);
        haptic.vibrateMedium();

        try {
            await updateDoc(doc(firestore, 'users', user.uid), { isOnline: newStatus, lastStatusChange: serverTimestamp() });
            
            // Sync with FCM Topics if token is available
            if (fcmToken) {
                try {
                    await fetch('/api/notifications/subscribe', {
                        method: 'POST',
                        body: JSON.stringify({ 
                            token: fcmToken, 
                            topic: newStatus ? 'active_riders' : 'inactive_riders' // Logic could be improved but this covers basic broadcast
                        }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (subError) {
                    console.error("Topic sync failed", subError);
                }
            }
        } catch (error) {
            setIsOnline(!newStatus);
            toast({ variant: 'destructive', title: 'Error de Red' });
        }
    };


    // ── REAL-TIME ORDER SYNC ──
    const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
    useEffect(() => {
        if (!firestore || !user?.uid || !isOnline) {
            setAvailableOrders([]);
            return;
        }
        const q = query(
            collection(firestore, 'orders').withConverter(createConverter<Order>()), 
            where('status', 'in', ['pending', 'searching_rider']),
            limit(15)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setAvailableOrders(orders);
            
            // Sensor and Audio Trigger for new matches
            if (!snapshot.metadata.hasPendingWrites && snapshot.docChanges().some(c => c.type === 'added')) {
                haptic.vibrateSuccess();
                if (radarAudioRef.current) {
                    radarAudioRef.current.play().catch(e => console.error("Radar sound error", e));
                }
            }
        });
        return () => unsubscribe();
    }, [firestore, user?.uid, isOnline]);


    // ── ACTIVE ORDERS SYNC ──
    const myOrdersQuery = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'orders').withConverter(createConverter<Order>()), where('riderId', '==', user.uid), where('status', 'in', ['assigned', 'at_store', 'on_the_way', 'delivered', 'completed']));
    }, [firestore, user]);
    const { data: myOrders } = useCollection(myOrdersQuery);

    const activeOrders = useMemo(() => myOrders?.filter(o => ['assigned', 'at_store', 'on_the_way'].includes(o.status)) || [], [myOrders]);
    const completedOrders = useMemo(() => myOrders?.filter(o => ['delivered', 'completed'].includes(o.status)) || [], [myOrders]);

    // ── MEMBERSHIP LOGIC ──
    const isAdmin = roles.includes('admin');
    const trialEndsAt = userData?.trialEndsAt?.seconds ? userData.trialEndsAt.seconds * 1000 : 0;
    const membershipPaidUntil = userData?.membershipPaidUntil?.seconds ? userData.membershipPaidUntil.seconds * 1000 : 0;
    const hasActiveAccess = (Date.now() < trialEndsAt) || (Date.now() < membershipPaidUntil) || userData?.isMembershipWaived === true || isAdmin;

    if (isUserLoading) return null;

    // ── AUTH STATE ──
    if (!user) {
        return (
            <div className="relative flex min-h-screen flex-col items-center justify-center bg-black p-6 overflow-hidden">
                <div className="absolute top-[-5%] left-[-10%] w-[50%] h-[50%] bg-[#cb465a]/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-[#cb465a]/10 blur-[120px] rounded-full" />
                <header className="mb-12 text-center space-y-4 z-10 flex flex-col items-center">
                    <h2 className="text-5xl font-medium italic tracking-tighter text-white font-montserrat leading-none flex items-baseline">
                        Estu<span className="text-[#cb465a] font-lobster text-6xl ml-2 tracking-normal italic-none">Rider</span>
                    </h2>
                    <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.4em]">Arquitectura Logística • v3.0.0</p>
                </header>
                <AnimatePresence mode="wait">
                    {view === 'login' ? (
                        <RiderLogin key="login" onSwitchToSignup={() => setView('signup')} />
                    ) : (
                        <RiderSignup key="signup" onSwitchToLogin={() => setView('login')} />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    if (userData?.role === 'rider_pending' && !isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 text-center p-8 space-y-8">
                <div className="h-24 w-24 rounded-[3rem] bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-lg">
                    <Clock className="h-12 w-12 text-orange-500 animate-pulse" />
                </div>
                <div className="space-y-4">
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase text-zinc-900 font-montserrat">En Revisión</h2>
                    <p className="text-sm text-zinc-400 font-medium max-w-xs mx-auto leading-relaxed uppercase tracking-widest">Tu perfil está siendo auditado por el equipo central.</p>
                </div>
            </div>
        );
    }

    // ── FINAL DELIVERY LOGIC ──
    const handleCompleteDelivery = async () => {
        if (!selectedOrder || !user?.uid) return;
        haptic.vibrateSuccess();
        try {
            await updateDoc(doc(firestore, 'orders', selectedOrder.id), { 
                status: 'completed', 
                deliveryPinValidated: true,
                completedAt: serverTimestamp() 
            });
            setIsPinEntryOpen(false);
            setSelectedOrder(null);
            toast({ title: '✅ Entrega Finalizada', description: 'El pago ha sido validado.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error al finalizar' });
        }
    };

    return (
        <div className="relative min-h-screen w-full bg-zinc-50 overflow-hidden selection:bg-[#cb465a]/30 text-zinc-900">
            {/* SOLID BACKDROP */}
            <div className="fixed inset-0 bg-zinc-50 z-0" />

            {/* BACKGROUND MAP (MAP-CENTRIC) */}
            <div className={cn(
                "fixed inset-0 transition-all duration-700",
                currentTab !== 'map' && "blur-xl scale-110 opacity-30 pointer-events-none"
            )}>
                <RiderMap 
                    orders={availableOrders} 
                    userLocation={userLocation}
                    isOnline={isOnline}
                    activeTripOrder={activeOrders[0] || null}
                    onOrderSelect={(o) => {
                        haptic.vibrateMedium();
                        setSelectedOrder(o);
                    }} 
                />
            </div>

            {/* FLOATING BRANDING & CONTROLS (CLEAN STYLE) */}
            <div className="fixed top-0 left-0 right-0 z-40 p-6 pointer-events-none flex justify-between items-start">
                <div className="flex flex-col items-start gap-4 pointer-events-auto">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsSidebarOpen(true)}
                        className="h-14 w-14 rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-xl shadow-lg active:scale-95 transition-all text-zinc-900 hover:text-[#cb465a] hover:bg-zinc-50"
                    >
                        <Menu className="h-7 w-7" />
                    </Button>
                    
                    <Logo brand="rider" variant="rosa" className="h-[120px] w-auto drop-shadow-[0_10px_30px_rgba(203,70,90,0.2)]" />
                </div>

                <div className="pointer-events-auto">
                    <div className={cn(
                        "relative h-14 py-1 pl-5 pr-1.5 rounded-[1.8rem] border transition-all duration-500 flex items-center gap-4 shadow-lg",
                        isOnline 
                            ? "bg-emerald-500/10 border-emerald-500/20" 
                            : "bg-white/80 backdrop-blur-xl border-zinc-200"
                    )}>
                        <div className="flex flex-col items-end">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-[0.1em] leading-none transition-colors",
                                isOnline ? "text-emerald-600" : "text-zinc-400"
                            )}>
                                {isOnline ? 'ONLINE' : 'OFFLINE'}
                            </span>
                            <span className="text-[7px] font-black text-zinc-300 uppercase tracking-tighter mt-1.5">RADAR ACTIVO</span>
                        </div>
                        <div className={cn(
                            "p-2 rounded-full transition-all duration-500",
                            isOnline ? "bg-emerald-500/20" : "bg-zinc-100"
                        )}>
                            <Switch 
                                checked={isOnline} 
                                onCheckedChange={handleToggleOnline}
                                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-zinc-300"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA (FLOATING) */}
            <main className="relative z-30 h-full pt-32 pb-40 px-6 overflow-y-auto pointer-events-none">
                <div className="pointer-events-auto max-w-xl mx-auto space-y-6">
                    <AnimatePresence mode='wait'>
                        {currentTab === 'earnings' && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                <RiderEarnings orders={completedOrders} />
                            </motion.div>
                        )}

                        {currentTab === 'history' && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                <RiderHistory orders={completedOrders} />
                            </motion.div>
                        )}

                        {currentTab === 'profile' && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                <RiderProfile />
                            </motion.div>
                        )}
                        
                        {currentTab === 'map' && activeOrders.length > 0 && (
                            <div className="space-y-4 pt-4">
                                <p className="text-[10px] font-black uppercase tracking-[.4em] text-[#cb465a] ml-4">Viajes en curso</p>
                                {activeOrders.map(order => (
                                    <Card key={order.id} className="bg-white/80 backdrop-blur-3xl border-zinc-200 rounded-[2.5rem] overflow-hidden group shadow-xl">
                                        <CardContent className="p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-14 w-14 rounded-2xl bg-[#cb465a]/10 flex items-center justify-center">
                                                    <Navigation className="h-6 w-6 text-[#cb465a]" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-lg font-black italic uppercase tracking-tighter text-zinc-900">{order.supplierName}</p>
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase">{order.deliveryAddress}</p>
                                                </div>
                                            </div>
                                            <Button 
                                                onClick={() => {
                                                    haptic.vibrateMedium();
                                                    setSelectedOrder(order);
                                                }}
                                                className="bg-[#cb465a] hover:bg-[#cb465a]/90 h-14 w-14 rounded-2xl shadow-lg shadow-[#cb465a]/20"
                                            >
                                                <ArrowRight className="h-5 w-5" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* SELECTION OVERLAY (BOTTOM SHEET STYLE) */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 z-[70] bg-white border-t border-zinc-200 rounded-t-[3rem] p-8 pb-12 shadow-2xl">
                            <div className="w-12 h-1.5 bg-zinc-100 rounded-full mx-auto mb-8" />
                            
                            <div className="space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <Badge className="bg-[#cb465a]/10 text-[#cb465a] border-0 text-[8px] font-black tracking-widest uppercase px-3 py-1">Entrega Activa</Badge>
                                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-zinc-900 font-montserrat">{selectedOrder.supplierName}</h3>
                                        <p className="text-xs font-bold text-zinc-400">{selectedOrder.deliveryAddress}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-[#cb465a]/60">COBRAR</p>
                                        <p className="text-3xl font-black tracking-tighter text-[#cb465a] font-inter">${(selectedOrder.total || 0).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* DOOR PAYMENT BANNER */}
                                <div className="bg-[#cb465a] rounded-3xl p-6 border-4 border-white shadow-xl flex items-center justify-between overflow-hidden relative">
                                    <div className="absolute right-0 top-0 p-4 opacity-10"><Info className="h-12 w-12 text-black" /></div>
                                    <div className="space-y-0.5 relative z-10">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/80">PAGO EN PUERTA</p>
                                        <p className="text-lg font-black italic text-white uppercase">Cobrar al Cliente</p>
                                    </div>
                                    <div className="text-right relative z-10">
                                        <p className="text-sm font-black text-white/90">Efectivo / Alias</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-100 space-y-4">
                                    <div className="flex items-center gap-3 text-zinc-600">
                                        <MapPin className="h-4 w-4 text-[#cb465a]" />
                                        <span className="text-xs font-bold uppercase truncate">{selectedOrder.deliveryAddress}</span>
                                    </div>
                                </div>

                                {activeOrders.some(o => o.id === selectedOrder.id) ? (
                                    <Button 
                                        onClick={() => setIsPinEntryOpen(true)}
                                        className="w-full h-20 rounded-[2.5rem] bg-[#cb465a] text-white font-black text-lg uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
                                    >
                                        FINALIZAR ENTREGA
                                    </Button>
                                ) : (
                                    <Button 
                                        disabled={isAccepting || !hasActiveAccess || !isOnline}
                                        onClick={async () => {
                                            if (!hasActiveAccess || !isOnline) return;
                                            setIsAccepting(true);
                                            haptic.vibrateMedium();
                                            try {
                                                const res = await acceptDeliveryOrder(selectedOrder.id, user.uid);
                                                if (res.success) {
                                                    setSelectedOrder(null);
                                                    toast({ title: '✅ Pedido Aceptado', description: 'Dirigite al comercio para retirar el pedido.' });
                                                    haptic.vibrateSuccess();
                                                } else {
                                                    throw new Error((res as any).error);
                                                }
                                            } catch (e: any) { 
                                                haptic.vibrateError();
                                                toast({ variant: 'destructive', title: 'Error de Concurrencia', description: e.message || 'No se pudo aceptar el pedido.' }); 
                                            }
                                            finally { setIsAccepting(false); }
                                        }}
                                        className="w-full h-20 rounded-[2.5rem] bg-[#cb465a] text-white font-black text-lg uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all disabled:opacity-30"
                                    >
                                        {isAccepting ? <Loader2 className="animate-spin" /> : 'ACEPTAR VIAJE SEGURO'}
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* PIN ENTRY MODAL */}
            <RiderPinEntry 
                isOpen={isPinEntryOpen} 
                onClose={() => setIsPinEntryOpen(false)} 
                correctPin={selectedOrder?.deliveryPin || '1234'} // Fallback for legacy
                onSuccess={handleCompleteDelivery} 
            />

            {/* NAVIGATION (BOTTOM) */}
            <RiderBottomNav 
                currentTab={currentTab}
                onTabChange={setCurrentTab}
            />

            {/* SIDEBAR */}
            <RiderSidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
                currentView={currentTab} 
                onViewChange={setCurrentTab} 
                isOnline={isOnline} 
                onToggleOnline={handleToggleOnline}
                userName={userData?.firstName}
            />

            {/* MEMBERSHIP BLOCKER */}
            {!hasActiveAccess && (
                <div className="fixed inset-0 z-[200] bg-zinc-50/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in duration-500">
                    <div className="h-32 w-32 rounded-[4rem] bg-[#cb465a]/10 border-4 border-[#cb465a]/20 flex items-center justify-center shadow-2xl shadow-[#cb465a]/10">
                        <AlertTriangle className="h-16 w-16 text-[#cb465a]" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase text-zinc-900 font-montserrat">Prueba Finalizada</h2>
                        <p className="text-sm text-zinc-400 font-medium max-w-xs mx-auto leading-relaxed uppercase tracking-widest">Tus 7 días de acceso gratuito han expirado. Regularizá tu membresía para continuar operando en Estuclub.</p>
                    </div>
                    <Button className="h-16 px-12 rounded-[2rem] bg-[#cb465a] text-white font-black uppercase tracking-widest shadow-2xl shadow-[#cb465a]/30 hover:scale-105 transition-transform">
                        Pagar Membresía
                    </Button>
                </div>
            )}
        </div>
    );
}

