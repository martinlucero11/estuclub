
import { getCurrentUser } from '@/firebase/auth/current-user';
import RedemptionList from '@/components/dashboard/redemption-list';
import { redirect } from 'next/navigation';

export default async function DashboardRedemptionsPage() {
  const user = await getCurrentUser();

  if (!user || (!user.roles.includes('admin') && !user.roles.includes('supplier'))) {
    redirect('/');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Historial de Canjes</h1>
      <RedemptionList user={user} />
    </div>
  );
}
