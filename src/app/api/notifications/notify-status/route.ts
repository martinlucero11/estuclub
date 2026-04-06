import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging, adminDb } from '@/lib/firebase-admin';

/**
 * API Route: /api/notifications/notify-status
 * Misión 6: Notificaciones automáticas por cambio de estado de pedido.
 */
export async function POST(req: NextRequest) {
    try {
        if (!adminMessaging || !adminDb) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        const { userId, orderId, status, supplierName } = await req.json();

        if (!userId || !orderId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Obtener tokens del usuario
        const tokenDoc = await adminDb.collection('userTokens').doc(userId).get();
        const tokens = tokenDoc.data()?.tokens || [];

        if (tokens.length === 0) return NextResponse.json({ success: true, message: 'No tokens found' });

        // 2. Determinar mensaje según estado
        let title = 'Estuclub';
        let body = `Tu pedido #${orderId.slice(-6).toUpperCase()} ha cambiado de estado.`;
        let url = `/orders/${orderId}`;

        switch (status) {
            case 'accepted':
                title = '👨‍🍳 ¡Pedido en preparación!';
                body = `${supplierName || 'El local'} está preparando tu orden.`;
                break;
            case 'searching_rider':
                title = '🛵 Buscando repartidor';
                body = 'Estamos asignando un Rider para tu entrega.';
                break;
            case 'assigned':
                title = '✅ Rider asignado';
                body = 'Un repartidor ya aceptó tu envío.';
                break;
            case 'shipped':
                title = '🚀 ¡Tu pedido va en camino!';
                body = 'El Rider ya retiró tu pedido y se dirige a tu ubicación.';
                break;
            case 'arrived':
                title = '🔔 ¡Llegamos!';
                body = 'El repartidor está en tu puerta.';
                break;
            case 'delivered':
                title = '🎁 ¡Entregado!';
                body = '¡Que lo disfrutes! Por favor, califica tu experiencia.';
                url = '/'; // Lleva a la home para ver el modal de reseña
                break;
        }

        // 3. Enviar multicast
        await adminMessaging.sendEachForMulticast({
            tokens,
            notification: { title, body },
            data: { url, orderId }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Notify status error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
