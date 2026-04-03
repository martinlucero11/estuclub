'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { SupplierProfile, UserProfile } from '@/types/data';

interface AdminContextType {
    impersonatedSupplierId: string | null;
    impersonatedSupplierData: SupplierProfile | null;
    impersonatedUserId: string | null;
    impersonatedUserData: UserProfile | null;
    impersonatedRoles: string[];
    setImpersonatedSupplierId: (id: string | null) => void;
    setImpersonatedUserId: (id: string | null) => void;
    isAdmin: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const { roles, firestore } = useFirebase();
    
    const [impersonatedSupplierId, setImpersonatedSupplierIdState] = useState<string | null>(null);
    const [impersonatedSupplierData, setImpersonatedSupplierData] = useState<SupplierProfile | null>(null);
    const [impersonatedUserId, setImpersonatedUserIdState] = useState<string | null>(null);
    const [impersonatedUserData, setImpersonatedUserData] = useState<UserProfile | null>(null);
    const [impersonatedRoles, setImpersonatedRoles] = useState<string[]>([]);

    const isAdmin = roles.includes('admin');

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedSupplier = localStorage.getItem('estuclub_impersonation_id');
            const savedUser = localStorage.getItem('estuclub_impersonation_user_id');
            if (isAdmin) {
                if (savedSupplier) setImpersonatedSupplierIdState(savedSupplier);
                if (savedUser) setImpersonatedUserIdState(savedUser);
            }
        }
    }, [isAdmin]);

    // Redirección a Home al simular
    const setImpersonatedUserId = (id: string | null) => {
        setImpersonatedUserIdState(id);
        if (typeof window !== 'undefined') {
            if (id) {
                localStorage.setItem('estuclub_impersonation_user_id', id);
                window.location.href = '/';
            } else {
                localStorage.removeItem('estuclub_impersonation_user_id');
            }
        }
    };

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

    // Fetch impersonated supplier data
    useEffect(() => {
        if (!impersonatedSupplierId || !isAdmin || !firestore) {
            setImpersonatedSupplierData(null);
            return;
        }

        const fetchImpersonatedSupplier = async () => {
            try {
                const docRef = doc(firestore, 'roles_supplier', impersonatedSupplierId);
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    setImpersonatedSupplierData({ id: snapshot.id, ...snapshot.data() } as SupplierProfile);
                }
            } catch (error) {
                console.error('Error fetching impersonated supplier:', error);
            }
        };

        fetchImpersonatedSupplier();
    }, [impersonatedSupplierId, isAdmin, firestore]);

    // Fetch impersonated user data and roles
    useEffect(() => {
        if (!impersonatedUserId || !isAdmin || !firestore) {
            setImpersonatedUserData(null);
            setImpersonatedRoles([]);
            return;
        }

        const fetchImpersonatedUser = async () => {
            try {
                const [uDoc, sDoc, rDoc] = await Promise.all([
                    getDoc(doc(firestore, 'users', impersonatedUserId)),
                    getDoc(doc(firestore, 'roles_supplier', impersonatedUserId)),
                    getDoc(doc(firestore, 'roles_rider', impersonatedUserId))
                ]);

                const resRoles = ['user'];
                if (sDoc.exists()) resRoles.push('supplier');
                if (rDoc.exists()) resRoles.push('rider');

                setImpersonatedRoles(resRoles);
                setImpersonatedUserData(uDoc.exists() ? (uDoc.data() as UserProfile) : null);
            } catch (error) {
                console.error('Error fetching impersonated user:', error);
            }
        };

        fetchImpersonatedUser();
    }, [impersonatedUserId, isAdmin, firestore]);

    const value = useMemo(() => ({
        impersonatedSupplierId,
        impersonatedSupplierData,
        impersonatedUserId,
        impersonatedUserData,
        impersonatedRoles,
        setImpersonatedSupplierId,
        setImpersonatedUserId,
        isAdmin
    }), [impersonatedSupplierId, impersonatedSupplierData, impersonatedUserId, impersonatedUserData, impersonatedRoles, isAdmin]);

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

