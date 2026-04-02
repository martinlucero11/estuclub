export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { admin, firestore } from '@/firebase/server-config';

/**
 * API Route to clean up Auth users that do not have a corresponding Firestore profile.
 * Restricted to Admins only.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const confirm = searchParams.get('confirm') === 'true';

    // 1. Verify Admin Status (via Token)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Check if roles_admin document exists for this user
    const adminDoc = await firestore.collection('roles_admin').doc(decodedToken.uid).get();
    if (!adminDoc.exists) {
      return NextResponse.json({ error: 'Permisos insuficientes. Se requiere ser Administrador.' }, { status: 403 });
    }

    // 2. Fetch all Auth users
    const listUsersResult = await admin.auth().listUsers(1000);
    const authUsers = listUsersResult.users;

    const results = {
      totalAuthUsers: authUsers.length,
      zombiesIdentified: [] as string[],
      deletedCount: 0,
      errors: [] as string[],
    };

    // 3. Cross-reference with Firestore
    const batchSize = 10; // Process in small batches to avoid hitting Firestore limits or timeouts
    for (let i = 0; i < authUsers.length; i += batchSize) {
      const batch = authUsers.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (user) => {
        try {
          const userDoc = await firestore.collection('users').doc(user.uid).get();
          
          if (!userDoc.exists) {
            results.zombiesIdentified.push(`${user.email} (${user.uid})`);
            
            if (confirm) {
              await admin.auth().deleteUser(user.uid);
              results.deletedCount++;
            }
          }
        } catch (err: any) {
          results.errors.push(`Error checking user ${user.uid}: ${err.message}`);
        }
      }));
    }

    return NextResponse.json({
      message: confirm ? 'Limpieza completada' : 'Simulación de limpieza completada',
      summary: {
        totalAuthUsers: results.totalAuthUsers,
        zombiesFound: results.zombiesIdentified.length,
        deleted: results.deletedCount,
      },
      zombies: results.zombiesIdentified,
      errors: results.errors
    });

  } catch (error: any) {
    console.error('Error in cleanup API:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
