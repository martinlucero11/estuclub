export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { uploadFileToDrive } from '@/lib/google-drive';

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        // 1. Verify User
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const { uid } = decodedToken;

        // 2. Parse Multipart Data
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const targetFolder = formData.get('folder') as string || 'General';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${uid}_${Date.now()}_${file.name}`;
        const mimeType = file.type;

        // 3. Upload to Drive (Role-Aware Folder Selection)
        const RIDER_FOLDER = process.env.GOOGLE_DRIVE_RIDER_FOLDER_ID || '1V1PofRvm6GpeloJWYiPzLrVR0nDHILzN';
        const CLUBER_FOLDER = process.env.GOOGLE_DRIVE_CLUBER_FOLDER_ID || '1eDsUvSCTYXhkTvE2VhVR7LWC1l6eUHHg';
        const GENERAL_FOLDER = process.env.GOOGLE_DRIVE_FOLDER_ID;

        const parentFolderId = 
            targetFolder === 'rider' ? RIDER_FOLDER :
            targetFolder === 'cluber' ? CLUBER_FOLDER :
            GENERAL_FOLDER!;

        const result = await uploadFileToDrive(buffer, filename, mimeType, parentFolderId);

        return NextResponse.json({ 
            success: true, 
            id: result?.id, 
            url: result?.url 
        });

    } catch (error: any) {
        console.error('API Drive Upload Error:', error);
        return NextResponse.json({ 
            error: error.message || 'Internal Server Error' 
        }, { status: 500 });
    }
}
