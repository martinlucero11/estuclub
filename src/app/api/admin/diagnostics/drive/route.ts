import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient, validateFolderAccess, uploadFileToDrive, ensureFolderExists } from '@/lib/google-drive';

/**
 * Maestro de Diagnóstico de Google Drive (ADMIN)
 * Verifica las 4 carpetas críticas y la capacidad de jerarquía para Clubers.
 */
export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    console.log('--- [DRIVE DIAGNOSTIC MASTER] STARTING ---');

    try {
        // 1. Verificar Cliente
        await getDriveClient();

        // 2. Definir Carpetas a Validar
        const foldersToTest = [
            { id: process.env.GOOGLE_DRIVE_RIDER_FOLDER_ID, name: 'RIDERS', env: 'GOOGLE_DRIVE_RIDER_FOLDER_ID' },
            { id: process.env.GOOGLE_DRIVE_FOLDER_ID, name: 'GENERAL', env: 'GOOGLE_DRIVE_FOLDER_ID' },
            { id: process.env.GOOGLE_DRIVE_CLUBER_FOLDER_ID, name: 'CLUBERS_ROOT', env: 'GOOGLE_DRIVE_CLUBER_FOLDER_ID' },
            { id: process.env.GOOGLE_DRIVE_DELIVERIES_FOLDER_ID, name: 'DELIVERIES', env: 'GOOGLE_DRIVE_DELIVERIES_FOLDER_ID' }
        ];

        const report: any = {
            timestamp,
            status: 'HEALTHY',
            folders: [],
            hierarchy_test: null
        };

        for (const folder of foldersToTest) {
            const folderReport: any = {
                name: folder.name,
                env_var: folder.env,
                id: folder.id || 'MISSING',
                status: 'OK'
            };

            if (!folder.id) {
                folderReport.status = 'MISSING_CONFIG';
                report.status = 'DEGRADED';
                report.folders.push(folderReport);
                continue;
            }

            try {
                // A. Test Metadatos (Opcional, no bloqueante)
                const meta = await validateFolderAccess(folder.id);
                folderReport.metadata = meta.success ? 'ACCESSIBLE' : 'RESTRICTED';
                folderReport.drive_name = meta.name || 'Unknown';

                // B. Smoke Test (Upload) - ESTO ES LO CRÍTICO
                const content = `Diagnostic Smoke Test - ${folder.name} - ${timestamp}`;
                const filename = `smoke_${folder.name.toLowerCase()}_${Date.now()}.txt`;
                
                const upload = await uploadFileToDrive(
                    Buffer.from(content),
                    filename,
                    'text/plain',
                    folder.id
                );

                folderReport.upload_test = {
                    success: upload.success,
                    file_id: upload.id,
                    link: upload.contentLink
                };

                if (!upload.success) {
                    folderReport.status = 'UPLOAD_FAILED';
                    report.status = 'DEGRADED';
                }

                // C. Test de Jerarquía (Solo en CLUBERS_ROOT)
                if (folder.name === 'CLUBERS_ROOT' && upload.success) {
                    console.log('[DIAGNOSTIC] Testing Hierarchy Logic...');
                    const subfolderName = `Diagnostic_Deep_Test_${Date.now()}`;
                    const ensureResult = await ensureFolderExists(subfolderName, folder.id);
                    
                    if (ensureResult.success) {
                        const deepUpload = await uploadFileToDrive(
                            Buffer.from(`Subfolder binary test - ${timestamp}`),
                            `deep_test.txt`,
                            'text/plain',
                            ensureResult.id
                        );
                        
                        report.hierarchy_test = {
                            success: deepUpload.success,
                            folder_name: subfolderName,
                            folder_id: ensureResult.id,
                            file_id: deepUpload.id
                        };
                    } else {
                        report.hierarchy_test = { success: false, error: ensureResult.error };
                        report.status = 'DEGRADED';
                    }
                }

            } catch (err: any) {
                folderReport.status = 'ERROR';
                folderReport.error = err.message;
                report.status = 'DEGRADED';
            }

            report.folders.push(folderReport);
        }

        report.duration_ms = Date.now() - startTime;
        return NextResponse.json(report);

    } catch (error: any) {
        console.error('--- [DRIVE DIAGNOSTIC MASTER] CRITICAL ERROR ---', error);
        return NextResponse.json({
            timestamp,
            status: 'CRITICAL_ERROR',
            error: error.message,
            duration_ms: Date.now() - startTime
        }, { status: 500 });
    }
}
