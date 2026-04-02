'use client';
export const dynamic = 'force-dynamic';

import { useUser } from "@/firebase";
import { ProductManager } from "@/components/delivery/product-manager";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

export default function CluberProductsPage() {
    const { userData, roles, isAdmin } = useUser();
    const shopId = userData?.uid;

    if (!roles.includes('supplier') && !isAdmin) return <p className="p-20 text-center font-black uppercase text-primary">Acceso Denegado</p>;

    return (
        <div className="container max-w-7xl py-12 px-6 space-y-10">
            <header className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-[#d93b64]/10 flex items-center justify-center border border-[#d93b64]/20">
                    <Package className="h-8 w-8 text-[#d93b64]" />
                </div>
                <div>
                    <h1 className="text-4xl font-black font-montserrat uppercase italic tracking-tighter">Gestión de <span className="text-primary">Productos</span></h1>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Administrá tu catálogo de delivery</p>
                </div>
            </header>

            <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white p-6 md:p-10">
                <CardContent className="p-0">
                    <ProductManager supplierId={shopId || ''} />
                </CardContent>
            </Card>
        </div>
    );
}

