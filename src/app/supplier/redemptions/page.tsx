'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { makeBenefitRedemptionSerializable, type SerializableBenefitRedemption, type BenefitRedemption } from '@/lib/data';
import { History } from 'lucide-react';
import RedemptionsStats from '@/components/supplier/redemptions-stats';

function RedemptionRow({ redemption }: { redemption: SerializableBenefitRedemption }) {
  const redeemedAt = new Date(redemption.redeemedAt);

  return (
    <TableRow>
      <TableCell className="font-medium">{redemption.benefitTitle}</TableCell>
      <TableCell>{redemption.userName}</TableCell>
      <TableCell>{redeemedAt.toLocaleDateString('es-ES')}</TableCell>
      <TableCell className="text-right">{redeemedAt.toLocaleTimeString('es-ES')}</TableCell>
    </TableRow>
  );
}

function RedemptionsList() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const redemptionsQuery = useMemoFirebase(() => {
    if (!user) return null; // Wait for user to be available
    return query(
      collection(firestore, 'benefitRedemptions'),
      where('supplierId', '==', user.uid),
      orderBy('redeemedAt', 'desc')
    );
  }, [user, firestore]);

  const { data: redemptions, isLoading: isDataLoading } = useCollection<BenefitRedemption>(redemptionsQuery);

  const serializableRedemptions = useMemo(() => {
    return redemptions?.map(makeBenefitRedemptionSerializable) || [];
  }, [redemptions]);

  const isLoading = isAuthLoading || isDataLoading;

  if (isLoading) {
    return <div>Cargando canjes...</div>;
  }

  if (serializableRedemptions.length === 0) {
    return (
      <div className="text-center py-8">
        <p>No se encontraron canjes para tus beneficios.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <RedemptionsStats redemptions={serializableRedemptions} />
      <Card>
        <CardHeader>
          <CardTitle>Historial de Canjes</CardTitle>
          <CardDescription>Aquí puedes ver todos los canjes de tus beneficios.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Beneficio</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serializableRedemptions.map(redemption => (
                <RedemptionRow key={redemption.id} redemption={redemption} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SupplierRedemptionsPage() {
  return (
    <MainLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8">
        <header className="space-y-2">
            <div className="flex items-center gap-3">
                <History className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    Canjes de Beneficios
                </h1>
            </div>
            <p className="text-muted-foreground">
                Visualiza el historial de todos los beneficios que han sido canjeados por los estudiantes.
            </p>
        </header>
        <RedemptionsList />
      </div>
    </MainLayout>
  );
}
