import { NextResponse } from 'next/server';
import { Preference } from 'mercadopago';
import { mpClient } from '@/lib/mercadopago';

/**
 * CHECKOUT API — BYPASS MODE (Temporary)
 * Simple preference, no splits, no marketplace_fee.
 * Direct payment to collector_id 3304086909.
 * TODO: Re-enable split logic after MP sandbox validation.
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderId, items, totalSubtotal } = body;

        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');

        // Calculate 5% service fee for MP payment
        const serviceFee = Math.round(totalSubtotal * 0.05);

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
                external_reference: orderId || 'test_order',
                metadata: {
                    order_id: orderId || 'test_order',
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
        console.error('Checkout Bypass Error:', error);
        return NextResponse.json({ 
            error: error.message || 'Payment error',
            detail: error.cause || error.stack 
        }, { status: 500 });
    }
}
