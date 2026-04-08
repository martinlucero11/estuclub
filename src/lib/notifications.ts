import { adminMessaging } from './firebase-admin';

/**
 * Server-side notification service.
 * Handles FCM Topic broadcasts and segmenting.
 */

export async function sendTopicNotification(topic: string, title: string, body: string, data?: Record<string, string>) {
    if (!adminMessaging) {
        console.error('FCM Admin not initialized');
        return null;
    }

    try {
        const message = {
            notification: { title, body },
            data: data || {},
            topic: topic
        };

        const response = await adminMessaging.send(message);
        return response;
    } catch (error) {
        console.error(`Error sending topic notification to ${topic}:`, error);
        throw error;
    }
}

/**
 * Broadcasts a new delivery order to all active riders.
 * Segment: active_riders (Subscribed when rider goes online)
 */
export async function broadcastNewOrder(orderData: { id: string, supplierName?: string }) {
    const title = '🛵 ¡Nuevo viaje disponible!';
    const body = `Retirar en ${orderData.supplierName || 'Comercio Local'}`;
    const url = `/rider/trip/${orderData.id}`;

    return sendTopicNotification('active_riders', title, body, {
        type: 'new_order',
        orderId: orderData.id,
        url: url
    });
}
