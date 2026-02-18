
import { वर्तमान_उपयोगकर्ता_प्राप्त_करें } from '@/firebase/auth/current-user';
import BenefitList from '@/components/dashboard/benefit-list';
import { redirect } from 'next/navigation';

export default async function DashboardBenefitsPage() {
  const user = await वर्तमान_उपयोगकर्ता_प्राप्त_करें();

  if (!user || (!user.roles.includes('admin') && !user.roles.includes('supplier'))) {
    // Redirect to a more appropriate page if the user is not logged in or not authorized
    redirect('/');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gestionar Beneficios</h1>
      <BenefitList user={user} />
    </div>
  );
}
