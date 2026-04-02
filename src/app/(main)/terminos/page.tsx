import MainLayout from '@/components/layout/main-layout';

export const metadata = {
  title: 'Términos y Condiciones - EstuClub',
};

export default function TermsAndConditionsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 italic uppercase tracking-tighter">Términos y Condiciones</h1>
        <p className="text-sm text-muted-foreground mb-8">Última actualización: 20 de marzo de 2026</p>
        
        <div className="space-y-6 text-foreground/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Aceptación de los Términos</h2>
            <p>Al acceder y utilizar los servicios de EstuClub, aceptas estar sujeto a estos Términos y Condiciones. Si no estás de acuerdo, por favor no utilices la plataforma.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Uso del Servicio</h2>
            <p>EstuClub es una plataforma de beneficios para estudiantes. Los usuarios deben ser mayores de edad o contar con autorización legal para contratar. El uso indebido de la plataforma resultará en la baja inmediata de la cuenta.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Registro de Cuenta</h2>
            <p>Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. EstuClub se reserva el derecho de rechazar el servicio o cancelar cuentas a su discreción.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Propiedad Intelectual</h2>
            <p>Todo el contenido, marcas y logos en EstuClub son propiedad exclusiva de la empresa o sus licenciantes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Limitación de Responsabilidad</h2>
            <p>EstuClub no se hace responsable por daños indirectos o incidentales que resulten del uso de nuestro servicio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Contacto</h2>
            <p>Para consultas legales, por favor contáctanos en <a href="mailto:soporte@estuclub.com.ar" className="text-primary hover:underline">soporte@estuclub.com.ar</a>.</p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
