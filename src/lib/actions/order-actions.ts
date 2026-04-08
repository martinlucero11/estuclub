'use server';

import { adminDb } from '@/lib/firebase-admin';
import { OrderSchema } from '../validations/schemas';
import { z } from 'zod';

function formatZodError(error: z.ZodError) {
    return error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}

/**
 * Atomic Order Acceptance for Riders.
 * Prevents race conditions where two riders accept the same order.
 * This is handled on the server via transactions for absolute safety.
 */
export async function acceptDeliveryOrder(orderId: string, riderUid: string) {
    if (!adminDb) throw new Error('Firebase Admin not initialized');

    const orderRef = adminDb.collection('orders').doc(orderId);

    try {
        const result = await adminDb.runTransaction(async (transaction) => {
            const orderDoc = await transaction.get(orderRef);

            if (!orderDoc.exists) {
                throw new Error('El pedido no existe.');
            }

            const data = orderDoc.data();
            
            // Critical Check: Ensure status is 'pending' and no rider is assigned
            if (data?.status !== 'pending' && data?.status !== 'waiting_rider') {
                throw new Error('Este pedido ya fue tomado por otro repartidor o cambió de estado.');
            }

            if (data?.riderId) {
                throw new Error('Este pedido ya tiene un repartidor asignado.');
            }

            // Atomics Update
            transaction.update(orderRef, {
                riderId: riderUid,
                status: 'assigned',
                acceptedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            return { success: true, orderId };
        });

        return result;
    } catch (error: any) {
        console.error('CONCURRENCY_ERROR_ACCEPT_ORDER:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Update Order Status (System/Admin/Rider context)
 */
export async function updateOrderOperationStatus(orderId: string, newStatus: string) {
    if (!adminDb) return { success: false, error: 'Firebase Admin not initialized' };

    try {
        const orderRef = adminDb.collection('orders').doc(orderId);
        
        // 0. Validate Status
        const statusSchema = OrderSchema.shape.status;
        const validatedStatus = statusSchema.parse(newStatus);

        await orderRef.update({
            status: validatedStatus,
            updatedAt: new Date().toISOString()
        });

        return { success: true };
    } catch (e: any) {
        if (e instanceof z.ZodError) return { success: false, error: formatZodError(e) };
        return { success: false, error: e.message || 'Error al actualizar pedido' };
    }
}
