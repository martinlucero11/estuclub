import { NextResponse } from 'next/server';
import { Preference } from 'mercadopago';
import { mpClient } from '@/lib/mercadopago';
import { adminAuth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // 1. Validar Autenticación (Bearer Token)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(token);
        } catch (authError) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        const userId = decodedToken.uid;
        const userEmail = decodedToken.email || '';

        // 2. Configuración y Validaciones de Entorno
        const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;
        const baseUrl = (rawBaseUrl || 'https://estuclub.com.ar').replace(/\/$/, '');

        // 3. Crear Preferencia de Mercado Pago
        const preference = new Preference(mpClient);

        // PRECIO CONFIRMADO: $25.000 ARS
        const MEMBERSHIP_PRICE = 25000;

        const preferenceData = {
            body: {
                items: [
                    {
                        id: 'rider_membership_monthly',
                        title: 'Membresía Rider Estuclub (30 días)',
                        quantity: 1,
                        unit_price: MEMBERSHIP_PRICE,
                        currency_id: 'ARS'
                    }
                ],
                payer: {
                    email: userEmail,
                },
                back_urls: {
                    success: `${baseUrl}/rider`,
                    failure: `${baseUrl}/rider`,
                    pending: `${baseUrl}/rider`,
                },
                auto_return: 'approved',
                notification_url: `${baseUrl}/api/webhooks/mercadopago`,
                external_reference: `membership_${userId}`,
                metadata: {
                    type: 'subscription_rider',
                    rider_id: userId,
                    amount: MEMBERSHIP_PRICE
                }
            }
        };

        const response = await preference.create(preferenceData);

        console.log(`[MEMBERSHIP CHECKOUT] Generated preference for ${userId}: ${response.id}`);

        return NextResponse.json({ 
            id: response.id, 
            init_point: response.init_point,
        });

    } catch (error: any) {
        console.error('Membership Checkout Error:', error);
        return NextResponse.json({ 
            error: 'Error procesando el checkout',
            message: error.message 
        }, { status: 500 });
    }
}
