import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        if (!adminMessaging || !adminDb) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        const { benefitTitle, supplierName, benefitId, imageUrl } = await request.json();

        if (!benefitTitle || !supplierName || !benefitId) {
            return NextResponse.json({ error: 'Missing notification data' }, { status: 400 });
        }

        // 1. Get all active tokens
        let tokens: string[] = [];
        const tokenDocs: { id: string, tokens: string[] }[] = [];
        
        try {
            const snapshot = await adminDb.collection('userTokens').get();
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.tokens && Array.isArray(data.tokens) && data.tokens.length > 0) {
                    tokens.push(...data.tokens);
                    tokenDocs.push({ id: doc.id, tokens: data.tokens });
                }
            });
        } catch (dbError) {
            console.error('Error fetching tokens:', dbError);
            return NextResponse.json({ error: 'Error fetching device tokens' }, { status: 500 });
        }

        if (tokens.length === 0) {
            return NextResponse.json({ success: true, sent: 0, message: 'No devices registered' });
        }

        // 2. Prepare Multicast Message
        const message = {
            notification: {
                title: `¡Nuevo Beneficio de ${supplierName}! 🎁`,
                body: `${benefitTitle}`,
            },
            data: {
                benefitId: benefitId,
                type: 'benefit',
                url: `/benefits?id=${benefitId}`, // DEEP LINKING SUPPORT
                click_action: `https://estuclub.com.ar/benefits?id=${benefitId}`
            },
            tokens: Array.from(new Set(tokens)).slice(0, 500), // Multicast limit 500
            android: {
                priority: 'high' as const,
                notification: {
                    channelId: 'benefits_channel',
                    icon: 'notification_icon',
                    color: '#cb465a',
                }
            },
            webpush: {
                headers: {
                    Urgency: 'high'
                },
                notification: {
                    icon: imageUrl || '/logo-rosa.svg',
                    badge: '/logo-rosa.svg',
                    vibrate: [200, 100, 200],
                }
            }
        };

        // 3. Send Notification
        const response = await adminMessaging.sendEachForMulticast(message);

        // 4. Token Cleanup Logic (Robustness)
        if (response.failureCount > 0) {
            const tokensToRemove: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error?.code;
                    // MISSION 4: Cleanup stale/ghost tokens
                    if (errorCode === 'messaging/registration-token-not-registered' || 
                        errorCode === 'messaging/invalid-registration-token') {
                        tokensToRemove.push(message.tokens[idx]);
                    }
                }
            });

            if (tokensToRemove.length > 0) {
                console.log(`Cleaning up ${tokensToRemove.length} stale tokens...`);
                // Batch delete/filter tokens in Firestore
                for (const docInfo of tokenDocs) {
                    const remainingTokens = docInfo.tokens.filter(t => !tokensToRemove.includes(t));
                    if (remainingTokens.length !== docInfo.tokens.length) {
                        if (remainingTokens.length === 0) {
                            await adminDb.collection('userTokens').doc(docInfo.id).delete();
                        } else {
                            await adminDb.collection('userTokens').doc(docInfo.id).update({ tokens: remainingTokens });
                        }
                    }
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            sent: response.successCount, 
            failureCount: response.failureCount 
        });

    } catch (error: any) {
        console.error('Error sending benefit notification:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

