'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { RoleProvider } from '@/context/role-context';
import SplashScreen from '@/components/layout/splash-screen';
import { UserRole } from '@/types/data';

export default function DashboardLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  const { user, roles, isUserLoading } = useUser();
  const router = useRouter();

  const isAuthorized = roles.includes('admin') || roles.includes('supplier');

  useEffect(() => {
    // If loading is finished and the user is not authorized, redirect them.
    if (!isUserLoading && !isAuthorized) {
      router.push('/');
    }
  }, [isUserLoading, isAuthorized, router]);

  // While loading, or if the user is not authorized yet (to prevent content flashing),
  // show a loading screen.
  if (isUserLoading || !isAuthorized) {
    return <SplashScreen />;
  }

  // Ensure roles are correctly typed for the provider
  const availableRoles: UserRole[] = roles.filter(
      (role): role is UserRole => ['admin', 'supplier', 'user'].includes(role)
  );

  return (
    <RoleProvider availableRoles={availableRoles}>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-8">
            {children}
        </main>
      </div>
    </RoleProvider>
  );
}
