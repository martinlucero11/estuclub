
import { getCurrentUser } from '@/firebase/auth/current-user';
import BenefitList from '@/components/dashboard/benefit-list';
import { redirect } from 'next/navigation';

export default async function DashboardBenefitsPage() {
  const user = await getCurrentUser();

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
