export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Preference } from 'mercadopago';
import { mpClient } from '@/lib/mercadopago';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

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
        const orderDoc = await adminDb.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
        }

        const orderData = orderDoc.data();
        
        // 3. Verificar que la orden pertenezca al usuario autenticado
        if (orderData?.userId !== decodedToken.uid) {
            return NextResponse.json({ error: 'No tienes permiso para pagar esta orden' }, { status: 403 });
        }

        const { items, supplierId } = orderData as { items: any[], supplierId: string };

        // 4. Configuración y Validaciones del Comercio (Seller)
        if (!supplierId) {
            return NextResponse.json({ error: 'La orden no tiene un comercio asociado (supplierId faltante)' }, { status: 400 });
        }

        const supplierDoc = await adminDb.collection('roles_supplier').doc(supplierId).get();
        const supplierData = supplierDoc.data();
        const sellerAccessToken = supplierData?.mp_credentials?.access_token;

        if (!sellerAccessToken) {
            console.error(`Comercio ${supplierId} no tiene credenciales de Mercado Pago vinculadas.`);
            return NextResponse.json({ error: 'El comercio no está habilitado para recibir pagos digitales' }, { status: 400 });
        }

        const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;
        const baseUrl = (rawBaseUrl || 'https://estuclub.com.ar').replace(/\/$/, '');

        // 5. Preparar Cliente MP con el Token del Comercio
        const { MercadoPagoConfig, Preference } = require('mercadopago');
        const mpSellerClient = new MercadoPagoConfig({ accessToken: sellerAccessToken, options: { timeout: 10000 } });
        const preference = new Preference(mpSellerClient);

        // 6. Split de Pagos y Estructuración
        // Costo de envío se EXCLUYE totalmente de Mercado Pago.
        // Solo enviamos los items. El delivery se cobra en persona.
        
        const preferenceData = {
            body: {
                items: items.map((item: any) => ({
                    id: String(item.productId || item.id || 'product'),
                    title: String(item.name || 'Producto EstuClub').slice(0, 250),
                    quantity: Math.max(1, Number(item.quantity) || 1),
                    unit_price: Math.max(1, Number(item.price)), 
                    currency_id: 'ARS'
                })),
                marketplace_fee: 500, // Comisión Fija de Estuclub
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
        };

        const response = await preference.create(preferenceData);

        return NextResponse.json({ 
            id: response.id, 
            preference_id: response.id, 
            init_point: response.init_point,
        });

    } catch (error: any) {
        console.error('Checkout Secure Error:', error);
        
        // Log deep details if available
        if (error.response) {
            console.error('Mercado Pago API Detail:', JSON.stringify(error.response, null, 2));
        }

        return NextResponse.json({ 
            error: 'Error procesando el pago',
            message: error.message,
            detail: error.response?.data || error.message
        }, { status: 500 });
    }
}

