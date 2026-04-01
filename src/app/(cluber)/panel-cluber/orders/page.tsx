'use client';

import React from 'react';
import OrdersDashboard from '@/components/supplier/orders-dashboard';
import { Package } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useAdmin } from '@/context/admin-context';

export default function MerchantOrdersPage() {
    const { supplierData, roles } = useUser();
    const { impersonatedSupplierId } = useAdmin();
    
    // If admin is impersonating, use that ID. Otherwise use the logged in supplier ID.
    const effectiveSupplierId = (roles.includes('admin') && impersonatedSupplierId) ? impersonatedSupplierId : supplierData?.id;

    return (
        <div className="space-y-12">
            <header className="space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-2xl border border-primary/20">
                    <Package className="h-5 w-5 text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-primary">Gestión de Pedidos</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
                    Control de <span className="text-primary">Delivery</span>
                </h1>
                <p className="text-lg text-muted-foreground font-medium max-w-2xl leading-relaxed italic opacity-80">
                    Administra tus pedidos entrantes, actualiza estados y sigue tus ventas diarias.
                </p>
            </header>

            <OrdersDashboard supplierId={effectiveSupplierId || ''} />
        </div>
    );
}
