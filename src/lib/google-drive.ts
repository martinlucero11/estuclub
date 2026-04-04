import { google } from 'googleapis';
import { Readable } from 'stream';
import path from 'path';

// Initialize Auth with Service Account for better reliability
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.metadata'],
});

const drive = google.drive({
    version: 'v3',
    auth,
});

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
        console.log(`[DRIVE] Starting upload for ${filename} to folder ${parentFolderId}`);

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

        console.log(`[DRIVE] File created with ID: ${fileId}. Setting public permissions...`);

        // MANDATORY: Set permissions to anyone with link can view
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        // Re-fetch to get links after permission change (sometimes needed for fresh links)
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
        console.error('CRITICAL DRIVE UPLOAD ERROR:', {
            message: error.message,
            code: error.code,
            errors: error.errors
        });
        throw error;
    }
}

