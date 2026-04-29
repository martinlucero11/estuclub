import { NextResponse } from 'next/server';
import { PreApproval } from 'mercadopago';
import { mpClient } from '@/lib/mercadopago';
import { adminAuth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
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
        
        const { planId } = await req.json();
        
        const PLAN_MAP: Record<string, { title: string, price: number }> = {
            cluber: { title: 'Suscripción Plan Cluber Estuclub', price: 25000 },
            delivery: { title: 'Suscripción Plan Delivery Estuclub', price: 35000 },
            pro: { title: 'Suscripción Plan Pro Estuclub', price: 50000 }
        };
        
        const plan = PLAN_MAP[planId];
        if (!plan) return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });

        const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;
        const baseUrl = (rawBaseUrl || 'https://estuclub.com.ar').replace(/\/$/, '');

        // Create recurring subscription directly
        const preapproval = new PreApproval(mpClient);

        const preApprovalData = {
            body: {
                reason: plan.title,
                external_reference: `cluber_sub_${userId}_${planId}`,
                payer_email: userEmail,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: "months",
                    transaction_amount: plan.price,
                    currency_id: "ARS"
                },
                back_url: `${baseUrl}/panel-cluber`,
                status: "pending"
            }
        };
        
        const response = await preapproval.create(preApprovalData);

        return NextResponse.json({ 
            id: response.id, 
            init_point: response.init_point,
        });

    } catch (error: any) {
        console.error('Cluber Membership Checkout Error:', error);
        return NextResponse.json({ 
            error: 'Error procesando el checkout',
            message: error.message 
        }, { status: 500 });
    }
}
