import * as admin from 'firebase-admin';

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return {
      projectId: parsed.project_id || parsed.projectId,
      clientEmail: parsed.client_email || parsed.clientEmail,
      privateKey: (parsed.private_key || parsed.privateKey)?.replace(/\\n/g, '\n')
    };
  } catch (e) { return null; }
}

if (!admin.apps.length) {
  const cert = getServiceAccount();
  if (cert && cert.projectId) {
    admin.initializeApp({ credential: admin.credential.cert(cert) });
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null;