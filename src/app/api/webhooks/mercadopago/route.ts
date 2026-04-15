import { NextResponse, NextRequest } from 'next/server';
import { Payment } from 'mercadopago';
import { mpClient } from '@/lib/mercadopago';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { broadcastNewOrder } from '@/lib/notifications';

/**
 * MERCADO PAGO WEBHOOK (Server-Side) - SECURE VERSION
 * Implements HMAC-SHA256 signature verification and transaction auditing.
 */
export async function POST(req: NextRequest) {
    const requestId = req.headers.get('x-request-id') || '';
    const xSignature = req.headers.get('x-signature') || '';
    const secret = process.env.MP_WEBHOOK_SECRET;

    let body: any;
    let paymentId: string | null = null;
    let logRef = adminDb?.collection('payment_logs').doc();

    try {
        body = await req.json();
        paymentId = body.data?.id || body.id || req.nextUrl.searchParams.get('data.id') || req.nextUrl.searchParams.get('id');

        if (!adminDb) throw new Error('Firebase Admin not initialized');

        // 1. Signature Verification Logic
        if (!secret) {
            console.error('MP_WEBHOOK_SECRET is missing');
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
        }

        const parts = xSignature.split(',');
        let ts = '';
        let receivedHash = '';

        parts.forEach(part => {
            const [key, value] = part.split('=');
            if (key?.trim() === 'ts') ts = value?.trim();
            if (key?.trim() === 'v1') receivedHash = value?.trim();
        });

        const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(manifest);
        const calculatedHash = hmac.digest('hex');

        // Secure Comparison
        const isSignatureValid = receivedHash && crypto.timingSafeEqual(
            Buffer.from(calculatedHash, 'hex'),
            Buffer.from(receivedHash, 'hex')
        );

        if (!isSignatureValid) {
            if (logRef) {
                await logRef.set({
                    type: 'invalid_signature',
                    requestId,
                    paymentId,
                    receivedAt: FieldValue.serverTimestamp(),
                    body
                });
            }
            return NextResponse.json({ error: 'Forbidden: Invalid Signature' }, { status: 403 });
        }

        // 2. Process Valid Payment
        const paymentResource = new Payment(mpClient);
        const paymentData = await paymentResource.get({ id: String(paymentId) });

        const { status, metadata, external_reference } = paymentData;
        const orderId = metadata?.order_id || external_reference;

        // Audit Log Entry
        if (logRef) {
            await logRef.set({
                type: 'payment_notification',
                orderId,
                paymentId,
                status,
                requestId,
                metadata,
                receivedAt: FieldValue.serverTimestamp(),
                rawPayload: paymentData
            });
        }

        // 3. State Transitions Logic
        if (status === 'approved') {
            await handleApprovedPayment(orderId, String(paymentId), metadata);
        } else if (['rejected', 'cancelled', 'refunded'].includes(status || '')) {
            await handleFailedPayment(orderId, status || 'failed');
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error: any) {
        console.error('Webhook Error:', error.message);
        
        // Final fallback log if everything fails
        if (logRef) {
            await logRef.set({
                type: 'error',
                error: error.message,
                receivedAt: FieldValue.serverTimestamp(),
                body: body || 'empty'
            }, { merge: true });
        }

        return NextResponse.json({ status: 'received', error: error.message }, { status: 200 });
    }
}

async function handleApprovedPayment(orderId: string, paymentId: string, metadata: any) {
    if (!adminDb || !orderId) return;

    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) return;

    const orderData = orderDoc.data();
    if (orderData?.payment_id) return; // Already processed

    const batch = adminDb.batch();

    // 1. Update Order Status
    batch.update(orderRef, {
        status: 'pending',
        payment_id: paymentId,
        paid_at: FieldValue.serverTimestamp(),
        logistics_split: {
            cluber: metadata?.cluber_net || 0,
            rider: metadata?.rider_net || 0,
            estuclub: metadata?.estuclub_net || 0
        }
    });

    // 2. Increment Product Sales
    const items = orderData?.items || [];
    items.forEach((item: any) => {
        if (item.productId) {
            const productRef = adminDb!.collection('products').doc(item.productId);
            batch.update(productRef, {
                salesCount: FieldValue.increment(item.quantity || 1)
            });
        }
    });

    // 3. Rider Subscription Handle
    if (metadata?.type === 'subscription_rider' && metadata?.rider_id) {
        const userRef = adminDb.collection('users').doc(metadata.rider_id);
        
        // Calculate new expiration: 30 days from now
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);

        batch.update(userRef, {
            role: 'rider', // Ensure role is rider (not rider_pending anymore if they paid)
            subscriptionStatus: 'active',
            membershipPaidAt: FieldValue.serverTimestamp(),
            membershipPaidUntil: Timestamp.fromDate(nextMonth),
            subscriptionPaidAt: FieldValue.serverTimestamp(),
            mp_linked: true
        });
    }

    await batch.commit();

    // 4. Notify Riders (Broadcast)
    try {
        await broadcastNewOrder({
            id: orderId,
            supplierName: orderData?.supplierName || 'Nuevo Pedido'
        });
    } catch (err) {
        console.error('Failed to broadcast new order to riders:', err);
        // We don't throw here to avoid failing the webhook response if only notification failed
    }
}


async function handleFailedPayment(orderId: string, status: string) {
    if (!adminDb || !orderId) return;
    
    await adminDb.collection('orders').doc(orderId).update({
        status: 'payment_failed',
        last_mp_status: status,
        updatedAt: FieldValue.serverTimestamp()
    });
}
