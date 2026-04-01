import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import path from 'path';

/**
 * API Route to upload Rider documents to Google Drive using a Service Account.
 * Creates a folder RIDER_[DNI]_[APELLIDO] and uploads face + vehicle photos.
 */
async function bufferToStream(buffer: Buffer): Promise<Readable> {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fotoRostro = formData.get('fotoRostro') as File;
    const fotoVehiculo = formData.get('fotoVehiculo') as File;
    const userId = formData.get('userId') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const dni = formData.get('dni') as string;

    if (!userId || !dni) {
      return NextResponse.json({ error: 'Missing userId or dni' }, { status: 400 });
    }

    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!parentFolderId) {
      return NextResponse.json({ error: 'Server configuration error: Missing Parent Folder ID' }, { status: 500 });
    }

    // Initialize Auth with Service Account
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'service-account.json'),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 1. Create sub-folder: RIDER_[DNI]_[APELLIDO]
    const folderName = `RIDER_${dni}_${lastName.toUpperCase()}`;
    const folderRes = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id',
    });

    const folderId = folderRes.data.id;
    if (!folderId) {
      throw new Error('Failed to create Drive folder');
    }

    let fotoRostroLink = '';
    let fotoVehiculoLink = '';

    // 2. Upload face photo
    if (fotoRostro) {
      const buffer = Buffer.from(await fotoRostro.arrayBuffer());
      const ext = fotoRostro.name.split('.').pop() || 'jpg';
      const stream = await bufferToStream(buffer);

      const res = await drive.files.create({
        requestBody: {
          name: `ROSTRO_${dni}.${ext}`,
          parents: [folderId],
        },
        media: { mimeType: fotoRostro.type, body: stream },
        fields: 'id, webViewLink',
      });
      fotoRostroLink = res.data.webViewLink || '';
    }

    // 3. Upload vehicle photo
    if (fotoVehiculo) {
      const buffer = Buffer.from(await fotoVehiculo.arrayBuffer());
      const ext = fotoVehiculo.name.split('.').pop() || 'jpg';
      const stream = await bufferToStream(buffer);

      const res = await drive.files.create({
        requestBody: {
          name: `VEHICULO_${dni}.${ext}`,
          parents: [folderId],
        },
        media: { mimeType: fotoVehiculo.type, body: stream },
        fields: 'id, webViewLink',
      });
      fotoVehiculoLink = res.data.webViewLink || '';
    }

    return NextResponse.json({
      folderId,
      folderName,
      fotoRostroLink,
      fotoVehiculoLink,
    });

  } catch (error: any) {
    console.error('Error uploading rider docs:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
