'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order } from '@/types/data';
import { Button } from '@/components/ui/button';
import { BellRing, Package, MapPin, XCircle, CheckCircle } from 'lucide-react';
import { auth } from '@/firebase';
import { updateOrderOperationStatus } from '@/lib/actions/order-actions';
import { useToast } from '@/hooks/use-toast';

interface NewOrderAlarmModalProps {
    order: Order | null;
    onClose: () => void;
}

// Tiny transparent audio beep in base64 to ensure an audio source exists 
// (can be replaced by an actual mp3 in the public folder)
const BEEP_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"+Array(100).join("A");

export function NewOrderAlarmModal({ order, onClose }: NewOrderAlarmModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (order && audioRef.current) {
            const hasInteracted = localStorage.getItem('estuclub_interacted');
            if (hasInteracted === 'true') {
                audioRef.current.play().catch(console.error);
            }
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, [order]);

    const handleAction = async (status: 'accepted' | 'rejected') => {
        if (!order) return;
        
        if (status === 'rejected') {
            const confirmed = window.confirm("¿Estás seguro de rechazar este pedido? Esto cancelará la orden.");
            if (!confirmed) return;
        }

        setIsProcessing(true);
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error("Sesión expirada. Por favor recarga.");

            const res = await updateOrderOperationStatus(order.id, status, token);
            
            if (res.success) {
                toast({ title: status === 'accepted' ? 'Pedido Aceptado' : 'Pedido Rechazado' });
                onClose();
            } else {
                throw new Error((res as any).error);
            }
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            {order && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                >
                    <audio ref={audioRef} src="/notification.mp3" loop />
                    
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-lg bg-zinc-900 border border-[#cb465a]/30 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(203,70,90,0.2)] text-white overflow-hidden relative"
                    >
                        {/* Alarm Glow Background */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#cb465a] animate-pulse" />
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#cb465a]/20 blur-[50px] rounded-full" />
                        
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-[#cb465a]/20 flex items-center justify-center animate-pulse border border-[#cb465a]/50">
                                    <BellRing className="h-8 w-8 text-[#cb465a]" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black italic tracking-tighter text-[#cb465a] uppercase">¡NUEVO PEDIDO!</h2>
                                    <p className="text-xs font-bold text-white/60 tracking-widest uppercase">#{order.id.slice(-6).toUpperCase()}</p>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#cb465a]">Cliente</p>
                                        <p className="text-lg font-black tracking-tight">{order.customerName}</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#cb465a]">Método</p>
                                        <p className="text-sm font-bold uppercase tracking-widest text-white/80">
                                            {order.paymentMethod === 'cash_at_door' ? 'Efectivo' : 'Mercado Pago'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-white/10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#cb465a]">Detalle</p>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="font-bold text-white/80"><span className="text-[#cb465a]">{item.quantity}x</span> {item.name}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-start gap-3 pt-2 border-t border-white/10">
                                    <MapPin className="h-4 w-4 text-[#cb465a] mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#cb465a] mb-0.5">Destino</p>
                                        <p className="text-sm font-bold text-white/80 leading-tight">{order.deliveryAddress || 'Retiro en Local'}</p>
                                        {order.deliveryNotes && <p className="text-xs text-white/50 italic mt-1">"{order.deliveryNotes}"</p>}
                                    </div>
                                </div>
                                
                                {order.paymentMethod === 'cash_at_door' && (
                                    <div className="bg-[#cb465a]/10 border border-[#cb465a]/30 rounded-xl p-3 flex justify-between items-center mt-2">
                                        <span className="text-xs font-black uppercase tracking-widest text-[#cb465a]">Cobrar en Efectivo:</span>
                                        <span className="text-xl font-black tabular-nums tracking-tighter text-[#cb465a]">${order.total.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button 
                                    onClick={() => handleAction('rejected')}
                                    disabled={isProcessing}
                                    variant="outline"
                                    className="flex-1 h-14 rounded-2xl border-white/10 text-white/60 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 font-black uppercase tracking-widest text-xs transition-all"
                                >
                                    <XCircle className="mr-2 h-4 w-4" /> Rechazar
                                </Button>
                                <Button 
                                    onClick={() => handleAction('accepted')}
                                    disabled={isProcessing}
                                    className="flex-[2] h-14 rounded-2xl bg-[#cb465a] hover:bg-[#cb465a]/80 text-white font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(203,70,90,0.4)] transition-all"
                                >
                                    <CheckCircle className="mr-2 h-5 w-5" /> Aceptar Pedido
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
