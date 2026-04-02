import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/firebase/server-config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { token, topic } = await request.json();

        if (!token || !topic) {
            return NextResponse.json({ error: 'FCM Token and Topic are required' }, { status: 400 });
        }

        // Subscribe the token to the topic
        await admin.messaging().subscribeToTopic(token, topic);


        return NextResponse.json({ success: true, message: `Subscribed to ${topic}` });
    } catch (error: any) {
        console.error('Error subscribing to FCM topic:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
