
'use client';

import BackButton from '@/components/layout/back-button';
import EditSupplierProfileForm from '@/components/supplier/edit-supplier-profile-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SupplierProfilePage() {
  return (
    <div className="space-y-4">
      <BackButton />
      <h1 className="text-3xl font-bold">Mi Perfil de Cluber</h1>
      <p className="text-muted-foreground">
        Edita la información que los estudiantes verán sobre tu comercio, club o institución.
      </p>
      <Card>
        <CardHeader>
            <CardTitle>Información Pública</CardTitle>
            <CardDescription>Estos datos son visibles para todos los usuarios de la aplicación.</CardDescription>
        </CardHeader>
        <CardContent>
            <EditSupplierProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
