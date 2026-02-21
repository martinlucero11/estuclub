
import BackButton from '@/components/layout/back-button';

export default function DashboardAppointmentsPage() {
  return (
    <div className="space-y-4">
        <BackButton />
        <h1 className="text-2xl font-bold">Gestionar Turnos</h1>
        <p className="text-muted-foreground">
            Esta funcionalidad está en construcción. Aquí podrás gestionar tus horarios y los turnos reservados por los estudiantes.
        </p>
    </div>
  );
}
