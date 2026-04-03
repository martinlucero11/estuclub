import { google } from 'googleapis';
import { Readable } from 'stream';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
    version: 'v3',
    auth: oauth2Client,
});

/**
 * Uploads a file to Google Drive
 * @param file The file object (from Buffer)
 * @param filename Desired filename
 * @param parentFolderId The Google Drive folder ID
 * @returns The webViewLink of the uploaded file
 */
export async function uploadFileToDrive(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    parentFolderId: string
) {
    try {
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

        // Set permissions to anyone with link can view (Optional, depending on user needs)
        await drive.permissions.create({
            fileId: response.data.id!,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        return {
            id: response.data.id,
            url: response.data.webViewLink,
        };
    } catch (error) {
        console.error('Error uploading to Google Drive:', error);
        throw error;
    }
}

