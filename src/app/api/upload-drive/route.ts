export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { uploadFileToDrive } from '@/lib/google-drive';

export async function POST(req: NextRequest) {
    console.log('--- [DRIVE UPLOAD API] STARTING REQUEST ---');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        console.warn('[DRIVE UPLOAD API] Unauthorized: Missing token');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        // 1. Verify User
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const { uid } = decodedToken;
        console.log(`[DRIVE UPLOAD API] Authenticated User: ${uid}`);

        // 2. Parse Multipart Data
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const targetFolder = formData.get('folder') as string || 'General';

        if (!file) {
            console.error('[DRIVE UPLOAD API] No file provided in formData');
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${uid}_${Date.now()}_${file.name}`;
        const mimeType = file.type;

        // 3. Folder Mapping (Strictly from Environment)
        const FOLDER_MAP: Record<string, string | undefined> = {
            'rider': process.env.GOOGLE_DRIVE_RIDER_FOLDER_ID,
            'cluber': process.env.GOOGLE_DRIVE_CLUBER_FOLDER_ID,
            'deliveries': process.env.GOOGLE_DRIVE_DELIVERIES_FOLDER_ID,
            'student': process.env.GOOGLE_DRIVE_FOLDER_ID,
            'brands': process.env.GOOGLE_DRIVE_FOLDER_ID, // Use general for brands if not specified
        };

        const parentFolderId = FOLDER_MAP[targetFolder] || process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (!parentFolderId) {
            console.error(`[DRIVE UPLOAD API] No Folder ID found for category: ${targetFolder}`);
            return NextResponse.json({ 
                error: `Configuración faltante para la categoría: ${targetFolder}. Verifica el apphosting.yaml.` 
            }, { status: 500 });
        }

        console.log(`[DRIVE UPLOAD API] Uploading to category: ${targetFolder} -> ID: ${parentFolderId}`);

        const result = await uploadFileToDrive(buffer, filename, mimeType, parentFolderId);

        return NextResponse.json({ 
            success: true, 
            id: result?.id, 
            url: result?.url,
            contentLink: result?.contentLink
        });

    } catch (error: any) {
        console.error('CRITICAL API DRIVE UPLOAD ERROR:', {
            message: error.message,
            code: error.code,
            errors: error.errors
        });
        if (error.response?.data) {
            console.error('GOOGLE DRIVE API ERROR DATA (RESPONSE):', JSON.stringify(error.response.data, null, 2));
        }
        return NextResponse.json({ 
            error: error.message || 'Internal Server Error' 
        }, { status: 500 });
    }
}

