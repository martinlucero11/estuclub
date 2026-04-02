'use client';

import React from 'react';
import { useOrders } from '@/hooks/use-orders';
import { Order } from '@/types/data';
import { useFirestore } from '@/firebase';
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

interface OrderManagementProps {
    supplierId: string;
}

const statusConfig = {
    pending: { label: 'Pendiente', color: 'bg-amber-500/10 text-amber-500', icon: Clock },
    accepted: { label: 'Aceptado', color: 'bg-blue-500/10 text-blue-500', icon: CheckCircle2 },
    shipped: { label: 'En camino', color: 'bg-purple-500/10 text-purple-500', icon: Truck },
    completed: { label: 'Entregado', color: 'bg-green-500/10 text-green-500', icon: CheckCircle },
    cancelled: { label: 'Cancelado', color: 'bg-red-500/10 text-red-500', icon: XCircle },
};

export function OrderManagement({ supplierId }: OrderManagementProps) {
    const { data: orders, isLoading } = useOrders('supplier', supplierId);
    const firestore = useFirestore();
    const { toast } = useToast();

    const updateStatus = async (orderId: string, newStatus: Order['status']) => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'orders', orderId), {
                status: newStatus,
                updatedAt: new Date()
            });
            toast({ title: `Pedido ${statusConfig[newStatus].label}` });
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
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                <Package className="h-16 w-16 mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold">No hay pedidos registrados</h3>
                <p className="text-sm text-muted-foreground">Los pedidos de tus clientes aparecerán aquí.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
            {orders.map((order) => (
                <OrderCard 
                    key={order.id} 
                    order={order} 
                    onUpdateStatus={updateStatus} 
                />
            ))}
        </div>
    );
}

const OrderCard = React.memo(({ order, onUpdateStatus }: { 
    order: Order, 
    onUpdateStatus: (id: string, status: Order['status']) => void 
}) => {
    const StatusIcon = statusConfig[order.status].icon;
    
    return (
        <Card className="overflow-hidden border-border/50 shadow-lg hover:border-primary/20 transition-all duration-300">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/30">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge className={cn("rounded-full px-2 py-0 text-[10px] uppercase font-black", statusConfig[order.status].color)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[order.status].label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" /> {order.userName}
                        </CardTitle>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1 font-bold">
                                Estado <ChevronDown className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onUpdateStatus(order.id, 'accepted')}>Aceptar Pedido</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateStatus(order.id, 'shipped')}>Marcar en Camino</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateStatus(order.id, 'completed')} className="text-green-600">Completar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateStatus(order.id, 'cancelled')} className="text-red-600">Cancelar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
                {/* Order Items */}
                <div className="space-y-2">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="font-medium">
                                <span className="text-primary font-bold">{item.quantity}x</span> {item.name}
                            </span>
                            <span className="text-muted-foreground">$ {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    ))}
                    <div className="pt-2 border-t border-dashed flex justify-between items-center font-black text-lg">
                        <span>Total</span>
                        <span className="text-primary">$ {order.totalAmount.toLocaleString()}</span>
                    </div>
                </div>

                {/* Delivery Info */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold leading-tight">{order.type === 'delivery' ? 'Entrega a domicilio' : 'Retiro en local'}</p>
                            <p className="text-muted-foreground text-xs">{order.deliveryAddress || 'Retiro presencial'}</p>
                        </div>
                    </div>
                    
                    {order.deliveryNote && (
                        <div className="flex items-start gap-3 px-3 text-xs text-muted-foreground italic">
                            <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />
                            <p>"{order.deliveryNote}"</p>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="bg-muted/30 border-t border-border/50 gap-2">
                <Button 
                    variant="outline" 
                    className="flex-1 gap-2 font-bold" 
                    onClick={() => {
                        const text = encodeURIComponent(`Hola ${order.userName}, te contacto desde ${order.supplierName} por tu pedido #${order.id.slice(-6).toUpperCase()} en EstuClub.`);
                        window.open(`https://wa.me/${order.userPhone}?text=${text}`, '_blank');
                    }}
                >
                    <MessageSquare className="h-4 w-4" /> WhatsApp
                </Button>
            </CardFooter>
        </Card>
    );
});

OrderCard.displayName = 'OrderCard';
