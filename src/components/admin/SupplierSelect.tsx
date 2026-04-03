'use client';

import React from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useAdmin } from '@/context/admin-context';
import { createConverter } from '@/lib/firestore-converter';
import { SupplierProfile } from '@/types/data';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Shield, Store, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SupplierSelect() {
    const firestore = useFirestore();
    const { impersonatedSupplierId, setImpersonatedSupplierId, isAdmin } = useAdmin();

    const suppliersQuery = React.useMemo(() => 
        query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()), orderBy('name')),
        [firestore]
    );

    const { data: suppliers, isLoading } = useCollection<SupplierProfile>(suppliersQuery);

    if (!isAdmin) return null;

    return (
        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="h-10 w-10 rounded-xl bg-[#cb465a]/10 flex items-center justify-center border border-[#cb465a]/20 shrink-0">
                <Shield className="h-5 w-5 text-[#cb465a]" />
            </div>
            
            <Select 
                value={impersonatedSupplierId || 'self'} 
                onValueChange={(val) => setImpersonatedSupplierId(val === 'self' ? null : val)}
            >
                <SelectTrigger className="h-10 w-[240px] rounded-xl border-white/10 glass glass-dark text-xs font-black uppercase tracking-widest">
                    <SelectValue placeholder="Imitar Comercio..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/5 glass glass-dark">
                    <SelectItem value="self" className="rounded-xl font-bold italic">
                        <div className="flex items-center gap-2">
                             <X className="h-4 w-4" /> Resetear (Mi Perfil)
                        </div>
                    </SelectItem>
                    {suppliers?.map(s => (
                        <SelectItem key={s.id} value={s.id} className="rounded-xl font-bold">
                            <div className="flex items-center gap-2">
                                <Store className="h-3 w-3 opacity-50" /> {s.name}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {impersonatedSupplierId && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setImpersonatedSupplierId(null)}
                    className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest text-[#cb465a] hover:bg-[#cb465a]/10 transition-colors"
                >
                    SALIR DE MODO DIOS
                </Button>
            )}
        </div>
    );
}

