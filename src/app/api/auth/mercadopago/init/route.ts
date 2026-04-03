export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getMPOAuthUrl } from '@/lib/mercadopago';
import { randomUUID } from 'crypto';

/**
 * MERCADO PAGO OAUTH INIT
 * Generates a secure authorization URL with a one-time state (nonce)
 */
export async function POST(req: Request) {
    try {
        // 1. Verificar Autenticación (Bearer Token)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        // 2. Generar State Único (UUID)
        const state = randomUUID();

        // 3. Guardar Estado en Firestore
        await adminDb.collection('mp_oauth_states').doc(state).set({
            userId,
            createdAt: new Date(),
            used: false
        });

        // 4. Construir URL de Mercado Pago
        const authUrl = getMPOAuthUrl(state);

        return NextResponse.json({ url: authUrl });

    } catch (error: any) {
        console.error('MP OAuth Init Error:', error);
        return NextResponse.json({ error: 'Error al inicializar vinculación' }, { status: 500 });
    }
}

