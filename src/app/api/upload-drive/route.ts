export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { uploadFileToDrive, ensureFolderExists } from '@/lib/google-drive';

/**
 * API Maestra de Subida a Google Drive
 * Soporta estructuración jerárquica para Clubers.
 */
export async function POST(req: NextRequest) {
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        // 1. Verificar Identidad
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const { uid } = decodedToken;

        // 2. Parsear Datos
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const category = formData.get('folder') as string || 'General'; // e.g. 'cluber', 'rider'
        const subfolderName = formData.get('subfolder') as string || ''; // e.g. 'products', 'logos'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${uid}_${Date.now()}_${file.name}`;
        const mimeType = file.type;

        // 3. Resolución de Carpeta de Destino
        let destinationFolderId = '';

        // Mapeo Base desde Environment
        const BASE_FOLDER_MAP: Record<string, string | undefined> = {
            'rider': process.env.GOOGLE_DRIVE_RIDER_FOLDER_ID,
            'cluber': process.env.GOOGLE_DRIVE_CLUBER_FOLDER_ID,
            'deliveries': process.env.GOOGLE_DRIVE_DELIVERIES_FOLDER_ID,
            'student': process.env.GOOGLE_DRIVE_FOLDER_ID,
        };

        const rootParentId = BASE_FOLDER_MAP[category] || process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (!rootParentId) {
            throw new Error(`Configuración de carpeta base no encontrada para: ${category}`);
        }

        // Lógica Especial para Clubers (Subcarpetas por UID)
        if (category === 'cluber') {
            const supplierDoc = await adminDb!.collection('roles_supplier').doc(uid).get();
            const supplierData = supplierDoc.data();
            
            let cluberRootId = supplierData?.driveFolderId;

            // Si no tiene carpeta, la creamos ahora (on-demand)
            if (!cluberRootId) {
                const folderName = `${supplierData?.name || 'Cluber'}_${uid}`;
                const result = await ensureFolderExists(folderName, rootParentId);
                if (result.success) {
                    cluberRootId = result.id;
                    // Persistir el ID para futuras subidas sin fallar si el doc no existe aún
                    await adminDb!.collection('roles_supplier').doc(uid).set({ driveFolderId: cluberRootId }, { merge: true });
                } else {
                    throw new Error("No se pudo inicializar la carpeta del Cluber en Drive.");
                }
            }

            // Si se solicita una subcarpeta (ej: 'products'), asegurar que existe bajo el root del cluber
            if (subfolderName) {
                const subResult = await ensureFolderExists(subfolderName, cluberRootId);
                destinationFolderId = subResult.id;
            } else {
                destinationFolderId = cluberRootId;
            }
        } else {
            // Para otras categorías (rider, deliveries), usar la carpeta global
            destinationFolderId = rootParentId;
        }


        // 4. Ejecutar Subida
        const result = await uploadFileToDrive(buffer, filename, mimeType, destinationFolderId);

        return NextResponse.json({ 
            success: true, 
            id: result?.id, 
            url: result?.url,
            contentLink: result?.contentLink
        });

    } catch (error: any) {
        console.error('CRITICAL API DRIVE UPLOAD ERROR:', error.message);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
