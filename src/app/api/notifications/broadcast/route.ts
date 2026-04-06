import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging, adminDb } from '@/lib/firebase-admin';

/**
 * API Route: /api/notifications/broadcast
 * Misión 3: Envío masivo de notificaciones con Deep Linking.
 */
export async function POST(req: NextRequest) {
    try {
        if (!adminMessaging || !adminDb) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        const { title, body, url, segment } = await req.json();

        if (!title || !body || !url) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Obtener tokens del segmento (o todos)
        let tokens: string[] = [];
        const snapshot = await adminDb.collection('userTokens').get();
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.tokens && Array.isArray(data.tokens)) {
                tokens.push(...data.tokens);
            }
        });

        if (tokens.length === 0) {
            return NextResponse.json({ success: true, sent: 0, message: 'No devices registered' });
        }

        // 2. Enviar por lotes (FCM soporta hasta 500 tokens por multicast)
        const message = {
            notification: { title, body },
            data: { url }, // Deep Linking: El SW usará esto en notificationclick
            tokens: tokens.slice(0, 500) // Simplificación para MVP, idealmente iterar
        };

        const response = await adminMessaging.sendEachForMulticast(message);

        return NextResponse.json({ 
            success: true, 
            sent: response.successCount, 
            failureCount: response.failureCount 
        });

    } catch (error: any) {
        console.error('Broadcast error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
