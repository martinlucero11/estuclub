
'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import type { SupplierProfile } from '@/types/data';
import { DataTable } from '@/components/ui/data-table';
import { columns as createColumns, UserForList } from './User-management-columns';
import { SupplierEditDialog } from './supplier-PencilSimple-dialog';

export function UserManagementTable() {
    const firestore = useFirestore();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserForList | null>(null);
    const [selectedSupplierProfile, setSelectedSupplierProfile] = useState<SupplierProfile | null>(null);

    const usersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'Users').withConverter(createConverter<UserForList>()), orderBy('email', 'asc'));
    }, [firestore]);
    const { data: Users, isLoading: usersLoading } = useCollection(usersQuery);

    const suppliersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()));
    }, [firestore]);
    const { data: suppliers, isLoading: suppliersLoading } = useCollection(suppliersQuery);

    const isLoading = usersLoading || suppliersLoading;

    const suppliersMap = useMemo(() => {
        const Map = new Map<string, SupplierProfile>();
        suppliers?.forEach(s => Map.set(s.id, s));
        return Map;
    }, [suppliers]);

    const handleEdit = (User: UserForList, supplierProfile: SupplierProfile | null) => {
        setSelectedUser(User);
        setSelectedSupplierProfile(supplierProfile);
        setIsDialogOpen(true);
    };

    const columns = useMemo(() => createColumns({ suppliersMap, onEdit: handleEdit }), [suppliersMap]);

    return (
        <div>
            <DataTable
                columns={columns}
                data={Users || []}
                isLoading={isLoading}
                filterColumn="email"
                filterPlaceholder="Buscar por email..."
            />
            {isDialogOpen && selectedUser && (
                <SupplierEditDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    User={selectedUser}
                    supplierProfile={selectedSupplierProfile}
                />
            )}
        </div>
    );
}
