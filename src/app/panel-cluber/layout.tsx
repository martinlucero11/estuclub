
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { RoleProvider } from '@/context/role-context';
import SplashScreen from '@/components/layout/splash-screen';
import { UserRole } from '@/types/data';
import { BottomNav } from '@/components/layout/bottom-nav'; 

export default function PanelCluberLayout({
  children,
}: { 
  children: React.ReactNode;
}) {
  const { user, roles, isUserLoading } = useUser();
  const router = useRouter();

  const isAuthorized = roles.includes('admin') || roles.includes('supplier');

  useEffect(() => {
    if (!isUserLoading && !isAuthorized) {
      router.push('/');
    }
  }, [isUserLoading, isAuthorized, router]);

  if (isUserLoading || !isAuthorized) {
    return <SplashScreen />;
  }

  const availableRoles: UserRole[] = roles.filter(
      (role): role is UserRole => ['admin', 'supplier', 'user'].includes(role)
  );

  return (
    <RoleProvider availableRoles={availableRoles}>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        {/* Add bottom padding for mobile to avoid overlap with BottomNav */}
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
            {children}
        </main>
        <BottomNav /> {/* Add BottomNav here */}
      </div>
    </RoleProvider>
  );
}
