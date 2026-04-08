import { google } from 'googleapis';
import { Readable } from 'stream';

/**
 * Robust authentication client for Google Drive API.
 * Uses OAuth2 Refresh Token to bypass clock-skew issues on local dev.
 */
export async function getDriveClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('CONFIGURACIÓN FALTANTE: GOOGLE_CLIENT_ID, SECRET or REFRESH_TOKEN');
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // Validate token immediately
    try {
        await oauth2Client.getAccessToken();
    } catch (e: any) {
        console.error('GOOGLE_DRIVE_AUTH_CENTRAL_ERROR:', e.message);
        throw new Error(`Error de autenticación: ${e.message}`);
    }

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
        if (!fileId) throw new Error('Drive API did not return a file ID');

        // MANDATORY: Set permissions to anyone with link can view
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        // Re-fetch to get links after permission change
        const fileMetadata = await drive.files.get({
            fileId: fileId,
            fields: 'id, webViewLink, webContentLink',
        });

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


