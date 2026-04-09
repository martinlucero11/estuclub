'use client';

import React from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Package, 
    ShoppingBag, 
    MapPin, 
    Clock, 
    Check, 
    X, 
    User,
    ArrowRight
} from 'lucide-react';
import { Order } from '@/types/data';
import { cn } from '@/lib/utils';

interface NewOrderModalProps {
    order: Order | null;
    open: boolean;
    onClose: () => void;
    onAccept: (order: Order) => void;
    onReject: (order: Order) => void;
}

export function NewOrderModal({ order, open, onClose, onAccept, onReject }: NewOrderModalProps) {
    if (!order) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-md bg-white border-none rounded-[3rem] overflow-hidden p-0 shadow-2xl animate-in zoom-in-95 duration-500">
                {/* Header with Pulse Animation */}
                <div className="bg-primary p-8 text-center space-y-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
                    <div className="h-20 w-20 rounded-[2.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-2 border border-white/30 animate-pulse">
                        <ShoppingBag className="h-10 w-10 text-white" />
                    </div>
                    <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white font-montserrat">
                        ¡NUEVO PEDIDO!
                    </DialogTitle>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/20">
                        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Esperando Acción</span>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {/* Order Meta */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-black/5 border border-black/5 space-y-1">
                            <p className="text-[8px] font-black uppercase text-black/40">ID Pedido</p>
                            <p className="text-sm font-black text-black">#{order.id.slice(-6).toUpperCase()}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-black/5 border border-black/5 space-y-1">
                            <p className="text-[8px] font-black uppercase text-black/40">Tipo</p>
                            <p className="text-sm font-black text-primary italic uppercase">{order.type === 'delivery' ? 'Delivery' : 'Retiro'}</p>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-black text-lg text-black leading-none">{order.customerName}</h4>
                                <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">{order.customerPhone}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-4 text-black/60">
                            <MapPin className="h-5 w-5 mt-0.5 text-primary" />
                            <p className="text-xs font-bold leading-relaxed">{order.deliveryAddress || 'Retiro en Club'}</p>
                        </div>
                    </div>

                    <hr className="border-black/5" />

                    {/* Items List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Resumen del Pedido</h5>
                            <Badge variant="outline" className="rounded-lg text-[9px] font-black">{order.items.length} productos</Badge>
                        </div>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-black/[0.02] p-2 rounded-xl border border-black/[0.02]">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-primary italic">{item.quantity}x</span>
                                        <span className="text-xs font-bold text-black/80">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-black/40">${(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total Amount Card */}
                    <div className="bg-primary/5 rounded-3xl p-6 border-2 border-primary/10 flex justify-between items-center overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 scale-150">
                           <ShoppingBag className="h-12 w-12 text-primary" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Venta Local (Subtotal)</p>
                            <p className="text-3xl font-black tracking-tighter italic text-black">${(order.subtotal || order.itemsTotal || 0).toLocaleString()}</p>
                        </div>
                        <div className="relative z-10 text-right">
                             <Clock className="h-4 w-4 text-black/40 ml-auto mb-1" />
                             <p className="text-[9px] font-bold text-black/40 uppercase">Listo para preparar</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 pt-0 grid grid-cols-2 gap-4">
                    <Button 
                        variant="ghost" 
                        onClick={() => onReject(order)}
                        className="h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-500 border border-red-100 transition-all"
                    >
                        <X className="mr-2 h-4 w-4" /> Rechazar
                    </Button>
                    <Button 
                        onClick={() => onAccept(order)}
                        className="h-16 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        ACEPTAR <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
