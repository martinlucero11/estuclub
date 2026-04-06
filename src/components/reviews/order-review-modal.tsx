'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, Truck, Store, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { Order } from '@/types/data';
import { submitOrderReview } from '@/lib/actions/reviews';
import { useToast } from '@/hooks/use-toast';

interface OrderReviewModalProps {
    order: Order;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * OrderReviewModal (Misión 4: Centro de Confianza)
 * Doble calificación (Local + Rider) con sistema de estrellas doradas.
 */
export function OrderReviewModal({ order, isOpen, onClose }: OrderReviewModalProps) {
    const { toast } = useToast();
    const [localRating, setLocalRating] = useState(5);
    const [riderRating, setRiderRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        haptic.vibrateMedium();
        
        try {
            const res = await submitOrderReview({
                orderId: order.id,
                supplierId: order.supplierId,
                riderId: order.riderId || '',
                userId: order.customerId,
                localRating,
                riderRating,
                comment
            });

            if (res.success) {
                toast({ title: '¡Gracias!', description: 'Tu reputación ayuda a la comunidad.' });
                onClose();
            } else {
                throw new Error(res.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
                    />
                    <motion.div 
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        className="fixed inset-x-0 bottom-0 z-[110] p-4 flex flex-col items-center justify-end min-h-[100dvh]"
                    >
                        <div className="w-full max-w-md bg-white rounded-[3rem] p-8 space-y-8 shadow-2xl relative overflow-hidden pointer-events-auto max-h-[95dvh] overflow-y-auto no-scrollbar border-t-8 border-[#cb465a]">
                            
                            <header className="text-center space-y-2">
                                <div className="h-16 w-16 bg-amber-100 rounded-full mx-auto flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-amber-500 animate-pulse" />
                                </div>
                                <h1 className="text-3xl font-black italic tracking-tighter text-black uppercase leading-none">Tu Opinión Vale</h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40">Calificando Pedido #{order.id.slice(-6).toUpperCase()}</p>
                            </header>

                            <div className="space-y-8">
                                {/* LOCAL RATING */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-[#cb465a]/5 rounded-xl flex items-center justify-center">
                                            <Store className="h-5 w-5 text-[#cb465a]" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-tight italic">{order.supplierName}</h3>
                                            <p className="text-[9px] font-bold text-black/40 uppercase">Calidad del Producto</p>
                                        </div>
                                    </div>
                                    <StarPicker rating={localRating} onChange={setLocalRating} />
                                </div>

                                {/* RIDER RATING */}
                                {order.riderId && (
                                    <div className="space-y-4 pt-4 border-t border-black/5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center">
                                                <Truck className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-tight italic">{order.riderName || 'El Repartidor'}</h3>
                                                <p className="text-[9px] font-bold text-black/40 uppercase">Logística y Entrega</p>
                                            </div>
                                        </div>
                                        <StarPicker rating={riderRating} onChange={setRiderRating} />
                                    </div>
                                )}

                                {/* COMMENT */}
                                <div className="space-y-2 pt-4 border-t border-black/5">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">Contanos más (Opcional)</Label>
                                    <Textarea 
                                        placeholder="¡Estaba riquísimo! El rider fue súper rápido..."
                                        className="h-24 border-black/5 rounded-2xl bg-slate-50 focus-visible:ring-primary/20 font-bold"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                </div>

                                <Button 
                                    className="w-full h-16 bg-black text-white font-black text-xl uppercase tracking-widest italic rounded-2xl shadow-2xl hover:bg-slate-900 active:scale-95 transition-all"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'ENVIAR RESEÑA 🔥'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function StarPicker({ rating, onChange }: { rating: number; onChange: (n: number) => void }) {
    return (
        <div className="flex justify-between items-center px-4">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    onClick={() => {
                        haptic.vibrateMedium();
                        onChange(star);
                    }}
                    className="p-2 transition-transform active:scale-150"
                >
                    <Star 
                        className={cn(
                            "h-8 w-8 transition-all duration-300",
                            star <= rating ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" : "text-black/10"
                        )}
                    />
                </button>
            ))}
        </div>
    );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
    return <p className={cn("text-xs font-bold", className)}>{children}</p>;
}
