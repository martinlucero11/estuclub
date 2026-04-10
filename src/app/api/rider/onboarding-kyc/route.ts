import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getDriveClient, uploadFileToDrive } from '@/lib/google-drive';
import { getVisionClient } from '@/lib/google-vision';

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        // 1. Verify User
        const decodedToken = await adminAuth!.verifyIdToken(idToken);
        const { uid } = decodedToken;

        // 2. Parse FormData
        const formData = await req.formData();
        const dniFile = formData.get('dni') as File | null;
        const selfieFile = formData.get('selfie') as File | null;
        const fullNameInput = (formData.get('fullName') as string || '').trim().toUpperCase();

        if (!dniFile || !selfieFile || !fullNameInput) {
            return NextResponse.json({ error: 'Faltan documentos o datos obligatorios' }, { status: 400 });
        }

        const dniBuffer = Buffer.from(await dniFile.arrayBuffer());
        const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());

        // 3. Vision API - OCR Verification
        const visionClient = getVisionClient();
        const [result] = await visionClient.textDetection(dniBuffer);
        const fullText = result.fullTextAnnotation?.text || '';
        const normalizedFullText = fullText.toUpperCase();

        // 3b. Name Match Validation (Strict)
        // Split input name into parts (First, Last)
        const nameParts = fullNameInput.split(' ').filter(p => p.length > 1);
        const allPartsMatch = nameParts.every(part => normalizedFullText.includes(part));

        if (!allPartsMatch) {
            // Attempt to extract the "Real Name" for the authority error
            // We look for common patterns in Argentine DNI
            const lines = fullText.split('\n').map(l => l.trim());
            let extractedName = "otro nombre";
            
            // Heuristic to find the name in the DNI text
            const nameIdx = lines.findIndex(l => l.toUpperCase().includes('NOMBRE') || l.toUpperCase().includes('GIVEN NAMES'));
            const surnameIdx = lines.findIndex(l => l.toUpperCase().includes('APELLIDO') || l.toUpperCase().includes('SURNAME'));
            
            if (nameIdx !== -1 && lines[nameIdx + 1]) {
                const surnames = surnameIdx !== -1 ? lines[surnameIdx + 1] : "";
                const names = lines[nameIdx + 1];
                extractedName = `${names} ${surnames}`.trim();
            }

            return NextResponse.json({ 
                error: `Según tu DNI te llamas ${extractedName}, necesitamos que uses tu nombre real.`,
                status: 'KYC_FAILED'
            }, { status: 400 });
        }

        // 4. Drive Upload (Direct)
        const parentFolderId = process.env.GOOGLE_DRIVE_RIDER_FOLDER_ID!;
        
        // Upload DNI
        const dniUpload = await uploadFileToDrive(
            dniBuffer, 
            `DNI_${uid}_${Date.now()}.jpg`, 
            'image/jpeg', 
            parentFolderId
        );

        // Upload Selfie
        const selfieUpload = await uploadFileToDrive(
            selfieBuffer, 
            `SELFIE_${uid}_${Date.now()}.jpg`, 
            'image/jpeg', 
            parentFolderId
        );

        // 5. Firestore Updates
        if (!adminDb) throw new Error("Firestore Admin not initialized");

        const userRef = adminDb.collection('users').doc(uid);
        const appRef = adminDb.collection('rider_applications').doc();

        const batch = adminDb.batch();

        // Update User Profile
        batch.update(userRef, {
            photoUrl: selfieUpload.url,
            role: 'rider_pending',
            kycVerifiedAt: new Date(),
            updatedAt: new Date()
        });

        // Create Application record
        batch.set(appRef, {
            id: appRef.id,
            userId: uid,
            fullName: fullNameInput,
            dniUrl: dniUpload.url,
            selfieUrl: selfieUpload.url,
            status: 'pending',
            createdAt: new Date(),
            metadata: {
                ocrChecked: true,
                ocrRaw: fullText.substring(0, 500) // Store snippet for audit
            }
        });

        await batch.commit();

        return NextResponse.json({
            success: true,
            photoUrl: selfieUpload.url,
            redirect: '/rider'
        });

    } catch (error: any) {
        console.error('KYC_ROUTE_ERROR:', error);
        return NextResponse.json({ 
            error: error.message || 'Error interno en la verificación de identidad' 
        }, { status: 500 });
    }
}
