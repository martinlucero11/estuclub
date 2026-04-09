'use server';

import { adminDb } from '@/lib/firebase-admin';
import { RiderApplicationSchema, SupplierRequestSchema } from '../validations/schemas';
import { z } from 'zod';

function formatZodError(error: z.ZodError) {
    return error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}

/**
 * Atomics Role Synchronization.
 * This bypasses Client-Side Firestore Rules and ensures SSoT.
 */
export async function syncUserRole(uid: string, newRole: string) {
    if (!adminDb) return { success: false, error: 'Firebase Admin not initialized' };

    try {
        return await adminDb.runTransaction(async (transaction) => {
            const userRef = adminDb!.collection('users').doc(uid);
            const adminRoleRef = adminDb!.collection('roles_admin').doc(uid);
            const supplierRoleRef = adminDb!.collection('roles_supplier').doc(uid);
            const riderRoleRef = adminDb!.collection('roles_rider').doc(uid);

            // 1. Update main user document
            transaction.update(userRef, { role: newRole });

            // 2. Clean up old roles and set new one
            transaction.delete(adminRoleRef);
            transaction.delete(supplierRoleRef);
            transaction.delete(riderRoleRef);

            // 3. Add to the new role collection if applicable
            if (newRole === 'admin') {
                transaction.set(adminRoleRef, { createdAt: new Date().toISOString(), updatedBy: 'system_admin' });
            } else if (newRole === 'supplier' || newRole === 'cluber') {
                transaction.set(supplierRoleRef, { createdAt: new Date().toISOString(), updatedBy: 'system_admin' });
            } else if (newRole === 'rider') {
                transaction.set(riderRoleRef, { createdAt: new Date().toISOString(), updatedBy: 'system_admin' });
            }

            return { success: true, role: newRole };
        });
    } catch (e: any) {
        return { success: false, error: e.message || 'Error al sincronizar roles' };
    }
}

/**
 * Specialized action to approve a Rider Request
 */
export async function approveRiderOperation(requestId: string, appData: any) {
    if (!adminDb) return { success: false, error: 'Firebase Admin not initialized' };

    try {
        // 0. Validate Data
        const validatedData = RiderApplicationSchema.partial().parse(appData);
        const { userId, email, userName, phone } = validatedData;
        
        if (!userId || !email || !userName) throw new Error("Datos de Rider incompletos para aprobación.");
        
        const patente = validatedData.patente;
        const vehicleType = validatedData.vehicleType;

        return await adminDb.runTransaction(async (transaction) => {
            const userRef = adminDb!.collection('users').doc(userId);
            const riderRoleRef = adminDb!.collection('roles_rider').doc(userId);
            const requestRef = adminDb!.collection('rider_applications').doc(requestId);

            // 1. Sync User Profile
            transaction.set(userRef, {
                uid: userId,
                email: email,
                firstName: userName.split(' ')[0],
                lastName: userName.split(' ').slice(1).join(' ') || 'Sin_Apellido',
                phone: phone,
                role: 'rider',
                isVerified: true,
                approvedAt: new Date().toISOString(),
                isOnline: false,
                patente,
                vehicleType
            }, { merge: true });

            // 2. Create Rider Role
            transaction.set(riderRoleRef, {
                active: true,
                userId,
                userName,
                email,
                patente,
                vehicleType,
                assignedAt: new Date().toISOString(),
            }, { merge: true });

            // 3. Mark request as approved
            transaction.update(requestRef, {
                status: 'approved',
                approvedAt: new Date().toISOString(),
            });

            return { success: true };
        });
    } catch (e: any) {
        if (e instanceof z.ZodError) return { success: false, error: formatZodError(e) };
        return { success: false, error: e.message || 'Error al aprobar Rider' };
    }
}

/**
 * Specialized action to approve a Supplier Request
 */
export async function approveSupplierOperation(requestId: string, reqData: any) {
    if (!adminDb) return { success: false, error: 'Firebase Admin not initialized' };

    try {
        // 0. Validate Data
        const validatedData = SupplierRequestSchema.parse(reqData);
        const { userId, supplierName, category, address, commercialPhone, logo, fachada } = validatedData;

        return await adminDb.runTransaction(async (transaction) => {
            const userRef = adminDb!.collection('users').doc(userId);
            const supplierRoleRef = adminDb!.collection('roles_supplier').doc(userId);
            const requestRef = adminDb!.collection('supplier_requests').doc(requestId);

            // 1. Create Supplier Role
            transaction.set(supplierRoleRef, {
                id: userId,
                name: supplierName,
                type: category,
                address: address,
                whatsapp: commercialPhone,
                logoUrl: logo || '',
                coverUrl: fachada || '',
                verified: true,
                verifiedAt: new Date().toISOString(),
                isVisible: true,
                slug: supplierName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-'),
                createdAt: new Date().toISOString(),
                storeName: supplierName,
            }, { merge: true });

            // 2. Update User Profile Role
            transaction.set(userRef, {
                role: 'supplier',
                isVerified: true,
                displayName: supplierName,
                storeName: supplierName,
                phone: commercialPhone,
                logo: logo || '',
                address: address || '',
            }, { merge: true });

            // 3. Mark request as approved
            transaction.update(requestRef, {
                status: 'approved',
                approvedAt: new Date().toISOString(),
            });

            return { success: true };
        });
    } catch (e: any) {
        if (e instanceof z.ZodError) return { success: false, error: formatZodError(e) };
        return { success: false, error: e.message || 'Error al aprobar Cluber' };
    }
}

/**
 * Specialized action to reject a Rider Request
 */
export async function rejectRiderOperation(requestId: string, userId: string) {
    if (!adminDb) return { success: false, error: 'Firebase Admin not initialized' };

    try {
        return await adminDb.runTransaction(async (transaction) => {
            const requestRef = adminDb!.collection('rider_applications').doc(requestId);
            const userRef = adminDb!.collection('users').doc(userId);

            transaction.update(requestRef, {
                status: 'rejected',
                rejectedAt: new Date().toISOString(),
            });

            transaction.update(userRef, {
                role: 'rider_rejected',
            });

            return { success: true };
        });
    } catch (e: any) {
        return { success: false, error: e.message || 'Error al rechazar Rider' };
    }
}
