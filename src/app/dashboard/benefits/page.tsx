'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import BenefitList from '@/components/dashboard/benefit-list';
import SplashScreen from '@/components/layout/splash-screen';
import type { UserRole } from '@/types/data';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BenefitFormDialog } from '@/components/dashboard/benefit-form-dialog';
import BackButton from '@/components/layout/back-button';

// This is the type expected by BenefitList component
interface UserForList {
  uid: string;
  email: string | null;
  roles: UserRole[];
}

export default function DashboardBenefitsPage() {
  const { user, roles, isUserLoading } = useUser();
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (isUserLoading || !user) {
    return <SplashScreen />;
  }

  const userForList: UserForList = {
    uid: user.uid,
    email: user.email,
    roles: roles as UserRole[],
  };
  
  const isAdmin = roles.includes('admin');

  return (
    <div className="space-y-4">
      <BackButton />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestionar Beneficios</h1>
        {isAdmin && (
            <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir Nuevo Beneficio
            </Button>
        )}
      </div>
      <BenefitList user={userForList} />
      {isAdmin && (
        <BenefitFormDialog isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
      )}
    </div>
  );
}
