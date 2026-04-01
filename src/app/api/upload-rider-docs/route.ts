import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';

/**
 * API Route to upload Rider documents to Google Drive.
 * Creates a folder RIDER_[DNI]_[APELLIDO] and uploads face + vehicle photos.
 * Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_DRIVE_FOLDER_ID
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

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!clientId || !clientSecret || !refreshToken || !parentFolderId) {
      console.error('Missing Google Drive credentials');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 1. Create folder: RIDER_[DNI]_[APELLIDO]
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
      return NextResponse.json({ error: 'Failed to create Drive folder' }, { status: 500 });
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
