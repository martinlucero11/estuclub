const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteCollection(collectionPath) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();
  
  if (snapshot.size === 0) {
    console.log(`Colección ${collectionPath} ya está vacía.`);
    return;
  }

  console.log(`Borrando ${snapshot.size} documentos de la colección ${collectionPath}...`);
  // Nota: limitamos para no superar límite de deletes, si hay más de 500 hay que iterar.
  const batches = [];
  let batch = db.batch();
  let count = 0;
  
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    count++;
    if (count === 490) {
      batches.push(batch.commit());
      batch = db.batch();
      count = 0;
    }
  });
  
  if (count > 0) {
    batches.push(batch.commit());
  }
  
  await Promise.all(batches);
  console.log(`Colección ${collectionPath} borrada exitosamente.`);
}

async function main() {
  // Agrega aquí todas las colecciones que contienen datos de prueba que necesitan borrarse.
  const collections = [
    'roles_supplier',
    'products',
    'benefits',
    'services',
    'appointments',
    'announcements',
    'orders',
    'benefit_redemptions'
  ];

  for (const col of collections) {
    await deleteCollection(col);
  }
  
  console.log('Todos los datos de prueba han sido borrados de Firestore.');
}

main().catch(console.error);
