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
            let result;
            try {
                [result] = await visionClient.textDetection(buffer);
            } catch (err: any) {
                console.error("Vision API Error:", err);
                return NextResponse.json({ error: 'El servicio de reconocimiento está saturado o falló. Intenta de nuevo en unos segundos.' }, { status: 503 });
            }

            const fullText = result.fullTextAnnotation?.text || '';
            
            if (!fullText || fullText.length < 20) {
                return NextResponse.json({ error: 'No se pudo leer el documento. Asegúrate de capturar bien todo el frente del DNI con buena luz.' }, { status: 400 });
            }

            const extractedData = extractArgentineDNIData(fullText);
            
            if (!extractedData.fullName) {
                return NextResponse.json({ 
                    error: 'No pudimos identificar tu nombre. Intenta con una foto más clara enfocando los campos NOMBRE y APELLIDO.',
                    raw: fullText.substring(0, 200)
                }, { status: 400 });
            }

            return NextResponse.json({ 
                success: true, 
                fullName: extractedData.fullName,
                firstName: extractedData.firstName,
                lastName: extractedData.lastName,
                dniNumber: extractedData.dniNumber,
                dob: extractedData.dob,
                nationality: extractedData.nationality
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

        if (!adminDb) throw new Error("Firestore Admin not initialized");

        const dniNumberInput = (formData.get('dniNumber') as string || '').replace(/\D/g, '');

        // 1. User Application Check (Same user applying again)
        const userAppRes = await adminDb.collection('rider_applications')
            .where('userId', '==', uid)
            .limit(1)
            .get();
        
        if (!userAppRes.empty) {
            const app = userAppRes.docs[0].data();
            if (app.status === 'pending') {
                return NextResponse.json({ error: 'Ya tienes una solicitud de Rider en revisión. Por favor espera a que sea validada.' }, { status: 400 });
            } else if (app.status === 'approved') {
                return NextResponse.json({ error: 'Tu cuenta ya está activa como Rider. Redirigiendo...', redirect: '/rider' }, { status: 400 });
            }
        }

        // 2. Global DNI Uniqueness Check (Another user with same DNI)
        if (dniNumberInput) {
            const globalDniRes = await adminDb.collection('rider_applications')
                .where('dniNumber', '==', dniNumberInput)
                .limit(1)
                .get();
            
            if (!globalDniRes.empty) {
                const otherApp = globalDniRes.docs[0].data();
                if (otherApp.userId !== uid) {
                   return NextResponse.json({ 
                       error: 'Este número de DNI ya está registrado en nuestro sistema. Si crees que es un error, contacta a soporte.', 
                       code: 'DUPLICATE_DNI' 
                   }, { status: 400 });
                }
            }
        }

        const dniBuffer = Buffer.from(await dniFile.arrayBuffer());
        const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());

        // Drive Upload (Robust Folder Selection)
        const parentFolderId = process.env.GOOGLE_DRIVE_RIDER_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (!parentFolderId) {
            throw new Error('Configuración de carpeta de Drive faltante: GOOGLE_DRIVE_RIDER_FOLDER_ID');
        }
        
        console.log(`[KYC API] Uploading documents to Drive folder: ${parentFolderId}`);

        let dniUpload, selfieUpload;
        try {
            [dniUpload, selfieUpload] = await Promise.all([
                uploadFileToDrive(dniBuffer, `DNI_${uid}_${Date.now()}.jpg`, 'image/jpeg', parentFolderId),
                uploadFileToDrive(selfieBuffer, `SELFIE_${uid}_${Date.now()}.jpg`, 'image/jpeg', parentFolderId)
            ]);
        } catch (driveErr: any) {
            console.error('[KYC API] Drive Upload Failed:', driveErr.message);
            return NextResponse.json({ 
                error: `Error de almacenamiento: ${driveErr.message}`,
                code: 'DRIVE_UPLOAD_FAILED'
            }, { status: 502 }); // Bad Gateway / External service error
        }

        if (!adminDb) throw new Error("Firestore Admin not initialized");
        const userRef = adminDb.collection('users').doc(uid);
        const appRef = adminDb.collection('rider_applications').doc();

        const batch = adminDb.batch();
        batch.update(userRef, {
            photoURL: selfieUpload.contentLink,
            role: 'rider_pending',
            kycVerifiedAt: new Date(),
            updatedAt: new Date()
        });

        batch.set(appRef, {
            id: appRef.id,
            userId: uid,
            firstName: formData.get('firstName') || '',
            lastName: formData.get('lastName') || '',
            dniNumber: dniNumberInput,
            dob: formData.get('dob') || '',
            nationality: formData.get('nationality') || '',
            isManualVerification: formData.get('isManualVerification') === 'true',
            dniUrl: dniUpload.url,
            selfieUrl: selfieUpload.contentLink,
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

        // 3. Sync Firebase Auth Profile (Centralized)
        try {
            await adminAuth.updateUser(uid, {
                photoURL: selfieUpload.contentLink
            });
            console.log(`[KYC API] Auth profile synced for user ${uid}`);
        } catch (authSyncError) {
            console.error('[KYC API] Failed to sync Auth profile photo:', authSyncError);
            // Non-blocking but logged
        }

        return NextResponse.json({ success: true, redirect: '/rider' });

    } catch (error: any) {
        console.error('KYC_ROUTE_ERROR:', error);
        // Special handle for known error types to avoid "Oops" generic page
        const message = error.message || 'Error inesperado en el servidor';
        const status = error.status || 500;
        
        return NextResponse.json({ 
            error: message,
            code: error.code || 'UNKNOWN_ERROR'
        }, { status });
    }
}

function idTokenFromHeader(header: string) {
    return header.split('Bearer ')[1];
}

/**
 * Heuristic to extract Name, Surname and DNI Number from Argentine DNI using anchors
 * Rules:
 * - APELLIDO/S followed by surname
 * - NOMBRE/S followed by given names
 * - DOCUMENTO Nº followed by 8 digits
 */
function extractArgentineDNIData(text: string) {
    const lines = text.toUpperCase().split('\n').map(l => l.trim()).filter(l => l.length > 1);
    
    // Anchors for Argentine DNI (including combined labels for vertical structure)
    const surnameAnchors = ['APELLIDO/SURNAME', 'APELLIDO', 'APELLIDOS', 'SURNAME', 'SURNAMES'];
    const nameAnchors = ['NOMBRE/NAME', 'NOMBRES/NAME', 'NOMBRE', 'NOMBRES', 'NAME', 'GIVEN NAME', 'GIVEN NAMES'];
    const dniAnchors = [
        'DOCUMENTO/DOCUMENT', 'DOCUMENTO', 'DOCUMENT', 'DNI', 'N°', 'NRO', 'NÚMERO', 
        'DOCUMENTO NACIONAL DE IDENTIDAD', 'NATIONAL IDENTITY CARD', 'NUMERO DE DOCUMENTO',
        'OPCUMENTO', 'OCUMENTO', 'DUCUMENTO' // Fuzzy misreads emergency addition
    ];
    const dobAnchors = ['FECHA DE NACIMIENTO', 'FECHA NACIMIENTO', 'DATE OF BIRTH', 'FECHA DE EMISION'];
    const natAnchors = ['NACIONALIDAD', 'NATIONALITY'];
    const skipList = [
        'SEXO', 'SEX', 'NACIONALIDAD', 'FECHA', 'REPUBLICA', 'EJEMPLAR', 
        'SURNAME', 'NAME', 'GIVEN', 'DOCUMENTO', 'DOCUMENT', 'OPCUMENTO', 'OCUMENTO'
    ];

    let lastName = '';
    let firstName = '';

    const findAnchorIndex = (anchors: string[]) => {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Strict whole-word matching to avoid confusion (like SURNAME containing NAME)
            const matched = anchors.some(a => {
                const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escaped}\\b`, 'i');
                return regex.test(line);
            });
            if (matched) return i;
        }
        return -1;
    };

    const surnameIdx = findAnchorIndex(surnameAnchors);
    const nameIdx = findAnchorIndex(nameAnchors);
    const dniIdx = findAnchorIndex(dniAnchors);
    const dobIdx = findAnchorIndex(dobAnchors);
    const natIdx = findAnchorIndex(natAnchors);

    // Technique: Extract text between anchors
    const extractBetween = (startIdx: number, endIdx: number) => {
        if (startIdx === -1) return '';
        // If endIdx is -1 or before startIdx, look at next 2 lines
        const end = (endIdx !== -1 && endIdx > startIdx) ? endIdx : startIdx + 3;
        
        let result = '';
        for (let i = startIdx + 1; i < Math.min(end, lines.length); i++) {
            const line = lines[i];
            // Stop if we hit another known field label that wasn't the target endIdx
            const isAnyLabel = [...surnameAnchors, ...nameAnchors, ...dniAnchors, ...skipList].some(a => {
                const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escaped}\\b`, 'i');
                return regex.test(line);
            });
            // Extra Safety: Stop if line contains a DNI-like pattern (even without label)
            if (line.match(/\d{2}[\.\s]?\d{3}[\.\s]?\d{3}/) && i > startIdx + 1) break;
            
            // Stop if line contains misread document labels
            if (/OPCUMENTO|OCUMENTO|DUCUMENTO|COCAINE|DNI/i.test(line) && i > startIdx + 1) break;

            const cleanLine = line.replace(/[:;]/g, '').trim();
            if (cleanLine.length > 1) {
                result += (result ? ' ' : '') + cleanLine;
            }
        }
        return result;
    };

    lastName = extractBetween(surnameIdx, nameIdx);
    firstName = extractBetween(nameIdx, dniIdx);
    
    // Improved DOB Extraction with Strict Label Guard & Regex
    let dobRaw = extractBetween(dobIdx, natIdx);
    const dateRegex = /\b\d{2}[-/\s](?:\d{2}|[A-Z]{3})[-/\s]\d{4}\b/; 
    
    const isInvalidLine = (l: string) => /DOCUMENTO|DOCUMENT|DNI|N[ÚU]MERO/i.test(l);

    if (!dateRegex.test(dobRaw) || isInvalidLine(dobRaw)) {
        if (dobIdx !== -1) {
            for (let i = 0; i < 4; i++) {
                const line = lines[dobIdx + i];
                // Strict check: Must match date pattern AND NOT contain DNI keywords
                if (line && dateRegex.test(line) && !isInvalidLine(line)) {
                    dobRaw = line;
                    break;
                }
            }
        }
    }
    
    // Final check: If it contains DNI keywords, it's definitely not DOB
    if (isInvalidLine(dobRaw)) dobRaw = '';

    // Advanced cleaning for DOB (Bulletproof Reconstruction Strategy)
    const monthMap: { [key: string]: string } = {
        'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04', 'MAY': '05', 'JUN': '06',
        'JUL': '07', 'AGO': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12'
    };

    let dobNum = '';
    // Optimized Regex: Day - Month (2 digits or 3 letters, potentially repeated) - Year
    const strictDateMatch = dobRaw.match(/\b(\d{1,2})[-/\s]+(?:[A-Z]{3}|\d{1,2})(?:[-/\s]+[A-Z]{3})?[-/\s]+(\d{4})\b/i);
    
    if (strictDateMatch) {
        const day = strictDateMatch[1].padStart(2, '0');
        // Find the month part (it could be capture 2 or 3 depending on OCR noise)
        // We look for any text in the matched sequence that matches our monthMap
        const rawSeq = strictDateMatch[0].toUpperCase();
        let month = '01';
        for (const [key, val] of Object.entries(monthMap)) {
            if (rawSeq.includes(key)) {
                month = val;
                break;
            }
        }
        const year = strictDateMatch[2];
        dobNum = `${day}/${month}/${year}`;
    }

    // Secondary safety cleanup if reconstruction failed
    let dob = dobNum || dobRaw.split(/FECHA|EMISION|DATE|ISSUE|FEDIA/i)[0]
        .replace(/\//g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    if (!dobNum && dob.split(' ').length >= 3) {
        const parts = dob.split(' ');
        const day = parts[0].padStart(2, '0');
        const monthTxt = parts[1].toUpperCase();
        const month = monthMap[monthTxt] || monthMap[monthTxt.substring(0, 3)] || parts[1].padStart(2, '0');
        const year = parts[parts.length - 1].substring(0, 4);
        if (day.match(/^\d+$/) && year.match(/^\d+$/)) {
            dob = `${day}/${month}/${year}`;
        }
    } else if (dobNum) {
        dob = dobNum;
    }

    let nationality = extractBetween(natIdx, -1); 
    if (nationality.length > 20) nationality = nationality.split(' ')[0]; // Basic truncation for clean data

    // Fallback to vertical strategy if regions are empty
    const findValueFallback = (anchors: string[]) => {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const matchingAnchor = anchors.find(a => line.includes(a));
            if (matchingAnchor) {
                const nextLine = lines[i + 1];
                if (nextLine && nextLine.length > 2 && ![...surnameAnchors, ...nameAnchors, ...dniAnchors].some(a => nextLine.includes(a))) {
                    return nextLine.replace(/[:;]/g, '').trim();
                }
            }
        }
        return '';
    };

    if (!lastName) lastName = findValueFallback(surnameAnchors);
    if (!firstName) firstName = findValueFallback(nameAnchors);

    // DNI Number Extraction
    let dniNumber = '';
    
    // Strategy for DNI: Look for a clean 7-8 digit block in neighborhood
    if (dniIdx !== -1) {
        for (let j = 0; j <= 2; j++) {
            const line = lines[dniIdx + j];
            if (!line) continue;
            
            // Clean common OCR noise like dots or letters in the DNI number
            const cleanCandidate = line.replace(/[^0-9\s\.-]/g, '');
            // Look for exactly 7-8 digits in a row (ignoring dots/spaces)
            const matches = cleanCandidate.replace(/[\.\s-]/g, '').match(/\d{7,8}/);
            
            if (matches) {
                dniNumber = matches[0];
                // Ultra-Precision: If length is 9 and starts with '1', it's likely the hologram noise
                if (dniNumber.length === 9 && dniNumber.startsWith('1')) {
                    dniNumber = dniNumber.substring(1);
                }
                break;
            }
        }
    }

    // Global DNI Fallback: Search the whole text for any 7-8 digit sequence
    if (!dniNumber) {
        const matches = text.replace(/[\.\s-]/g, '').match(/\d{7,9}/g);
        if (matches) {
            dniNumber = matches[0];
            if (dniNumber.length === 9 && dniNumber.startsWith('1')) {
                dniNumber = dniNumber.substring(1);
            }
        }
    }

    // Fallback if no anchor: just find any 8 digit number in text
    if (!dniNumber) {
        const matches = text.match(/\b\d{8}\b/g);
        if (matches && matches.length > 0) dniNumber = matches[0];
    }

    // Clear label noise from extracted values
    const clean = (val: string) => {
        // Strict word blacklist to prevent offensive holograms/misreads
        const blackListWords = ['OPCUMENTO', 'OCUMENTO', 'COCAINE', 'FEDE', 'EMISION', 'GIVEN'];
        
        let cleaned = val
            .replace(/APELLIDO|SURNAME|NOMBRE|NAME|N[UÚ]MERO|DOCUMENTO|DOCUMENT|DNI/gi, '')
            .replace(/[^A-ZÁÉÍÓÚÑ\s]/gi, '')
            .replace(/\s+/g, ' ')
            .trim();

        // High-Precision filter: remove any remaining blacklisted words
        return cleaned.split(' ')
            .filter(word => !blackListWords.includes(word.toUpperCase()))
            .join(' ');
    };

    return {
        firstName: clean(firstName),
        lastName: clean(lastName),
        fullName: clean(`${firstName} ${lastName}`),
        dniNumber: dniNumber.replace(/\D/g, ''),
        dob: dob.trim(),
        nationality: clean(nationality)
    };
}
