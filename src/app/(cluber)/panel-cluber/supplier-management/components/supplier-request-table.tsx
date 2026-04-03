'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createConverter } from '@/lib/firestore-converter';
import { Check, X, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SupplierRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  requestedAt: any;
}

export function SupplierRequestTable() {
  const firestore = useFirestore();

  const requestsQuery = useMemo(
    () => query(
        collection(firestore, "supplier_requests").withConverter(createConverter<SupplierRequest>()), 
        orderBy("createdAt", "desc")
    ),
    [firestore]
  );
  const { data: requests, isLoading } = useCollection(requestsQuery);

  const handleApprove = async (request: SupplierRequest) => {
    try {
      // 1. Update request status
      await updateDoc(doc(firestore, 'supplier_requests', request.id), {
        status: 'approved',
        approvedAt: serverTimestamp(),
      });

      // 2. Create supplier role doc
      const supplierDocRef = doc(firestore, 'roles_supplier', request.userId);
      await setDoc(supplierDocRef, {
        id: request.userId,
        name: request.userName,
        email: request.userEmail,
        slug: request.userName.toLowerCase().replace(/\s+/g, '-'),
        isActive: true,
        isFeatured: false,
        appointmentsEnabled: false,
        announcementsEnabled: false,
        benefitsCount: 0,
        createdAt: serverTimestamp(),
      });

      toast.success(`Solicitud aprobada: ${request.userName} ahora es Cluber.`);
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error('Error al aprobar la solicitud.');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await updateDoc(doc(firestore, 'supplier_requests', requestId), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
      });
      toast.success('Solicitud rechazada.');
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error('Error al rechazar la solicitud.');
    }
  };

  const columns = [
    {
      accessorKey: 'userName',
      header: 'Usuario',
      cell: ({ row }: any) => (
        <div className="flex flex-col">
          <span className="font-bold">{row.original.userName}</span>
          <span className="text-xs text-foreground">{row.original.userEmail}</span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }: any) => {
        const date = row.original.createdAt?.toDate();
        return date ? format(date, "PPP", { locale: es }) : '-';
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }: any) => {
        const status = row.original.status;
        return (
          <Badge variant={status === 'pending' ? 'secondary' : status === 'approved' ? 'default' : 'destructive'}>
            {status === 'pending' ? 'Pendiente' : status === 'approved' ? 'Aprobado' : 'Rechazado'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }: any) => {
        if (row.original.status !== 'pending') return null;
        return (
          <div className="flex gap-2">
            <Button size="icon" variant="outline" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-50" onClick={() => handleApprove(row.original)}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleReject(row.original.id)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={requests || []}
      isLoading={isLoading}
      filterColumn="userName"
      filterPlaceholder="Buscar por nombre..."
    />
  );
}

