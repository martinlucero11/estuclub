import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import path from 'path';

/**
 * API Route to upload a student certificate to Google Drive using a Service Account.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const dni = formData.get('dni') as string;
    const type = formData.get('type') as string; // 'rostro', 'vehiculo', or 'certificado'

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 });
    }

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      return NextResponse.json({ error: 'Server configuration error: Missing Folder ID' }, { status: 500 });
    }

    // Initialize Auth with Service Account
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'service-account.json'),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Convert File to Buffer/Stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // Dynamic Renaming based on type or generic
    const extension = file.name.split('.').pop();
    const fileName = type 
        ? `${type.toUpperCase()}_${firstName}_${lastName}_${dni}.${extension}`
        : `DOC_${firstName}_${lastName}_${dni}.${extension}`;

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: file.type,
      body: stream,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    return NextResponse.json({
      fileId: response.data.id,
      webViewLink: response.data.webViewLink
    });

  } catch (error: any) {
    console.error('Error uploading to Google Drive:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
