'use server';

import { adminDb, adminAuth, adminMessaging } from '@/lib/firebase-admin';
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
export async function acceptDeliveryOrder(orderId: string, idToken: string) {
    if (!adminDb || !adminAuth) throw new Error('Firebase Admin not initialized');

    let callerUid: string;
    try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        callerUid = decoded.uid;
    } catch (e) {
        throw new Error('Unauthorized or invalid token');
    }

    const orderRef = adminDb.collection('orders').doc(orderId);

    try {
        const result = await adminDb.runTransaction(async (transaction) => {
            const orderDoc = await transaction.get(orderRef);

            if (!orderDoc.exists) {
                throw new Error('El pedido no existe.');
            }

            const data = orderDoc.data();
            
            // Critical Check: Ensure status is 'pending', 'waiting_rider', or 'searching_rider' and no rider is assigned
            if (data?.status !== 'pending' && data?.status !== 'waiting_rider' && data?.status !== 'searching_rider') {
                throw new Error('Este pedido ya fue tomado por otro repartidor o cambió de estado.');
            }

            if (data?.riderId) {
                throw new Error('Este pedido ya tiene un repartidor asignado.');
            }

            // Atomics Update
            transaction.update(orderRef, {
                riderId: callerUid,
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
 * Atomic Order Completion with PIN Verification.
 * Ensures the Rider can only complete the order if the PIN matches.
 */
export async function completeDeliveryAtomic(orderId: string, enteredPin: string, proofUrl: string | null, idToken: string) {
    if (!adminDb || !adminAuth) throw new Error('Firebase Admin not initialized');

    let callerUid: string;
    try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        callerUid = decoded.uid;
    } catch (e) {
        throw new Error('Unauthorized or invalid token');
    }

    const orderRef = adminDb.collection('orders').doc(orderId);

    try {
        const result = await adminDb.runTransaction(async (transaction) => {
            const orderDoc = await transaction.get(orderRef);

            if (!orderDoc.exists) {
                throw new Error('El pedido no existe.');
            }

            const data = orderDoc.data();

            if (data?.riderId !== callerUid) {
                throw new Error('No tienes permiso para finalizar este pedido.');
            }

            if (data?.status === 'completed' || data?.status === 'delivered') {
                throw new Error('El pedido ya fue finalizado.');
            }

            if (data?.deliveryPin && data.deliveryPin !== enteredPin) {
                throw new Error('El PIN ingresado es incorrecto.');
            }

            // Atomics Update
            transaction.update(orderRef, {
                status: 'completed',
                deliveryPinValidated: true,
                proofOfDeliveryUrl: proofUrl || null,
                completedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            return { success: true, orderId };
        });

        return result;
    } catch (error: any) {
        console.error('CONCURRENCY_ERROR_COMPLETE_ORDER:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Update Order Status (System/Admin/Rider context)
 */
export async function updateOrderOperationStatus(orderId: string, newStatus: string, idToken: string) {
    if (!adminDb || !adminAuth) return { success: false, error: 'Firebase Admin not initialized' };

    try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        const callerUid = decoded.uid;

        const orderRef = adminDb.collection('orders').doc(orderId);
        
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            throw new Error('El pedido no existe.');
        }
        const order = orderSnap.data();

        if (order?.supplierId !== callerUid && order?.riderId !== callerUid) {
            throw new Error('Unauthorized: No tienes permiso para actualizar este pedido.');
        }
        
        // 0. Validate Status
        const statusSchema = OrderSchema.shape.status;
        const validatedStatus = statusSchema.parse(newStatus);

        await orderRef.update({
            status: validatedStatus,
            updatedAt: new Date().toISOString()
        });

        // Fire push notification to customer on rejection
        if (validatedStatus === 'rejected' && order?.customerId && adminMessaging) {
            try {
                const tokenDoc = await adminDb.collection('userTokens').doc(order.customerId).get();
                const tokens = tokenDoc.data()?.tokens || [];
                if (tokens.length > 0) {
                    await adminMessaging.sendEachForMulticast({
                        tokens,
                        notification: {
                            title: '❌ Pedido rechazado',
                            body: `${order.supplierName || 'El comercio'} no pudo aceptar tu pedido. Podés hacer uno nuevo.`
                        },
                        data: { url: '/orders', orderId }
                    });
                }
            } catch (notifError) {
                console.error('REJECTED_NOTIFICATION_ERROR:', notifError);
                // Don't fail the whole operation for a notification error
            }
        }

        return { success: true };
    } catch (e: any) {
        if (e instanceof z.ZodError) return { success: false, error: formatZodError(e) };
        return { success: false, error: e.message || 'Error al actualizar pedido' };
    }
}
