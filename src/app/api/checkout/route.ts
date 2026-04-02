import { NextResponse } from 'next/server';
import { Preference } from 'mercadopago';
import { mpClient } from '@/lib/mercadopago';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';

/**
 * CHECKOUT API — SECURE MODE
 * Validates user session and fetches order data from Firestore.
 */

export async function POST(req: Request) {
    try {
        // 1. Validar Autenticación (Bearer Token)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No autorizado: Token faltante' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (authError) {
            console.error('Auth verification failed:', authError);
            return NextResponse.json({ error: 'No autorizado: Token inválido' }, { status: 401 });
        }

        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        // 2. Recuperar la orden de Firestore para evitar manipulación de precios
        const orderDoc = await adminFirestore.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
        }

        const orderData = orderDoc.data();
        
        // 3. Verificar que la orden pertenezca al usuario autenticado
        if (orderData?.userId !== decodedToken.uid) {
            return NextResponse.json({ error: 'No tienes permiso para pagar esta orden' }, { status: 403 });
        }

        const { items } = orderData as { items: any[] };

        // 4. Recalcular totalSubtotal desde la base de datos
        const recalculatedSubtotal = items.reduce((acc: number, item: any) => {
            return acc + (Number(item.price) * (Number(item.quantity) || 1));
        }, 0);

        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');

        // Calculate 5% service fee based on DB data
        const serviceFee = Math.round(recalculatedSubtotal * 0.05);

        const preference = new Preference(mpClient);

        const response = await preference.create({
            body: {
                items: [
                    ...items.map((item: any) => ({
                        id: item.id || 'product',
                        title: item.name || 'Producto EstuClub',
                        quantity: Number(item.quantity) || 1,
                        unit_price: Number(item.price),
                        currency_id: 'ARS'
                    })),
                    {
                        id: 'service_fee',
                        title: 'Tarifa de Servicio (EstuClub)',
                        quantity: 1,
                        unit_price: serviceFee,
                        currency_id: 'ARS'
                    }
                ],
                back_urls: {
                    success: `${baseUrl}/orders/${orderId}`,
                    failure: `${baseUrl}/delivery`,
                    pending: `${baseUrl}/delivery`,
                },
                auto_return: 'approved',
                notification_url: `${baseUrl}/api/webhooks/mercadopago`,
                external_reference: orderId,
                metadata: {
                    order_id: orderId,
                    userId: decodedToken.uid,
                    type: 'delivery_order'
                }
            }
        });

        return NextResponse.json({ 
            id: response.id, 
            preference_id: response.id, 
            init_point: response.init_point,
        });

    } catch (error: any) {
        console.error('Checkout Secure Error:', error);
        return NextResponse.json({ 
            error: 'Error procesando el pago',
            detail: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
