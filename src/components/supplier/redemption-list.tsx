
'use client';

import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { History, Calendar, User as UserIcon, Tag, CheckCircle, Clock } from 'lucide-react';
import type { BenefitRedemption } from '@/lib/data';
import { useMemo } from 'react';

// Skeleton Loader for the table
function ScanHistorySkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {[...Array(4)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(3)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// Main Component: Supplier's Scan History
export default function SupplierScanHistory() {
    const { user } = useUser();
    const firestore = useFirestore();

    // Query for benefit redemptions, filtered by the current supplier's ID
    // and ordered by the scan time. This requires a composite index.
    const scansQuery = useMemo(() => {
        if (!user) return null;

        return query(
            collection(firestore, 'benefitRedemptions'),
            where('supplierId', '==', user.uid),
            orderBy('redeemedAt', 'desc')
        );
    }, [user, firestore]);

    const { data: scans, isLoading, error } = useCollection<BenefitRedemption>(scansQuery);

    // Proactive error handling for missing Firestore index
    if (error && 'code' in error && error.code === 'failed-precondition') {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'estuclub';
        const indexUrl = `https://console.firebase.google.com/project/${projectId}/firestore/indexes/composite-create?collectionId=benefitRedemptions&field[0].fieldPath=supplierId&field[0].order=ASCENDING&field[1].fieldPath=redeemedAt&field[1].order=DESCENDING`;
        return (
            <Card className="border-destructive">
                 <CardHeader>
                    <CardTitle className="text-destructive">Error de Configuración de Base de Datos</CardTitle>
                    <CardDescription className="text-destructive">
                        La consulta para mostrar el historial de escaneos requiere un índice compuesto en Firestore que no ha sido creado.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-sm font-medium">Para solucionar este problema, un administrador del proyecto de Firebase debe crear el índice requerido.</p>
                    <p className='text-sm mb-2'>Haz clic en el siguiente enlace para ir directamente a la página de creación de índices con los campos correctos pre-rellenados:</p>
                    <a href={indexUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline font-mono break-all text-sm hover:text-primary/80">
                        Crear Índice en Firebase Console
                    </a>
                    <p className="mt-4 text-xs text-muted-foreground">Una vez en la página, simplemente haz clic en "Crear índice" y espera unos minutos a que se active.</p>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return <ScanHistorySkeleton />;
    }

    if (!scans || scans.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
                <History className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">Sin Escaneos Registrados</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Aún no has escaneado ningún código QR de canje.
                </p>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Historial de Escaneos</CardTitle>
                <CardDescription>Aquí puedes ver todos los beneficios que has validado.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Beneficio</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Fecha de Escaneo</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {scans.map(scan => {
                            const redeemedAt = (scan.redeemedAt as Timestamp)?.toDate();
                            return (
                                <TableRow key={scan.id}>
                                    <TableCell className="font-medium flex items-center gap-2"><Tag className="h-4 w-4 text-muted-foreground"/>{scan.benefitTitle}</TableCell>
                                    <TableCell className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground"/>{scan.userName}</TableCell>
                                    <TableCell>
                                        {redeemedAt ? redeemedAt.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : 'Fecha no disponible'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={scan.status === 'used' ? "bg-green-100 text-green-700 border-green-200" : ""}
                                        >
                                            {scan.status === 'used' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                                            {scan.status === 'used' ? 'Completado' : 'Pendiente'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
