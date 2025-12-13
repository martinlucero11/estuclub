'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Briefcase, Building, Church, Scale, ShoppingBasket, User } from 'lucide-react';

interface SupplierProfile {
    id: string;
    name: string;
    email: string;
    type: 'Institucion' | 'Club' | 'Iglesia' | 'Comercio' | 'Estado';
}

const typeIcons = {
    Institucion: Building,
    Club: Briefcase,
    Iglesia: Church,
    Comercio: ShoppingBasket,
    Estado: Scale,
};

function SupplierSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 rounded-md border p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SupplierList() {
    const firestore = useFirestore();

    const suppliersQuery = useMemoFirebase(
        () => query(collection(firestore, 'roles_supplier'), orderBy('name')),
        [firestore]
    );

    const { data: suppliers, isLoading, error } = useCollection<SupplierProfile>(suppliersQuery);

    if (isLoading) {
        return <SupplierSkeleton />;
    }

    if (error) {
        return <p className="text-destructive">Error al cargar los proveedores.</p>;
    }

    if (!suppliers || suppliers.length === 0) {
        return (
            <p className="text-center text-muted-foreground">
                No hay proveedores registrados.
            </p>
        );
    }
    
    return (
        <div className="space-y-2">
            {suppliers.map(supplier => {
                const TypeIcon = typeIcons[supplier.type] || User;
                const supplierInitial = supplier.name.charAt(0).toUpperCase();

                return (
                    <div key={supplier.id} className="flex items-center space-x-4 rounded-md border p-3">
                        <Avatar>
                            <AvatarFallback>
                                <TypeIcon className="h-5 w-5 text-muted-foreground" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-muted-foreground">{supplier.email}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
