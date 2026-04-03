import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/firebase/server-config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { benefitTitle, supplierName, benefitId } = await request.json();

        if (!benefitTitle || !supplierName || !benefitId) {
            return NextResponse.json({ error: 'Missing notification data' }, { status: 400 });
        }

        const message = {
            notification: {
                title: `¡Nuevo Beneficio de ${supplierName}! 🎁`,
                body: `${benefitTitle}`,
            },
            data: {
                benefitId: benefitId,
                type: 'benefit',
                click_action: `https://estuclub.com.ar/benefits` // URL to open
            },
            topic: 'all_benefits',
            android: {
                priority: 'high',
                notification: {
                    channel_id: 'benefits_channel', // Important for Android 8+
                    icon: 'notification_icon', // Res/drawable icon
                    color: '#cb465a',
                }
            },
            webpush: {
                headers: {
                    Urgency: 'high'
                },
                notification: {
                    icon: '/logo-rosa.svg',
                    badge: '/logo-rosa.svg',
                    vibrate: [200, 100, 200],
                }
            }
        };

        const response = await admin.messaging().send(message as any);


        return NextResponse.json({ success: true, messageId: response });
    } catch (error: any) {
        console.error('Error sending benefit notification:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

