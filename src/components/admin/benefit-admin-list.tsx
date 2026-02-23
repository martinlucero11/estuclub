'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, where, updateDoc, increment } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2, TrendingUp } from 'lucide-react';
import type { Perk, SerializablePerk } from '@/lib/data';
import { makePerkSerializable } from '@/lib/data';
import EditPerkDialog from '@/components/perks/edit-perk-dialog';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

function BenefitAdminListItem({ perk }: { perk: SerializablePerk }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleDelete = async () => {
    const perkRef = doc(firestore, 'benefits', perk.id);
    try {
        await deleteDoc(perkRef);
        toast({
            title: 'Beneficio eliminado',
            description: `El beneficio "${perk.title}" ha sido eliminado.`,
        });
    } catch (error) {
        console.error("Error deleting perk: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo eliminar el beneficio.',
        });
    }
    setIsDeleteOpen(false);
  };
  
  return (
    <>
      <div className="flex items-center justify-between space-x-4 rounded-md border p-4">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <Image
            src={perk.imageUrl}
            alt={perk.title}
            width={64}
            height={64}
            className="h-16 w-16 rounded-md object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{perk.title}</p>
            <p className="text-sm text-muted-foreground">{perk.category}</p>
            <div className='flex items-center gap-2 text-sm text-primary font-semibold pt-1'>
              <TrendingUp className='h-4 w-4' />
              <span>{perk.redemptionCount || 0} canjes</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => setIsEditOpen(true)}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>
          <Button variant="destructive" size="icon" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Eliminar</span>
          </Button>
        </div>
      </div>
      <EditPerkDialog
        perk={perk}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <DeleteConfirmationDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="¿Eliminar este beneficio?"
        description={`Esta acción es permanente y no se puede deshacer. ¿Estás seguro de que quieres eliminar "${perk.title}"?`}
      />
    </>
  );
}


export default function BenefitAdminList({ supplierId }: { supplierId?: string }) {
  const firestore = useFirestore();

  const perksQuery = useMemo(
    () => {
        const baseCollection = collection(firestore, 'benefits');
        if (supplierId) {
            return query(baseCollection, where('ownerId', '==', supplierId), orderBy('createdAt', 'desc'))
        }
        return query(baseCollection, orderBy('createdAt', 'desc'))
    },
    [firestore, supplierId]
  );
  
  const { data: perks, isLoading, error } = useCollection<Perk>(perksQuery);

  const serializablePerks: SerializablePerk[] = useMemo(() => {
    if (!perks) return [];
    return perks.map(makePerkSerializable);
  }, [perks]);


  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 rounded-md border p-4">
            <Skeleton className="h-16 w-16 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    // Proactive error handling for missing Firestore index.
    // Firestore often returns "permission-denied" when an index is missing for a complex query,
    // so we check for both `failed-precondition` and `permission-denied` (but only if we are filtering).
    const isPreconditionFailed = 'code' in error && error.code === 'failed-precondition';
    const isMaskedPermissionError = 'message' in error && error.message.includes('firestore/permission-denied') && !!supplierId;

    if (isPreconditionFailed || isMaskedPermissionError) {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-7814845508-d173f'; // Using the known project ID
        const indexUrl = `https://console.firebase.google.com/project/${projectId}/firestore/indexes/composite-create?collectionId=benefits&field[0].fieldPath=ownerId&field[0].order=ASCENDING&field[1].fieldPath=createdAt&field[1].order=DESCENDING`;
        return (
            <Card className="border-destructive">
                 <CardHeader>
                    <CardTitle className="text-destructive">Error de Configuración de Base de Datos</CardTitle>
                    <CardDescription className="text-destructive">
                        La consulta para mostrar tus beneficios requiere un índice compuesto en Firestore que no ha sido creado. Este es un error común.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-sm font-medium">Para solucionar este problema, un administrador del proyecto de Firebase debe crear el índice requerido.</p>
                    <p className='text-sm mb-2'>Haz clic en el siguiente enlace para ir directamente a la página de creación de índices con los campos correctos pre-rellenados:</p>
                    <a href={indexUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline font-mono break-all text-sm hover:text-primary/80">
                        Crear Índice en Firebase Console
                    </a>
                    <p className="mt-4 text-xs text-muted-foreground">Una vez en la página, simplemente haz clic en "Crear índice" y espera unos minutos a que se active. Luego, recarga esta página.</p>
                </CardContent>
            </Card>
        );
    }
    return <p className="text-destructive">Error al cargar los beneficios: {error.message}</p>;
  }

  if (!serializablePerks || serializablePerks.length === 0) {
    return (
      <p className="text-center text-muted-foreground">No has creado ningún beneficio todavía.</p>
    );
  }

  return (
    <div className="space-y-4">
      {serializablePerks.map((perk) => (
        <BenefitAdminListItem key={perk.id} perk={perk} />
      ))}
    </div>
  );
}
