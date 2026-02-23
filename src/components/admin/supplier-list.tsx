
'use client';

import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Briefcase, Building, Church, Scale, ShoppingBasket, User, CalendarCheck, Gift, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';
import type { SupplierProfile } from '@/types/data';
import { useMemo } from 'react';

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
          <div className="flex flex-col space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SupplierList() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const suppliersQuery = useMemo(
        () => query(collection(firestore, 'roles_supplier'), orderBy('name')),
        [firestore]
    );

    const { data: suppliers, isLoading, error } = useCollection<SupplierProfile>(suppliersQuery);

    const handlePermissionToggle = async (supplierId: string, field: keyof SupplierProfile, currentStatus: boolean, successMessage: string) => {
        const supplierRef = doc(firestore, 'roles_supplier', supplierId);
        try {
            await updateDoc(supplierRef, { [field]: !currentStatus });
            toast({
                title: 'Permiso actualizado',
                description: successMessage,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo actualizar el permiso.',
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
        <div className="space-y-3">
            {suppliers.map(supplier => {
                const TypeIcon = typeIcons[supplier.type as keyof typeof typeIcons] || User;
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
                        <div className="flex flex-col space-y-2 items-end">
                            <div className="flex items-center space-x-2">
                                <Label htmlFor={`appointments-switch-${supplier.id}`} className="flex items-center text-xs text-muted-foreground gap-1">
                                    <CalendarCheck className="h-4 w-4"/>
                                    Turnos
                                </Label>
                                <Switch
                                    id={`appointments-switch-${supplier.id}`}
                                    checked={!!supplier.canCreateAppointments}
                                    onCheckedChange={(checked) => handlePermissionToggle(supplier.id, 'canCreateAppointments', !checked, `El proveedor ahora ${checked ? 'acepta' : 'no acepta'} turnos.`)}
                                />
                            </div>
                             <div className="flex items-center space-x-2">
                                <Label htmlFor={`perks-switch-${supplier.id}`} className="flex items-center text-xs text-muted-foreground gap-1">
                                    <Gift className="h-4 w-4"/>
                                    Beneficios
                                </Label>
                                <Switch
                                    id={`perks-switch-${supplier.id}`}
                                    checked={!!supplier.canCreatePerks}
                                    onCheckedChange={(checked) => handlePermissionToggle(supplier.id, 'canCreatePerks', !checked, `El proveedor ahora ${checked ? 'puede' : 'no puede'} crear beneficios.`)}
                                />
                            </div>
                             <div className="flex items-center space-x-2">
                                <Label htmlFor={`announcements-switch-${supplier.id}`} className="flex items-center text-xs text-muted-foreground gap-1">
                                    <Megaphone className="h-4 w-4"/>
                                    Anuncios
                                </Label>
                                <Switch
                                    id={`announcements-switch-${supplier.id}`}
                                    checked={!!supplier.canCreateAnnouncements}
                                    onCheckedChange={(checked) => handlePermissionToggle(supplier.id, 'canCreateAnnouncements', !checked, `El proveedor ahora ${checked ? 'puede' : 'no puede'} crear anuncios.`)}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
