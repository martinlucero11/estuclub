'use server';

import { adminAuth, adminFirestore } from '@/firebase/admin';

type PlanType = 'rider' | 'cluber_basic' | 'cluber_plus' | 'cluber_pro';

export async function createSubscription(planType: PlanType, idToken: string) {
    try {
        // 1. Verify user token
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const email = decodedToken.email;

        if (!email) {
            throw new Error('User email not found');
        }

        // 2. Select preapproval_plan_id based on planType
        let planId = '';
        let amount = 0;
        
        switch (planType) {
            case 'rider':
                planId = process.env.MP_PLAN_RIDER || '';
                amount = 25000;
                break;
            case 'cluber_basic':
                planId = process.env.MP_PLAN_CLUBER_BASIC || '';
                amount = 25000;
                break;
            case 'cluber_plus':
                planId = process.env.MP_PLAN_CLUBER_PLUS || '';
                amount = 35000;
                break;
            case 'cluber_pro':
                planId = process.env.MP_PLAN_CLUBER_PRO || '';
                amount = 50000;
                break;
            default:
                throw new Error('Invalid plan type');
        }

        if (!planId) {
            throw new Error(`MP Plan ID for ${planType} is not configured.`);
        }

        const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
        if (!MP_ACCESS_TOKEN) {
            throw new Error('Mercado Pago Access Token is not configured.');
        }

        const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        let backUrl = `${BASE_URL}/success`;
        if (planType === 'rider') {
             backUrl = `${BASE_URL}/rider`;
        } else {
             backUrl = `${BASE_URL}/panel-cluber`;
        }

        // 3. Call MP Preapproval API
        const payload = {
            preapproval_plan_id: planId,
            payer_email: email,
            back_url: backUrl,
            external_reference: uid,
            reason: `Suscripción Estuclub - ${planType}`,
            auto_recurring: {
                frequency: 1,
                frequency_type: "months",
                transaction_amount: amount,
                currency_id: "ARS"
            }
        };

        const response = await fetch('https://api.mercadopago.com/preapproval', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error creating MP preapproval:', errorData);
            throw new Error('Failed to create subscription with Mercado Pago');
        }

        const data = await response.json();
        const initPoint = data.init_point;
        const subscriptionId = data.id;

        // 4. Save initial status to Firestore
        await adminFirestore.collection('users').doc(uid).set({
            subscriptionId: subscriptionId,
            subscriptionStatus: 'pending',
            planType: planType
        }, { merge: true });

        // 5. Return init_point
        return { success: true, initPoint };

    } catch (error: any) {
        console.error('Error in createSubscription:', error);
        return { success: false, error: error.message };
    }
}
