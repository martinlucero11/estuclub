
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Briefcase, Building, Church, Scale, ShoppingBasket, User, CalendarCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';

interface SupplierProfile {
    id: string;
    name: string;
    email: string;
    type: 'Institucion' | 'Club' | 'Iglesia' | 'Comercio' | 'Estado';
    slug: string;
    logoUrl?: string;
    allowsBooking?: boolean;
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
    const { toast } = useToast();

    const suppliersQuery = useMemoFirebase(
        () => query(collection(firestore, 'roles_supplier'), orderBy('name')),
        [firestore]
    );

    const { data: suppliers, isLoading, error } = useCollection<SupplierProfile>(suppliersQuery);

    const handleBookingToggle = async (supplierId: string, currentStatus: boolean) => {
        const supplierRef = doc(firestore, 'roles_supplier', supplierId);
        try {
            await updateDoc(supplierRef, { allowsBooking: !currentStatus });
            toast({
                title: 'Estado de reserva actualizado',
                description: `El proveedor ahora ${!currentStatus ? 'acepta' : 'no acepta'} reservas.`,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo actualizar el estado de la reserva.',
            });
        }
    };


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
                            <AvatarImage src={supplier.logoUrl} alt={supplier.name} />
                            <AvatarFallback>
                                <TypeIcon className="h-5 w-5 text-muted-foreground" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <Button variant="link" asChild className="p-0 h-auto">
                                <Link href={`/proveedores/${supplier.slug}`}>
                                    <p className="font-semibold text-base">{supplier.name}</p>
                                </Link>
                            </Button>
                            <p className="text-sm text-muted-foreground">{supplier.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Label htmlFor={`booking-switch-${supplier.id}`} className="flex flex-col items-center text-xs text-muted-foreground">
                                <CalendarCheck className="h-4 w-4 mb-1"/>
                                Habilitar Turnos
                            </Label>
                            <Switch
                                id={`booking-switch-${supplier.id}`}
                                checked={supplier.allowsBooking}
                                onCheckedChange={(checked) => handleBookingToggle(supplier.id, !checked)}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
