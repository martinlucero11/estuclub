import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { getDriveClient } from '@/lib/google-drive';

/**
 * API Route to upload a student certificate to Google Drive using Centralized Auth.
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
      return NextResponse.json({ error: 'Configuración faltante: Folder ID' }, { status: 500 });
    }

    // Use Centralized Auth
    const drive = await getDriveClient();

    // Convert File to Stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // Dynamic Renaming
    const extension = file.name.split('.').pop();
    const cleanFileName = `${type?.toUpperCase() || 'CERTIFICADO'}_${firstName}_${lastName}_${dni}.${extension}`;

    const metadata = {
      name: cleanFileName,
      parents: [folderId],
    };

    const media = {
      mimeType: file.type,
      body: stream,
    };

    const response = await drive.files.create({
      requestBody: metadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    const fileId = response.data.id!;

    // Mandatory: Set view permissions
    await drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    const fileMeta = await drive.files.get({ fileId, fields: 'webViewLink, webContentLink' });

    return NextResponse.json({
      fileId: fileId,
      webViewLink: fileMeta.data.webViewLink,
      webContentLink: fileMeta.data.webContentLink
    });

  } catch (error: any) {
    console.error('STUDENT_UPLOAD_FAILED:', error.message);
    return NextResponse.json({ 
        error: error.message || 'Error en el servicio de Drive',
        code: error.code || 'UNKNOWN'
    }, { status: 500 });
  }
}





