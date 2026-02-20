'use client';

import { useUser } from '@/firebase';
import BenefitList from '@/components/dashboard/benefit-list';
import SplashScreen from '@/components/layout/splash-screen';
import type { UserRole } from '@/types/data';

// This is the type expected by BenefitList component
interface UserForList {
  uid: string;
  email: string | null;
  roles: UserRole[];
}

export default function DashboardBenefitsPage() {
  const { user, roles, isUserLoading } = useUser();

  // The parent layout already handles unauthorized access,
  // but we should show a loading state until the user object is confirmed.
  if (isUserLoading || !user) {
    return <SplashScreen />;
  }

  // Construct the user object expected by the BenefitList component
  const userForList: UserForList = {
    uid: user.uid,
    email: user.email,
    roles: roles as UserRole[],
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gestionar Beneficios</h1>
      <BenefitList user={userForList} />
    </div>
  );
}
