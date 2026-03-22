'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, getDocs, query, where, doc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function MigrateRatingsPage() {
    const firestore = useFirestore();
    const { roles } = useUser();
    const [status, setStatus] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    if (!roles.includes('admin')) {
        return <p className="p-8 text-center text-muted-foreground">Acceso denegado.</p>;
    }

    const runMigration = async () => {
        setIsRunning(true);
        setStatus('Obteniendo proveedores...');
        try {
            const suppliersSnap = await getDocs(collection(firestore, 'roles_supplier'));
            const total = suppliersSnap.size;
            let updated = 0;

            // Process in batches of 10 to avoid overwhelming Firestore
            const suppliers = suppliersSnap.docs;
            for (let i = 0; i < suppliers.length; i += 10) {
                const batch = writeBatch(firestore);
                const chunk = suppliers.slice(i, i + 10);

                for (const supplierDoc of chunk) {
                    const supplierId = supplierDoc.id;
                    const reviewsSnap = await getDocs(
                        query(collection(firestore, 'reviews'), where('supplierId', '==', supplierId))
                    );

                    const reviewCount = reviewsSnap.size;
                    let avgRating = 0;
                    if (reviewCount > 0) {
                        const totalRating = reviewsSnap.docs.reduce((acc, r) => acc + (r.data().rating || 0), 0);
                        avgRating = totalRating / reviewCount;
                    }

                    batch.update(doc(firestore, 'roles_supplier', supplierId), {
                        avgRating,
                        reviewCount,
                    });
                    updated++;
                }

                await batch.commit();
                setStatus(`Procesados ${updated} de ${total} proveedores...`);
            }

            setStatus(`✅ Migración completada. ${updated} proveedores actualizados.`);
        } catch (error: any) {
            console.error('Migration error:', error);
            setStatus(`❌ Error: ${error.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto p-8 space-y-6">
            <h1 className="text-2xl font-bold">Migrar Ratings</h1>
            <p className="text-muted-foreground text-sm">
                Este script calcula el promedio de calificaciones y la cantidad de reseñas para cada proveedor
                y lo guarda directamente en su documento. Esto permite mostrar ratings sin consultas extra.
            </p>
            <Button onClick={runMigration} disabled={isRunning} size="lg">
                {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRunning ? 'Migrando...' : 'Ejecutar Migración'}
            </Button>
            {status && (
                <pre className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap">{status}</pre>
            )}
        </div>
    );
}
