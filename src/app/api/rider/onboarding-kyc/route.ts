import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, getInitError } from '@/lib/firebase-admin';
import { getDriveClient, uploadFileToDrive } from '@/lib/google-drive';
import { getVisionClient } from '@/lib/google-vision';

export async function POST(req: NextRequest) {

    try {
        if (!adminAuth) {
            const initError = getInitError();
            return NextResponse.json({ 
                error: 'Firebase Admin no se pudo inicializar. Revisa las variables de entorno.',
                details: initError
            }, { status: 500 });
        }

        const formData = await req.formData();
        const action = formData.get('action') as string || 'submit-onboarding';
        const visionClient = getVisionClient();

        // --- AUTH CHECK ONLY FOR FINAL SUBMIT ---
        let uid = '';
        if (action === 'submit-onboarding') {
            const authHeader = req.headers.get('Authorization');
            if (!authHeader?.startsWith('Bearer ')) {
                return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
            }
            const idToken = idTokenFromHeader(authHeader);
            const decodedToken = await adminAuth.verifyIdToken(idToken);
            uid = decodedToken.uid;
        }

        // --- ACTION: VALIDATE DNI ---
        if (action === 'validate-dni') {
            const dniFile = formData.get('dni') as File | null;
            if (!dniFile) return NextResponse.json({ error: 'Falta foto del DNI' }, { status: 400 });
            
            const buffer = Buffer.from(await dniFile.arrayBuffer());
            const [result] = await visionClient.textDetection(buffer);
            const fullText = result.fullTextAnnotation?.text || '';
            
            if (!fullText || fullText.length < 20) {
                return NextResponse.json({ error: 'No se pudo leer el documento. Asegúrate de que haya buena luz.' }, { status: 400 });
            }

            const extractedName = extractArgentineDNIName(fullText);
            
            if (!extractedName.fullName) {
                return NextResponse.json({ 
                    error: 'No pudimos identificar tu nombre. Intenta con una foto más clara enfocando los campos NOMBRE y APELLIDO.',
                    raw: fullText.substring(0, 200)
                }, { status: 400 });
            }

            return NextResponse.json({ 
                success: true, 
                fullName: extractedName.fullName,
                firstName: extractedName.firstName,
                lastName: extractedName.lastName
            });
        }

        // --- ACTION: VALIDATE SELFIE ---
        if (action === 'validate-selfie') {
            const selfieFile = formData.get('selfie') as File | null;
            if (!selfieFile) return NextResponse.json({ error: 'Falta selfie' }, { status: 400 });

            const buffer = Buffer.from(await selfieFile.arrayBuffer());
            const [result] = await visionClient.faceDetection(buffer);
            const faces = result.faceAnnotations || [];

            if (faces.length === 0) {
                return NextResponse.json({ error: 'No se detectó un rostro. Asegúrate de que tu cara esté visible y bien iluminada.' }, { status: 400 });
            }

            const face = faces[0];
            if ((face.detectionConfidence || 0) < 0.7) {
                return NextResponse.json({ error: 'La calidad de la imagen es baja. Intenta nuevamente.' }, { status: 400 });
            }

            return NextResponse.json({ success: true });
        }

        // --- ACTION: SUBMIT ONBOARDING (FINAL) ---
        const dniFile = formData.get('dni') as File | null;
        const selfieFile = formData.get('selfie') as File | null;
        const fullNameInput = (formData.get('fullName') as string || '').trim().toUpperCase();

        if (!dniFile || !selfieFile || !fullNameInput) {
            return NextResponse.json({ error: 'Faltan documentos o datos obligatorios' }, { status: 400 });
        }

        const dniBuffer = Buffer.from(await dniFile.arrayBuffer());
        const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());

        // Drive Upload (Robust Folder Selection)
        const parentFolderId = process.env.GOOGLE_DRIVE_RIDER_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (!parentFolderId) {
            throw new Error('Configuración de carpeta de Drive faltante: GOOGLE_DRIVE_RIDER_FOLDER_ID');
        }
        
        console.log(`[KYC API] Uploading documents to Drive folder: ${parentFolderId}`);

        const [dniUpload, selfieUpload] = await Promise.all([
            uploadFileToDrive(dniBuffer, `DNI_${uid}_${Date.now()}.jpg`, 'image/jpeg', parentFolderId),
            uploadFileToDrive(selfieBuffer, `SELFIE_${uid}_${Date.now()}.jpg`, 'image/jpeg', parentFolderId)
        ]);

        if (!adminDb) throw new Error("Firestore Admin not initialized");
        const userRef = adminDb.collection('users').doc(uid);
        const appRef = adminDb.collection('rider_applications').doc();

        const batch = adminDb.batch();
        batch.update(userRef, {
            photoUrl: selfieUpload.url,
            role: 'rider_pending',
            kycVerifiedAt: new Date(),
            updatedAt: new Date()
        });

        batch.set(appRef, {
            id: appRef.id,
            userId: uid,
            fullName: fullNameInput,
            dniUrl: dniUpload.url,
            selfieUrl: selfieUpload.url,
            vehicleType: formData.get('vehicleType'),
            patente: formData.get('patente'),
            address: formData.get('address'),
            location: {
                lat: parseFloat(formData.get('lat') as string),
                lng: parseFloat(formData.get('lng') as string)
            },
            phone: formData.get('phone'),
            status: 'pending',
            createdAt: new Date()
        });

        await batch.commit();

        return NextResponse.json({ success: true, redirect: '/rider' });

    } catch (error: any) {
        console.error('KYC_ROUTE_ERROR:', error);
        return NextResponse.json({ error: error.message || 'Error en la verificación' }, { status: 500 });
    }
}

function idTokenFromHeader(header: string) {
    return header.split('Bearer ')[1];
}

/**
 * Heuristic to extract Name and Surname from Argentine DNI using anchors
 * Rules:
 * - APELLIDO/S followed by surname
 * - NOMBRE/S followed by given names
 */
function extractArgentineDNIName(text: string) {
    const lines = text.toUpperCase().split('\n').map(l => l.trim()).filter(l => l.length > 1);
    
    // Anchors for Argentine DNI
    const surnameAnchors = ['APELLIDO/S', 'APELLIDO', 'SURNAME'];
    const nameAnchors = ['NOMBRE/S', 'NOMBRE', 'GIVEN NAMES'];
    const skipList = ['DNI', 'SEXO', 'SEX', 'NACIONALIDAD', 'FECHA', 'DOCUMENTO', 'REPUBLICA', 'EJEMPLAR'];

    let lastName = '';
    let firstName = '';

    const findValueAfterAnchor = (anchors: string[]) => {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const matchingAnchor = anchors.find(a => line.includes(a));
            
            if (matchingAnchor) {
                // 1. Try to find on the SAME line after the anchor
                const parts = line.split(matchingAnchor);
                if (parts[1]) {
                    const candidate = parts[1].replace(/[:;]/g, '').trim();
                    if (candidate.length > 2 && !skipList.some(s => candidate.includes(s))) {
                        return candidate;
                    }
                }

                // 2. Try the NEXT 3 lines (ignoring labels and empty lines)
                for (let j = 1; j <= 3; j++) {
                    const nextLine = lines[i + j];
                    if (!nextLine) break;
                    
                    // If the line is another known anchor or a skip-word, ignore it
                    const looksLikeOtherAnchor = [...surnameAnchors, ...nameAnchors, ...skipList].some(a => nextLine.includes(a));
                    
                    if (!looksLikeOtherAnchor && nextLine.length > 2) {
                        return nextLine;
                    }
                }
            }
        }
        return '';
    };

    lastName = findValueAfterAnchor(surnameAnchors);
    firstName = findValueAfterAnchor(nameAnchors);

    const clean = (s: string) => s.replace(/[^A-Z\s]/g, '').trim();

    return {
        firstName: clean(firstName),
        lastName: clean(lastName),
        fullName: clean(`${firstName} ${lastName}`)
    };
}
