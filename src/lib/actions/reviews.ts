'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

interface ReviewInput {
    orderId: string;
    supplierId: string;
    riderId: string;
    userId: string;
    localRating: number;
    riderRating: number;
    comment?: string;
}

/**
 * submitOrderReview (Misión 5: Lógica Blindada)
 * Actualiza promedios de estrellas y conteo de reseñas de forma atómica.
 */
export async function submitOrderReview(input: ReviewInput) {
    if (!adminDb) return { success: false, error: 'Admin DB not initialized' };

    try {
        await adminDb.runTransaction(async (transaction) => {
            // 1. Referencias
            const orderRef = adminDb.collection('orders').doc(input.orderId);
            const supplierRef = adminDb.collection('roles_supplier').doc(input.supplierId);
            const riderRef = adminDb.collection('users').doc(input.riderId);
            const reviewRef = adminDb.collection('reviews').doc(input.orderId);

            // 2. Lecturas (Todas las lecturas deben ir antes de las escrituras)
            const supplierDoc = await transaction.get(supplierRef);
            const riderDoc = await transaction.get(riderRef);
            const orderDoc = await transaction.get(orderRef);

            if (!orderDoc.exists) throw new Error('Order not found');

            // 3. Cálculos Supplier
            const sData = supplierDoc.data() || {};
            const sCount = sData.reviewCount || 0;
            const sAvg = sData.avgRating || 0;
            const newSCount = sCount + 1;
            const newSAvg = ((sAvg * sCount) + input.localRating) / newSCount;

            // 4. Cálculos Rider
            let newRCount = 0;
            let newRAvg = 0;
            if (riderDoc.exists) {
                const rData = riderDoc.data() || {};
                const rCount = rData.reviewCount || 0;
                const rAvg = rData.avgRating || 0;
                newRCount = rCount + 1;
                newRAvg = ((rAvg * rCount) + input.riderRating) / newRCount;
            }

            // 5. Escrituras
            // Guardar Reseña Dual
            transaction.set(reviewRef, {
                ...input,
                rating: input.localRating, // Standard field for ReviewList
                createdAt: Timestamp.now(),
                type: 'order_delivery'
            });

            // Actualizar Supplier
            transaction.update(supplierRef, {
                avgRating: newSAvg,
                reviewCount: newSCount,
                updatedAt: Timestamp.now()
            });

            // Actualizar Rider (si aplica)
            if (riderDoc.exists) {
                transaction.update(riderRef, {
                    avgRating: newRAvg,
                    reviewCount: newRCount,
                    updatedAt: Timestamp.now()
                });
            }

            // Marcar pedido como reseñado
            transaction.update(orderRef, {
                reviewed: true,
                updatedAt: Timestamp.now()
            });
        });

        return { success: true };
    } catch (error: any) {
        console.error('Review Transaction Error:', error);
        return { success: false, error: error.message };
    }
}

interface AppointmentReviewInput {
    appointmentId: string;
    supplierId: string;
    userId: string;
    rating: number;
    comment?: string;
}

/**
 * submitAppointmentReview
 * Califica un turno asistido y actualiza estrellas del comercio.
 */
export async function submitAppointmentReview(input: AppointmentReviewInput) {
    if (!adminDb) return { success: false, error: 'Admin DB not initialized' };

    try {
        await adminDb.runTransaction(async (transaction) => {
            const appointmentRef = adminDb.collection('appointments').doc(input.appointmentId);
            const supplierRef = adminDb.collection('roles_supplier').doc(input.supplierId);
            const reviewRef = adminDb.collection('reviews').doc(`apt_${input.appointmentId}`);

            const supplierDoc = await transaction.get(supplierRef);
            const appointmentDoc = await transaction.get(appointmentRef);

            if (!appointmentDoc.exists) throw new Error('Appointment not found');

            const sData = supplierDoc.data() || {};
            const sCount = sData.reviewCount || 0;
            const sAvg = sData.avgRating || 0;
            const newCount = sCount + 1;
            const newAvg = ((sAvg * sCount) + input.rating) / newCount;

            transaction.set(reviewRef, {
                ...input,
                createdAt: Timestamp.now(),
                type: 'appointment_review',
                entityId: input.supplierId // Standard for List
            });

            transaction.update(supplierRef, {
                avgRating: newAvg,
                reviewCount: newCount,
                updatedAt: Timestamp.now()
            });

            transaction.update(appointmentRef, {
                reviewed: true,
                updatedAt: Timestamp.now()
            });
        });

        return { success: true };
    } catch (error: any) {
        console.error('Appointment Review Error:', error);
        return { success: false, error: error.message };
    }
}
