import { NextResponse } from 'next/server';
import { Payment } from 'mercadopago';
import { mpClient } from '@/lib/mercadopago';
import { adminDb } from '@/firebase/admin';
import * as admin from 'firebase-admin';

/**
 * MERCADO PAGO WEBHOOK (Server-Side)
 * Purpose: Automate role updates and order lifecycle after payment
 * Using Firebase Admin for guaranteed write access
 */

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, data, type } = body;

        // Note: Mercado Pago can send payment or merchant_order notifications
        if (action?.includes('payment') || type === 'payment') {
            const paymentId = data?.id || body.data?.id;
            if (!paymentId) return NextResponse.json({ status: 'ok' });

            const payment = new Payment(mpClient);
            const paymentData = await payment.get({ id: String(paymentId) });

            if (paymentData.status === 'approved') {
                const { metadata, external_reference } = paymentData;

                // 1. Rider Subscription Logic
                if (metadata?.type === 'subscription_rider') {
                    const riderId = metadata.rider_id;
                    const userRef = adminDb.collection('users').doc(riderId);

                    await userRef.update({
                        role: 'rider',
                        subscriptionStatus: 'active',
                        subscriptionPaidAt: admin.firestore.FieldValue.serverTimestamp(),
                        mp_linked: true // Assuming they paid, MP is linked or known
                    });

                }

                // 2. Delivery Order Activation
                if (metadata?.type === 'delivery_order') {
                    const orderId = metadata.order_id;
                    const orderRef = adminDb.collection('orders').doc(orderId);
                    const orderDoc = await orderRef.get();

                    if (orderDoc.exists) {
                        const orderData = orderDoc.data();
                        
                        // Prevent duplicate increments if payment_id already exists
                        if (!orderData?.payment_id) {
                            const items = orderData?.items || [];
                            
                            // Atomic increments for each product sold
                            const productUpdates = items.map((item: any) => {
                                if (!item.productId) return Promise.resolve();
                                const productRef = adminDb.collection('products').doc(item.productId);
                                return productRef.update({
                                    salesCount: admin.firestore.FieldValue.increment(item.quantity || 1)
                                }).catch(err => console.error(`Error updating salesCount for ${item.productId}:`, err));
                            });

                            await Promise.all(productUpdates);

                            await orderRef.update({
                                status: 'searching_rider', // Payment confirmed -> Go to Map!
                                payment_id: String(paymentId),
                                paid_at: admin.firestore.FieldValue.serverTimestamp(),
                                logistics_split: {
                                    cluber: metadata.cluber_net,
                                    rider: metadata.rider_net,
                                    estuclub: metadata.estuclub_net
                                }
                            });

                        } else {

                        }
                    }
                }
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error: any) {
        console.error('❌ Webhook Error:', error.message);
        // We return 200 to Mercado Pago to acknowledge receipt even if internal logic failed
        return NextResponse.json({ status: 'received', error: error.message }, { status: 200 });
    }
}

