'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { Order, UserProfile } from '@/types/data';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, 
    MapPin, 
    Clock, 
    Phone, 
    MessageCircle, 
    CheckCircle2, 
    AlertCircle, 
    Navigation, 
    ShieldCheck,
    CreditCard,
    Bike,
    Truck,
    KeyRound,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { useToast } from '@/hooks/use-toast';

export default function RiderTripPage() {
    const { id } = useParams();
    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [order, setOrder] = useState<Order | null>(null);
    const [pinEntry, setPinEntry] = useState('');
    const [showPinModal, setShowPinModal] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [pinError, setPinError] = useState(false);

    // 1. Listen to Order
    useEffect(() => {
        if (!firestore || !id) return;
        const unsub = onSnapshot(doc(firestore, 'orders', id as string), (doc) => {
            if (doc.exists()) {
                setOrder({ id: doc.id, ...doc.data() } as Order);
            }
        });
        return () => unsub();
    }, [firestore, id]);

    // 2. Fetch User Info
    const userRef = order?.userId ? doc(firestore, 'users', order.userId) : null;
    const { data: student } = useDoc<UserProfile>(userRef);

    const handleValidatePin = async () => {
        if (!order || !firestore || !id) return;
        
        if (pinEntry !== order.deliveryPin) {
            haptic.vibrateError();
            setPinError(true);
            setTimeout(() => setPinError(false), 1000);
            return;
        }

        setIsValidating(true);
        haptic.vibrateSuccess();
        
        try {
            await updateDoc(doc(firestore, 'orders', id as string), {
                status: 'delivered',
                updatedAt: Timestamp.now(),
                deliveryPinValidated: true
            });
            
            toast({ title: "🎁 ¡Entrega Confirmada!", description: "El pedido ha sido finalizado con éxito." });
            setShowPinModal(false);
        } catch (error) {
            console.error("Error validating PIN:", error);
            toast({ variant: 'destructive', title: "Error", description: "No se pudo finalizar la entrega." });
        } finally {
            setIsValidating(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!id || !firestore) return;
        haptic.vibrateMedium();
        try {
            await updateDoc(doc(firestore, 'orders', id as string), {
                status: newStatus,
                updatedAt: Timestamp.now()
            });
            toast({ title: "Estado Actualizado", description: `Pedido marcado como ${newStatus.replace('_', ' ')}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error" });
        }
    };

    if (!order) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-pink-500 animate-spin" />
        </div>
    );

    const isDelivered = order.status === 'delivered' || order.status === 'completed';

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-pink-500/30 pb-32">
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-white/5">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="text-center">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Hoja de Ruta</h2>
                    <p className="text-sm font-black italic tracking-tighter text-pink-500">#{order.id.slice(-6).toUpperCase()}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                    <Bike className="h-5 w-5 text-pink-500" />
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6">
                
                {/* CUSTOMER INFO */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex items-center gap-6">
                    <div className="h-20 w-20 rounded-[2rem] bg-pink-500/10 border border-pink-500/20 flex flex-col items-center justify-center">
                        <UserIcon className="h-10 w-10 text-pink-500" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <h3 className="text-xl font-black tracking-tight italic uppercase">{order.userName}</h3>
                        <div className="flex gap-2">
                             {order.userPhone && (
                                <>
                                    <Button size="icon" className="h-12 w-12 rounded-2xl bg-white text-black hover:bg-slate-200" asChild>
                                        <a href={`tel:${order.userPhone}`}><Phone className="h-6 w-6" /></a>
                                    </Button>
                                    <Button size="icon" className="h-12 w-12 rounded-2xl bg-green-500 text-white hover:bg-green-600 shadow-xl shadow-green-500/20" asChild>
                                        <a href={`https://wa.me/${order.userPhone}`} target="_blank" rel="noreferrer"><MessageCircle className="h-6 w-6" /></a>
                                    </Button>
                                </>
                             )}
                             <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-white/10 text-slate-400">
                                <AlertCircle className="h-6 w-6" />
                             </Button>
                        </div>
                    </div>
                </div>

                {/* CASH CARD */}
                {order.deliveryPaymentStatus === 'pending' && !isDelivered && (
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#d93b64] p-8 rounded-[3rem] border-8 border-black shadow-[0_30px_60px_rgba(217,59,100,0.4)] text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-20">
                            <CreditCard className="h-24 w-24 text-black rotate-12" />
                        </div>
                        <div className="relative z-10 space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">💰 Cobrar en Mano</span>
                            <h2 className="text-6xl font-black italic tracking-tighter text-black tabular-nums">
                                ${order.deliveryFee || order.deliveryCost}
                            </h2>
                            <p className="text-[9px] font-bold text-black/60 uppercase tracking-widest pt-2">Efectivo o Transferencia Directa</p>
                        </div>
                    </motion.div>
                )}

                {/* MAP PLACEHOLDER */}
                <div className="relative h-[30vh] w-full rounded-[3rem] bg-[#111111] border border-white/5 overflow-hidden shadow-inner group">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-pink-500/20 blur-3xl animate-pulse" />
                            <Navigation className="h-16 w-16 text-pink-500 relative z-10 animate-bounce" />
                        </div>
                    </div>
                    <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Punto de Entrega</p>
                            <p className="text-sm font-black tracking-tight leading-none truncate max-w-[200px]">{order.deliveryAddress}</p>
                        </div>
                        <Button className="h-14 px-6 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 shadow-2xl" asChild>
                             <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress || '')}`} target="_blank" rel="noreferrer">
                                Abrir GPS
                             </a>
                        </Button>
                    </div>
                </div>

                {/* MIDWAY STATUS ACTIONS */}
                {!isDelivered && (
                    <div className="grid grid-cols-2 gap-3">
                        <Button 
                            variant="outline" 
                            disabled={order.status === 'at_store'}
                            onClick={() => handleUpdateStatus('at_store')}
                            className={cn(
                                "h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-white/10",
                                order.status === 'at_store' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-white/5 text-slate-400"
                            )}
                        >
                             <StoreIcon className="mr-2 h-4 w-4" /> Llegué al Local
                        </Button>
                        <Button 
                            variant="outline" 
                            disabled={order.status === 'on_the_way'}
                            onClick={() => handleUpdateStatus('on_the_way')}
                            className={cn(
                                "h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-white/10",
                                order.status === 'on_the_way' ? "bg-blue-500/10 border-blue-500/20 text-blue-500" : "bg-white/5 text-slate-400"
                            )}
                        >
                             <Truck className="mr-2 h-4 w-4" /> Lo tengo / Voy
                        </Button>
                    </div>
                )}

                {/* ADDRESS DETAILS */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                    <div className="flex gap-4">
                        <MapPin className="h-5 w-5 text-pink-500" />
                        <div className="space-y-1">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dirección</h4>
                            <p className="text-base font-black italic">{order.deliveryAddress}</p>
                        </div>
                    </div>
                    {order.deliveryNote && (
                         <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                            <p className="text-sm font-bold text-slate-400 italic">"{order.deliveryNote}"</p>
                         </div>
                    )}
                </div>

                {/* FINAL ACTION */}
                {!isDelivered ? (
                    <Button 
                        onClick={() => {
                            haptic.vibrateMedium();
                            setShowPinModal(true);
                        }}
                        className="w-full h-20 bg-[#d93b64] text-white font-black text-2xl uppercase tracking-[0.2em] italic rounded-[2rem] shadow-[0_20px_50px_rgba(217,59,100,0.3)] hover:scale-[1.02] active:scale-95 transition-all fixed bottom-8 left-4 right-4 max-w-md mx-auto"
                    >
                        FINALIZAR ENTREGA 🎁
                    </Button>
                ) : (
                    <div className="bg-green-500/10 border border-green-500/20 p-10 rounded-[3rem] text-center space-y-4 animate-in zoom-in-95 duration-500">
                        <div className="h-24 w-24 bg-green-500 rounded-full mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.3)] border-8 border-[#050505]">
                            <CheckCircle2 className="h-12 w-12 text-black" />
                        </div>
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-green-500">¡Completado!</h2>
                        <Button variant="ghost" onClick={() => router.push('/rider')} className="text-slate-500 font-black uppercase tracking-widest text-[10px]">
                            Volver al Listado
                        </Button>
                    </div>
                )}
            </main>

            {/* PIN VALIDATION MODAL */}
            <AnimatePresence>
                {showPinModal && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPinModal(false)} 
                            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100]" 
                        />
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="fixed inset-x-0 bottom-0 z-[110] p-4 flex flex-col items-center justify-end h-screen"
                        >
                            <div className="w-full max-w-md bg-white rounded-[3rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
                                 <div className="text-center space-y-2">
                                     <div className="h-20 w-20 bg-pink-500/5 rounded-full mx-auto flex items-center justify-center">
                                         <ShieldCheck className="h-10 w-10 text-pink-500" />
                                     </div>
                                     <h2 className="text-4xl font-black italic uppercase tracking-tighter text-black leading-none">Validación Requerida</h2>
                                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Entrega Biometrizada Estuclub</p>
                                 </div>

                                 <div className="space-y-6">
                                     <div className="text-center">
                                         <p className="text-sm font-bold text-slate-600 mb-4 px-4">Pedile al cliente el código de 4 dígitos que figura en su app.</p>
                                         <motion.div
                                            animate={pinError ? { x: [-10, 10, -10, 10, 0] } : {}}
                                         >
                                            <Input 
                                                type="text" 
                                                inputMode="numeric"
                                                maxLength={4}
                                                placeholder="0 0 0 0"
                                                value={pinEntry}
                                                onChange={e => {
                                                    const v = e.target.value.replace(/\D/g, '');
                                                    if (v.length <= 4) setPinEntry(v);
                                                }}
                                                className={cn(
                                                    "h-24 text-center text-6xl font-black italic tabular-nums tracking-[0.2em] rounded-[2rem] border-4 focus:ring-0 transition-all",
                                                    pinError ? "border-red-500 text-red-500 bg-red-50" : "border-slate-100 bg-slate-50 text-black focus:border-pink-500/30"
                                                )}
                                            />
                                         </motion.div>
                                         <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-4">Transacción Protegida</p>
                                     </div>

                                     <Button 
                                        onClick={handleValidatePin}
                                        disabled={pinEntry.length < 4 || isValidating}
                                        className="w-full h-20 bg-black text-white font-black text-xl uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-slate-900 transition-all"
                                     >
                                         {isValidating ? <Loader2 className="h-6 w-6 animate-spin" /> : "VALIDAR Y ENTREGAR 🔥"}
                                     </Button>

                                     <Button variant="ghost" onClick={() => setShowPinModal(false)} className="w-full text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                         Quizás más tarde
                                     </Button>
                                 </div>

                                 <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4 items-start">
                                     <AlertTriangleIcon className="h-5 w-5 text-amber-500 shrink-0" />
                                     <div className="space-y-1">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600">Alerta de Seguridad</h4>
                                        <p className="text-[10px] font-bold text-amber-600/80 leading-relaxed text-left">No entregues el producto hasta validar el PIN. Esto garantiza que recibiste el dinero y finaliza tu responsabilidad.</p>
                                     </div>
                                 </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

function StoreIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
        <path d="M2 7h20" />
        <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
      </svg>
    )
}

function AlertTriangleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function UserIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
}
