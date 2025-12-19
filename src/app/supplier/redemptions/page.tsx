
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { makeBenefitRedemptionSerializable, type SerializableBenefitRedemption, type BenefitRedemption } from '@/lib/data';
import { History, ShieldAlert } from 'lucide-react';
import RedemptionsStats from '@/components/supplier/redemptions-stats';
import { useAdmin } from '@/firebase/auth/use-admin';
import { useSupplier } from '@/firebase/auth/use-supplier';
import { Skeleton } from '@/components/ui/skeleton';

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

function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center pt-16">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Acceso Denegado</CardTitle>
                    <CardDescription>
                        No tienes permisos para ver el historial de canjes.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}

function RedemptionsList() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const redemptionsQuery = useMemoFirebase(() => {
    if (!user) return null;
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
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (serializableRedemptions.length === 0) {
    return (
      <div className="text-center py-8 rounded-lg border-2 border-dashed">
        <p className='font-medium'>No tienes canjes registrados a tu nombre.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <RedemptionsStats redemptions={serializableRedemptions} userId={user!.uid} />
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
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const { isSupplier, isLoading: isSupplierLoading } = useSupplier();

  const isLoading = isAdminLoading || isSupplierLoading;

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
        {isLoading ? (
             <Skeleton className="h-64 w-full" />
        ) : (isAdmin || isSupplier) ? (
            <RedemptionsList />
        ) : (
            <AccessDenied />
        )}
      </div>
    </MainLayout>
  );
}
