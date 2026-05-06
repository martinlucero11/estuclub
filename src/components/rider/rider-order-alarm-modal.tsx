'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Order } from '@/types/data';
import { Button } from '@/components/ui/button';
import { BellRing, MapPin, XCircle, CheckCircle, Navigation } from 'lucide-react';
import { auth } from '@/firebase';
import { acceptDeliveryOrder } from '@/lib/actions/order-actions';
import { useToast } from '@/hooks/use-toast';
import { haptic } from '@/lib/haptics';

interface RiderOrderAlarmModalProps {
    order: Order | null;
    onClose: () => void;
    onAccept: () => void;
}

export function RiderOrderAlarmModal({ order, onClose, onAccept }: RiderOrderAlarmModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { toast } = useToast();

    // Auto-close after 30 seconds
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (order) {
            timeout = setTimeout(() => {
                onClose();
            }, 30000); // 30 seconds
        }
        return () => clearTimeout(timeout);
    }, [order, onClose]);

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

    const handleAccept = async () => {
        if (!order) return;
        setIsProcessing(true);
        haptic.vibrateMedium();
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error("Sesión expirada. Por favor recarga.");

            const res = await acceptDeliveryOrder(order.id, token);
            
            if (res.success) {
                haptic.vibrateSuccess();
                toast({ title: '✅ Pedido Aceptado', description: 'Dirigite al comercio para retirar.' });
                onAccept();
            } else {
                throw new Error((res as any).error);
            }
        } catch (error: any) {
            console.error(error);
            haptic.vibrateError();
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'El pedido ya fue tomado o no está disponible.' });
            onClose(); // Close on error since it might be taken
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = () => {
        haptic.vibrateSubtle();
        onClose(); // Simply close, leaving it available for others
    };

    return (
        <AnimatePresence>
            {order && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                >
                    <audio ref={audioRef} src="/notification.mp3" loop />
                    
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="w-full max-w-md bg-zinc-900 border border-[#cb465a]/30 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(203,70,90,0.2)] text-white overflow-hidden relative"
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
                                    <h2 className="text-2xl font-black italic tracking-tighter text-[#cb465a] uppercase">VIAJE DISPONIBLE</h2>
                                    <p className="text-xs font-bold text-white/60 tracking-widest uppercase">#{order.id.slice(-6).toUpperCase()}</p>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4 relative overflow-hidden">
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 bg-[#cb465a]/20 p-1.5 rounded-full border border-[#cb465a]/30">
                                            <Navigation className="h-3.5 w-3.5 text-[#cb465a]" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">Retirar en</p>
                                            <p className="text-lg font-black tracking-tight text-white leading-tight">{order.supplierName}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Small dashed line connector could go here */}

                                    <div className="flex items-start gap-3 pt-2 border-t border-white/10">
                                        <div className="mt-1 bg-white/10 p-1.5 rounded-full border border-white/20">
                                            <MapPin className="h-3.5 w-3.5 text-white/60" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">Entregar a</p>
                                            <p className="text-sm font-bold text-white/90 leading-tight">{order.deliveryAddress || 'Dirección de entrega'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#cb465a]/10 border border-[#cb465a]/30 rounded-2xl p-4 flex justify-between items-center text-center mx-auto">
                                <div className="flex-1 border-r border-[#cb465a]/20">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#cb465a]/80 mb-1">Distancia</p>
                                    <p className="text-xl font-black tabular-nums tracking-tighter text-white">
                                        {order.supplierCoords && order.deliveryCoords ? 
                                            (6371 * 2 * Math.atan2(Math.sqrt(Math.sin(((order.deliveryCoords.latitude - order.supplierCoords.latitude) * Math.PI / 180)/2) * Math.sin(((order.deliveryCoords.latitude - order.supplierCoords.latitude) * Math.PI / 180)/2) + Math.cos(order.supplierCoords.latitude * Math.PI / 180) * Math.cos(order.deliveryCoords.latitude * Math.PI / 180) * Math.sin(((order.deliveryCoords.longitude - order.supplierCoords.longitude) * Math.PI / 180)/2) * Math.sin(((order.deliveryCoords.longitude - order.supplierCoords.longitude) * Math.PI / 180)/2)), Math.sqrt(1 - (Math.sin(((order.deliveryCoords.latitude - order.supplierCoords.latitude) * Math.PI / 180)/2) * Math.sin(((order.deliveryCoords.latitude - order.supplierCoords.latitude) * Math.PI / 180)/2) + Math.cos(order.supplierCoords.latitude * Math.PI / 180) * Math.cos(order.deliveryCoords.latitude * Math.PI / 180) * Math.sin(((order.deliveryCoords.longitude - order.supplierCoords.longitude) * Math.PI / 180)/2) * Math.sin(((order.deliveryCoords.longitude - order.supplierCoords.longitude) * Math.PI / 180)/2))))).toFixed(1) + ' km'
                                            : '--'
                                        }
                                    </p>
                                </div>
                                <div className="flex-1 border-r border-[#cb465a]/20">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#cb465a]/80 mb-1">Ganancia</p>
                                    <p className="text-xl font-black tabular-nums tracking-tighter text-white">${(order.deliveryFee || 0).toLocaleString()}</p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#cb465a]/80 mb-1">A cobrar</p>
                                    <p className="text-xl font-black tabular-nums tracking-tighter text-white">${order.paymentMethod === 'cash_at_door' ? (order.total || 0).toLocaleString() : '0'}</p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button 
                                    onClick={handleReject}
                                    disabled={isProcessing}
                                    variant="outline"
                                    className="flex-[1] h-14 rounded-2xl border-white/10 text-white/60 hover:bg-white/5 hover:text-white font-black uppercase tracking-widest text-xs transition-all"
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                    onClick={handleAccept}
                                    disabled={isProcessing}
                                    className="flex-[3] h-14 rounded-2xl bg-[#cb465a] hover:bg-[#cb465a]/80 text-white font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(203,70,90,0.4)] transition-all"
                                >
                                    <CheckCircle className="mr-2 h-5 w-5" /> {isProcessing ? 'Aceptando...' : 'Aceptar Viaje'}
                                </Button>
                            </div>
                        </div>
                        
                        {/* Progress Bar for 30s timeout */}
                        <motion.div 
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: 30, ease: 'linear' }}
                            className="absolute bottom-0 left-0 h-1 bg-[#cb465a]"
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
