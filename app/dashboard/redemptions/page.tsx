
import { वर्तमान_उपयोगकर्ता_प्राप्त_करें } from '@/firebase/auth/current-user';
import RedemptionList from '@/components/dashboard/redemption-list';
import { redirect } from 'next/navigation';

export default async function DashboardRedemptionsPage() {
  const user = await वर्तमान_उपयोगकर्ता_प्राप्त_करें();

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
