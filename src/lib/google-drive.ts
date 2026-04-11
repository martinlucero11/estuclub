import { google } from 'googleapis';
import { Readable } from 'stream';

/**
 * Robust authentication client for Google Drive API.
 * Uses Service Account credentials to leverage shared folder permissions.
 */
export async function getDriveClient() {
    // 1. Try GOOGLE_VISION_CREDENTIALS first (centralized)
    const visionCreds = process.env.GOOGLE_VISION_CREDENTIALS;
    const firebaseAdminCreds = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    let credentials;
    try {
        if (visionCreds) {
            credentials = JSON.parse(visionCreds);
        } else if (firebaseAdminCreds) {
            credentials = JSON.parse(Buffer.from(firebaseAdminCreds, 'base64').toString('utf-8'));
        }
    } catch (e) {
        console.error('[DRIVE AUTH] Failed to parse Service Account credentials:', e);
    }

    if (credentials) {
        console.log('[DRIVE AUTH] Initializing via Service Account (Shared Email)');
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
        });
        return google.drive({ version: 'v3', auth });
    }

    // 2. Fallback to OAuth2 (Legacy/Local Dev)
    console.warn('[DRIVE AUTH] Falling back to OAuth2 Refresh Token');
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('CONFIGURACIÓN FALTANTE: No hay Service Account ni tokens OAuth2.');
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Uploads a file to Google Drive and sets public permissions
 */
export async function uploadFileToDrive(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    parentFolderId: string
) {
    try {
        console.log(`[DRIVE] Starting centralized upload for ${filename}`);

        const drive = await getDriveClient();

        // Create Readable Stream from Buffer
        const bufferStream = new Readable();
        bufferStream.push(fileBuffer);
        bufferStream.push(null);

        const response = await drive.files.create({
            requestBody: {
                name: filename,
                parents: [parentFolderId],
            },
            media: {
                mimeType,
                body: bufferStream,
            },
            fields: 'id, webViewLink, webContentLink',
        });

        const fileId = response.data.id;
        if (!fileId) {
            console.error('[DRIVE LIB] API did not return a file ID');
            throw new Error('Drive API did not return a file ID');
        }

        console.log(`[DRIVE LIB] File created successfully. ID: ${fileId}`);

        // MANDATORY: Set permissions to anyone with link can view
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        console.log('[DRIVE LIB] Permissions set to public:reader');

        // Re-fetch to get links after permission change
        const fileMetadata = await drive.files.get({
            fileId: fileId,
            fields: 'id, webViewLink, webContentLink',
        });

        console.log(`[DRIVE LIB] Final URL: ${fileMetadata.data.webViewLink}`);

        return {
            id: fileId,
            url: fileMetadata.data.webViewLink,
            contentLink: fileMetadata.data.webContentLink
        };
    } catch (error: any) {
        console.error('CENTRAL DRIVE UPLOAD ERROR:', error.message);
        throw error;
    }
}


