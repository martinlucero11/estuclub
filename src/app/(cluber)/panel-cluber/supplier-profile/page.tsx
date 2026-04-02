export const dynamic = 'force-dynamic';


'use client';

import BackButton from '@/components/layout/back-button';
import EditSupplierProfileForm from '@/components/supplier/edit-supplier-profile-form';
import MPLinkCard from '@/components/payment/mp-link-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SupplierProfilePage() {
  return (
    <div className="space-y-12 max-w-4xl pt-6">
      <BackButton />
      
      <header className="space-y-2">
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none text-[#d93b64] italic font-montserrat">Configuración</h1>
        <p className="text-xs font-black uppercase tracking-[0.4em] opacity-40 ml-2">Tu Marca, Tus Reglas, Tu Dinero</p>
      </header>

      <div className="grid gap-10">
          {/* Payment Section (First) */}
          <MPLinkCard />

          <Card className="rounded-[3rem] border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
            <CardHeader className="p-8 md:p-12 pb-0">
                <CardTitle className="text-3xl font-black italic uppercase tracking-tight">Identidad Corporativa</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-[#d93b64] mt-2 opacity-60">Datos visibles para todos los estudiantes</CardDescription>
            </CardHeader>
            <CardContent className="p-8 md:p-12 pt-8">
                <EditSupplierProfileForm />
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
