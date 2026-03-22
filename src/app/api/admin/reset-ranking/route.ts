import { NextResponse } from 'next/server';
import { firestore } from '@/firebase/server-config';

export async function POST() {
  try {
    const usersSnapshot = await firestore.collection('users').get();
    
    if (usersSnapshot.empty) {
      return NextResponse.json({ message: 'No hay usuarios para resetear.', updated: 0 });
    }

    const batch = firestore.batch();
    let count = 0;

    usersSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { points: 0 });
      count++;
    });

    await batch.commit();

    return NextResponse.json({ 
      message: `Ranking reseteado. ${count} usuarios actualizados a 0 puntos.`,
      updated: count 
    });
  } catch (error) {
    console.error('Error resetting ranking:', error);
    return NextResponse.json(
      { error: 'Error al resetear el ranking.' },
      { status: 500 }
    );
  }
}
