'use client';

import React from 'react';
import { useOrders } from '@/hooks/use-orders';
import { useNewOrderAlarm } from '@/hooks/use-new-order-alarm';
import { Order } from '@/types/data';
import { auth, useFirestore } from '@/firebase';
import { updateOrderOperationStatus } from '@/lib/actions/order-actions';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Clock, 
    CheckCircle2, 
    Truck, 
    CheckCircle, 
    XCircle, 
    MessageSquare,
    MapPin,
    User,
    ChevronDown,
    Package
} from 'lucide-react';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { NewOrderAlarmModal } from './new-order-alarm-modal';

interface OrderManagementProps {
    supplierId: string;
}

const statusConfig = {
    pending: { label: 'Pendiente', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: Clock },
    accepted: { label: 'Preparando', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: CheckCircle2 },
    shipped: { label: 'En camino', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: Truck },
    completed: { label: 'Entregado', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle },
    cancelled: { label: 'Cancelado', color: 'bg-red-50 text-red-600 border-red-200', icon: XCircle },
};

export function OrderManagement({ supplierId }: OrderManagementProps) {
    const { data: orders, isLoading } = useOrders('supplier', supplierId);
    const { newOrder, clearOrder } = useNewOrderAlarm(supplierId);
    const firestore = useFirestore();
    const { toast } = useToast();

    const updateStatus = async (orderId: string, newStatus: Order['status']) => {
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                toast({ title: "Sesión expirada. Por favor, recarga la página.", variant: "destructive" });
                return;
            }

            const res = await updateOrderOperationStatus(orderId, newStatus, token);
            if (res.success) {
                toast({ title: `Pedido ${statusConfig[newStatus].label}` });
            } else {
                throw new Error(res.error);
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error al actualizar estado", variant: "destructive" });
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-black/[0.02] border-2 border-dashed border-black/5 rounded-[3rem] shadow-inner">
                <Package className="h-16 w-16 mb-6 text-black/10" />
                <h3 className="text-xl font-black tracking-tighter italic">Sin pedidos activos</h3>
                <p className="text-sm text-black/40 font-bold max-w-xs mx-auto">Cuando un cliente realice una compra aparecerá aquí mismo en tiempo real.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                {orders.map((order) => (
                    <OrderCard 
                        key={order.id} 
                        order={order} 
                        onUpdateStatus={updateStatus} 
                    />
                ))}
            </div>
            <NewOrderAlarmModal order={newOrder} onClose={clearOrder} />
        </>
    );
}

const OrderCard = React.memo(({ order, onUpdateStatus }: { 
    order: Order, 
    onUpdateStatus: (id: string, status: Order['status']) => void 
}) => {
    const StatusIcon = statusConfig[order.status].icon;
    
    return (
        <Card className="overflow-hidden border-black/5 bg-white shadow-xl rounded-[2.5rem] transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
            <CardHeader className="pb-4 border-b border-black/5 bg-black/[0.01]">
                <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <Badge className={cn("rounded-full px-2.5 py-0.5 text-[9px] uppercase font-black border tracking-wider", statusConfig[order.status].color)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[order.status].label}
                            </Badge>
                            <span className="text-[10px] text-black/30 font-mono font-bold tracking-tighter">#{order.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <CardTitle className="text-xl font-black tracking-tighter text-black flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" /> {order.customerName}
                        </CardTitle>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-1.5 font-black uppercase text-[10px] tracking-widest rounded-xl border-black/10 hover:bg-black/5">
                                Cambiar Estado <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl border-black/5 bg-white shadow-2xl p-2 w-48">
                            <DropdownMenuItem className="rounded-xl font-bold py-2.5 cursor-pointer" onClick={() => onUpdateStatus(order.id, 'accepted')}>🚀 Preparar Pedido</DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl font-bold py-2.5 cursor-pointer" onClick={() => onUpdateStatus(order.id, 'shipped')}>🛵 En Camino</DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl font-bold py-2.5 cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50" onClick={() => onUpdateStatus(order.id, 'completed' as any)}>✅ Completar</DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl font-bold py-2.5 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => onUpdateStatus(order.id, 'cancelled')}>❌ Cancelar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
                {/* Order Items */}
                <div className="space-y-2">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-black/60 font-bold">
                                    <span className="text-primary font-black mr-2 bg-primary/5 px-1.5 py-0.5 rounded-md">{item.quantity}x</span> {item.name}
                                </span>
                                <span className="text-black font-black">$ {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    ))}
                    <div className="pt-4 border-t border-black/5 flex justify-between items-center font-black text-2xl tracking-tighter">
                        <span className="text-black/40 text-xs uppercase tracking-widest italic pt-1">Monto Total</span>
                        <span className="text-black italic">{order.total ? `$ ${order.total.toLocaleString()}` : `$ ${(order as any).totalAmount?.toLocaleString() || '0'}`}</span>
                    </div>
                </div>

                {/* Delivery Info */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-black/[0.02] border border-black/5 text-sm shadow-inner group">
                        <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5 transition-transform group-hover:scale-125" />
                        <div>
                            <p className="font-black text-[10px] uppercase tracking-widest text-black/40 mb-1">{order.type === 'delivery' ? 'Entrega a domicilio' : 'Retiro en local'}</p>
                            <p className="text-black font-bold leading-tight">{order.deliveryAddress || 'Retiro presencial'}</p>
                        </div>
                    </div>
                    
                    {order.deliveryNotes && (
                        <div className="flex items-start gap-3 px-4 py-3 text-xs text-black/60 italic bg-amber-50/50 rounded-xl border border-amber-100/50">
                            <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
                            <p>"{order.deliveryNotes}"</p>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="bg-black/[0.01] border-t border-black/5 p-4">
                <Button 
                    variant="outline" 
                    className="w-full h-12 gap-2 font-black uppercase text-[10px] tracking-widest border-black/10 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-md active:scale-95" 
                    onClick={() => {
                        const text = encodeURIComponent(`Hola ${order.customerName}, te contacto desde ${order.supplierName} por tu pedido #${order.id.slice(-6).toUpperCase()} en Estuclub.`);
                        window.open(`https://wa.me/${order.customerPhone}?text=${text}`, '_blank');
                    }}
                >
                    <MessageSquare className="h-4 w-4" /> Whatsapp del Cliente
                </Button>
            </CardFooter>
        </Card>
    );
});

OrderCard.displayName = 'OrderCard';

