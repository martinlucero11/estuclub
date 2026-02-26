'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import type { SupplierProfile } from '@/types/data';
import { DataTable } from '@/components/ui/data-table';
import { columns as createColumns, UserForList } from './user-management-columns';
import { SupplierEditDialog } from './supplier-edit-dialog';

export function UserManagementTable() {
    const firestore = useFirestore();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserForList | null>(null);
    const [selectedSupplierProfile, setSelectedSupplierProfile] = useState<SupplierProfile | null>(null);

    const usersQuery = useMemo(() => query(collection(firestore, 'users').withConverter(createConverter<UserForList>()), orderBy('createdAt', 'desc')), [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

    const suppliersQuery = useMemo(() => query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>())), [firestore]);
    const { data: suppliers, isLoading: suppliersLoading } = useCollection(suppliersQuery);

    const isLoading = usersLoading || suppliersLoading;

    const suppliersMap = useMemo(() => {
        const map = new Map<string, SupplierProfile>();
        suppliers?.forEach(s => map.set(s.id, s));
        return map;
    }, [suppliers]);

    const handleEdit = (user: UserForList, supplierProfile: SupplierProfile | null) => {
        setSelectedUser(user);
        setSelectedSupplierProfile(supplierProfile);
        setIsDialogOpen(true);
    };

    const columns = useMemo(() => createColumns({ suppliersMap, onEdit: handleEdit }), [suppliersMap]);

    return (
        <div>
            <DataTable
                columns={columns}
                data={users || []}
                isLoading={isLoading}
                filterColumn="email"
                filterPlaceholder="Buscar por email..."
            />
            {isDialogOpen && selectedUser && (
                <SupplierEditDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    user={selectedUser}
                    supplierProfile={selectedSupplierProfile}
                />
            )}
        </div>
    );
}
