import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging, adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * API Route: /api/notifications/notify-announcement
 * Misión 2: Notificar anuncios aprobados a toda la comunidad.
 */
export async function POST(request: NextRequest) {
    try {
        if (!adminMessaging || !adminDb) {
            return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
        }

        const { title, content, announcementId, imageUrl, supplierName, supplierId, targetType } = await request.json();

        if (!title || !announcementId) {
            return NextResponse.json({ error: 'Missing announcement data' }, { status: 400 });
        }

        // 1. Get tokens based on Target Type
        let tokens: string[] = [];
        const tokenDocs: { id: string, tokens: string[] }[] = [];
        
        try {
            if (targetType === 'followers' && supplierId) {
                // SEGMENTED: Only followers of this supplier
                console.log(`Searching for followers of supplier: ${supplierId}`);
                const followersSnapshot = await adminDb.collection('users')
                    .where('favoriteSuppliers', 'array-contains', supplierId)
                    .limit(500)
                    .get();
                
                const followerUids = followersSnapshot.docs.map(doc => doc.id);
                
                if (followerUids.length > 0) {
                    const tokenRefs = followerUids.map(uid => adminDb.collection('userTokens').doc(uid));
                    const snapshots = await adminDb.getAll(...tokenRefs);
                    
                    snapshots.forEach(docSnap => {
                        if (docSnap.exists) {
                            const data = docSnap.data();
                            if (data?.tokens && Array.isArray(data.tokens)) {
                                tokens.push(...data.tokens);
                                tokenDocs.push({ id: docSnap.id, tokens: data.tokens });
                            }
                        }
                    });
                }
            } else {
                // BROADCAST: All registered users
                console.log('Broadcasting notification to all community...');
                const snapshot = await adminDb.collection('userTokens').limit(500).get(); // Safety limit
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.tokens && Array.isArray(data.tokens)) {
                        tokens.push(...data.tokens);
                        tokenDocs.push({ id: doc.id, tokens: data.tokens });
                    }
                });
            }
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
                title: supplierName ? `📢 ${supplierName}: ${title}` : `📢 Estuclub: ${title}`,
                body: content || "Revisa las novedades en Estuclub",
            },
            data: {
                announcementId: announcementId,
                type: 'announcement',
                url: `/announcements`, // DEEP LINKING
                click_action: `https://estuclub.com.ar/announcements`
            },
            tokens: Array.from(new Set(tokens)).slice(0, 500),
            android: {
                priority: 'high' as const,
                notification: {
                    channelId: 'announcements_channel',
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
                }
            }
        };

        // 3. Send Notification
        const response = await adminMessaging.sendEachForMulticast(message);

        // 4. Token Cleanup Logic
        if (response.failureCount > 0) {
            const tokensToRemove: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error?.code;
                    if (errorCode === 'messaging/registration-token-not-registered' || 
                        errorCode === 'messaging/invalid-registration-token') {
                        tokensToRemove.push(message.tokens[idx]);
                    }
                }
            });

            if (tokensToRemove.length > 0) {
                console.log(`Cleaning up ${tokensToRemove.length} stale tokens from Announcements broadcast...`);
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
        console.error('Error sending announcement notification:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
