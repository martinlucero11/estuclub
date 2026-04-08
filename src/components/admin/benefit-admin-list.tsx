'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2, TrendingUp } from 'lucide-react';
import type { Benefit, SerializableBenefit } from '@/types/data';
import { makeBenefitSerializable } from '@/lib/data';
import { BenefitDialog } from '@/components/admin/benefits/benefit-dialog';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { createConverter } from '@/lib/firestore-converter';
import { PlusCircle, Gift, LayoutGrid, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function BenefitAdminListItem({ benefit }: { benefit: SerializableBenefit }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleDelete = async () => {
    const benefitRef = doc(firestore, 'benefits', benefit.id);
    try {
        await deleteDoc(benefitRef);
        toast({
            title: 'Beneficio eliminado',
            description: `El beneficio "${benefit.title}" ha sido eliminado.`,
        });
    } catch (error) {
        console.error("Error deleting benefit: ", error);
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
      <div className="flex items-center justify-between space-x-4 rounded-[1.5rem] border border-black/5 bg-white p-5 hover:shadow-lg transition-all group">
        <div className="flex items-center space-x-5 flex-1 min-w-0">
          <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform">
            <Image
                src={benefit.imageUrl}
                alt={benefit.title}
                fill
                className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
                <p className="font-bold text-base truncate">{benefit.title}</p>
                {benefit.isVisible ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                )}
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/10">
                    {benefit.category}
                </Badge>
                {benefit.isStudentOnly && (
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-blue-500/20 text-blue-500 bg-blue-500/5">
                        Students
                    </Badge>
                )}
                {benefit.isCincoDosOnly && (
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
                        Cinco.Dos
                    </Badge>
                )}
            </div>
            <div className='flex items-center gap-2 text-[10px] text-black/40 font-black uppercase tracking-widest pt-1'>
              <TrendingUp className='h-3 w-3' />
              <span>{benefit.redemptionCount || 0} canjes</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => setIsEditOpen(true)} className="h-10 w-10 rounded-xl hover:bg-primary/5 hover:text-primary">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsDeleteOpen(true)} className="h-10 w-10 rounded-xl hover:bg-destructive/5 hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <BenefitDialog
        benefit={benefit}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <DeleteConfirmationDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="¿Eliminar este beneficio?"
        description={`Esta acción es permanente y no se puede deshacer. ¿Estás seguro de que quieres eliminar "${benefit.title}"?`}
      />
    </>
  );
}


export default function BenefitAdminList({ supplierId }: { supplierId?: string }) {
  const firestore = useFirestore();
  const [isNewBenefitOpen, setIsNewBenefitOpen] = useState(false);

  const benefitsQuery = useMemo(
    () => {
        const baseCollection = collection(firestore, 'benefits').withConverter(createConverter<Benefit>());
        if (supplierId) {
            return query(baseCollection, where('supplierId', '==', supplierId), orderBy('createdAt', 'desc'))
        }
        return query(baseCollection, orderBy('createdAt', 'desc'))
    },
    [firestore, supplierId]
  );
  
  const { data: benefits, isLoading, error } = useCollection(benefitsQuery);

  const serializableBenefits: SerializableBenefit[] = useMemo(() => {
    if (!benefits) return [];
    return benefits.map(makeBenefitSerializable);
  }, [benefits]);


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
        const indexUrl = `https://console.firebase.google.com/project/${projectId}/firestore/indexes/composite-create?collectionId=perks&field[0].fieldPath=ownerId&field[0].order=ASCENDING&field[1].fieldPath=createdAt&field[1].order=DESCENDING`;
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
                    <p className="mt-4 text-xs text-foreground">Una vez en la página, simplemente haz clic en "Crear índice" y espera unos minutos a que se active. Luego, recarga esta página.</p>
                </CardContent>
            </Card>
        );
    }
    return <p className="text-destructive">Error al cargar los beneficios: {error.message}</p>;
  }

  if (!serializableBenefits || serializableBenefits.length === 0) {
    return (
      <p className="text-center text-foreground">No has creado ningún beneficio todavía.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Módulo de Beneficios</span>
        </div>
        <Button 
            onClick={() => setIsNewBenefitOpen(true)}
            className="rounded-xl h-12 px-6 bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-all"
        >
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Beneficio
        </Button>
      </div>

      <div className="space-y-4">
        {serializableBenefits.map((benefit) => (
            <BenefitAdminListItem key={benefit.id} benefit={benefit} />
        ))}
      </div>

      <BenefitDialog 
        isOpen={isNewBenefitOpen}
        onOpenChange={setIsNewBenefitOpen}
      />
    </div>
  );
}

