'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import SplashScreen from '@/components/layout/splash-screen';
import type { UserRole } from '@/types/data';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import BackButton from '@/components/layout/back-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AnnouncementList from '@/components/dashboard/announcement-list';
import { AnnouncementFormDialog } from '@/components/dashboard/announcement-form-dialog';

interface UserForList {
  uid: string;
  email: string | null;
  roles: UserRole[];
}

export default function DashboardAnnouncementsPage() {
  const { user, roles, supplierData, isUserLoading } = useUser();
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (isUserLoading || !user) {
    return <SplashScreen />;
  }

  const userForList: UserForList = {
    uid: user.uid,
    email: user.email,
    roles: roles as UserRole[],
  };
  
  const canCreate = roles.includes('admin') || supplierData?.canCreateAnnouncements;

  return (
    <div className="space-y-4">
      <BackButton />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestionar Anuncios</h1>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div tabIndex={0}>
                        <Button onClick={() => setIsFormOpen(true)} disabled={!canCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Crear Anuncio
                        </Button>
                    </div>
                </TooltipTrigger>
                {!canCreate && (
                    <TooltipContent>
                        <p>No tienes permiso para crear anuncios. Solicita acceso al administrador.</p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
      </div>
      <AnnouncementList user={userForList} />
      {canCreate && (
        <AnnouncementFormDialog isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
      )}
    </div>
  );
}
