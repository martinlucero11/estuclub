
import BackButton from '@/components/layout/back-button';

export default function DashboardAnnouncementsPage() {
  return (
    <div className="space-y-4">
        <BackButton />
        <h1 className="text-2xl font-bold">Gestionar Anuncios</h1>
        <p className="text-muted-foreground">
            Esta funcionalidad está en construcción. Aquí podrás crear, editar y eliminar tus anuncios.
        </p>
    </div>
  );
}
