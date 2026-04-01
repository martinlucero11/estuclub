'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { SupplierProfile } from '@/types/data';

interface AdminContextType {
    impersonatedSupplierId: string | null;
    impersonatedSupplierData: SupplierProfile | null;
    setImpersonatedSupplierId: (id: string | null) => void;
    isAdmin: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const { roles, userData } = useUser();
    const firestore = useFirestore();
    const [impersonatedSupplierId, setImpersonatedSupplierIdState] = useState<string | null>(null);
    const [impersonatedSupplierData, setImpersonatedSupplierData] = useState<SupplierProfile | null>(null);

    const isAdmin = roles.includes('admin');

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('estuclub_impersonation_id');
            if (saved && isAdmin) {
                setImpersonatedSupplierIdState(saved);
            }
        }
    }, [isAdmin]);

    // Persist to localStorage
    const setImpersonatedSupplierId = (id: string | null) => {
        setImpersonatedSupplierIdState(id);
        if (typeof window !== 'undefined') {
            if (id) {
                localStorage.setItem('estuclub_impersonation_id', id);
            } else {
                localStorage.removeItem('estuclub_impersonation_id');
            }
        }
    };

    // Fetch impersonated data when ID changes
    useEffect(() => {
        if (!impersonatedSupplierId || !isAdmin) {
            setImpersonatedSupplierData(null);
            return;
        }

        const fetchImpersonatedData = async () => {
            try {
                const docRef = doc(firestore, 'roles_supplier', impersonatedSupplierId);
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    setImpersonatedSupplierData({ id: snapshot.id, ...snapshot.data() } as SupplierProfile);
                } else {
                    console.warn('Impersonated supplier not found, clearing state');
                    setImpersonatedSupplierId(null);
                }
            } catch (error) {
                console.error('Error fetching impersonated supplier:', error);
            }
        };

        fetchImpersonatedData();
    }, [impersonatedSupplierId, isAdmin, firestore]);

    const value = useMemo(() => ({
        impersonatedSupplierId,
        impersonatedSupplierData,
        setImpersonatedSupplierId,
        isAdmin
    }), [impersonatedSupplierId, impersonatedSupplierData, isAdmin]);

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}
