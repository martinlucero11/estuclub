'use client';

import { useUser } from '@/firebase';
import RedemptionList from '@/components/dashboard/redemption-list';
import SplashScreen from '@/components/layout/splash-screen';
import type { UserRole } from '@/types/data';
import BackButton from '@/components/layout/back-button';

// This is the type expected by RedemptionList component
interface UserForList {
  uid: string;
  email: string | null;
  roles: UserRole[];
}

export default function DashboardRedemptionsPage() {
  const { user, roles, isUserLoading } = useUser();

  if (isUserLoading || !user) {
    return <SplashScreen />;
  }

  // Construct the user object expected by the RedemptionList component
  const userForList: UserForList = {
    uid: user.uid,
    email: user.email,
    roles: roles as UserRole[],
  };

  return (
    <div className="space-y-4">
        <BackButton />
        <h1 className="text-2xl font-bold">Historial de Canjes</h1>
        <RedemptionList user={userForList} />
    </div>
  );
}
