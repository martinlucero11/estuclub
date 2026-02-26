'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import type { SupplierProfile } from '@/types/data';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { columns as createColumns, UserForList } from './user-management-columns';
import { SupplierEditDialog } from './supplier-edit-dialog';

export function UserManagementTable() {
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('');

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserForList | null>(null);
    const [selectedSupplierProfile, setSelectedSupplierProfile] = useState<SupplierProfile | null>(null);

    useEffect(() => {
        const handler = setTimeout(() => setFilter(searchTerm.trim()), 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const usersRef = useMemo(() => collection(firestore, 'users').withConverter(createConverter<UserForList>()), [firestore]);

    const recentUsersQuery = useMemo(() => !filter ? query(usersRef, orderBy('createdAt', 'desc'), limit(20)) : null, [usersRef, filter]);
    const usersByEmailQuery = useMemo(() => filter ? query(usersRef, where('email', '==', filter)) : null, [usersRef, filter]);
    const usersByUsernameQuery = useMemo(() => filter ? query(usersRef, where('username', '==', filter)) : null, [usersRef, filter]);
    
    const { data: recentUsers, isLoading: l1 } = useCollection(recentUsersQuery);
    const { data: usersByEmail, isLoading: l2 } = useCollection(usersByEmailQuery);
    const { data: usersByUsername, isLoading: l3 } = useCollection(usersByUsernameQuery);

    const suppliersQuery = useMemo(() => query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>())), [firestore]);
    const { data: suppliers, isLoading: l4 } = useCollection(suppliersQuery);

    const isLoading = l1 || l2 || l3 || l4;

    const users = useMemo(() => {
        if (!filter) return recentUsers || [];
        const allUsers = [...(usersByEmail || []), ...(usersByUsername || [])];
        const uniqueUsers = Array.from(new Map(allUsers.map(user => [user.id, user])).values());
        return uniqueUsers;
    }, [filter, recentUsers, usersByEmail, usersByUsername]);

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
            <div className="flex items-center py-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por email o username..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>
            <DataTable
                columns={columns}
                data={users}
                isLoading={isLoading}
                filterColumn="email"
                filterPlaceholder="Buscar..."
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
