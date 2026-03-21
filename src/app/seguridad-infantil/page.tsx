import MainLayout from '@/components/layout/main-layout';

export const metadata = {
  title: 'Estándares de Seguridad Infantil - EstuClub',
};

export default function ChildSafetyPolicyPage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Política de Estándares de Seguridad Infantil</h1>
        <p className="text-sm text-muted-foreground mb-8">Última actualización: 20 de marzo de 2026</p>
        
        <div className="space-y-6 text-foreground/80 leading-relaxed">
          <p>En EstuClub nos tomamos muy en serio la seguridad de todos nuestros usuarios, especialmente la de los niños y adolescentes. Nos comprometemos firmemente a mantener nuestra plataforma como un entorno seguro y libre de cualquier forma de explotación o abuso sexual infantil (CSAE, por sus siglas en inglés).</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Estándares contra la explotación y el abuso sexual infantil (CSAE)</h2>
            <p>EstuClub tiene una política de tolerancia cero frente al contenido o comportamiento que promueva, facilite o distribuya material de explotación o abuso sexual infantil. Cualquier cuenta que incurra en estas prácticas será suspendida de manera inmediata y permanente.</p>
            <p className="mt-2">Ningún usuario, comercio o proveedor asociado puede publicar enlaces, imágenes, textos o cualquier forma de contenido que viole directa o indirectamente la indemnidad de menores.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Mecanismo de denuncia y comentarios</h2>
            <p>Si eres testigo, descubres o sospechas de la presencia de contenido inapropiado relacionado con menores en nuestra plataforma, dispones de mecanismos directos para denunciarlo de inmediato:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Puedes enviar un reporte detallado a través de la dirección de correo dedicada para casos de seguridad: <a href="mailto:seguridad@estuclub.com.ar" className="text-primary hover:underline font-medium">seguridad@estuclub.com.ar</a>.</li>
              <li>A través del sistema de soporte integrado en la aplicación (Panel de Usuario / Soporte).</li>
            </ul>
            <p className="mt-2">Todos los reportes son revisados con la máxima prioridad por nuestro equipo moderador.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Abordaje del Material de Abuso Sexual Infantil (CSAM)</h2>
            <p>Ante la detección o denuncia de CSAM dentro de nuestra aplicación, tomaremos las siguientes medidas rigurosas:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Preservaremos las evidencias siguiendo los protocolos técnicos y de privacidad aplicables.</li>
              <li>Eliminaremos el material ofensivo de la vista pública inmediatamente.</li>
              <li>Reportaremos la cuenta y todo el material recolectado al NCMEC (National Center for Missing & Exploited Children) y a las autoridades policiales argentinas e internacionales pertinentes.</li>
              <li>Colaboraremos proactivamente con cualquier investigación oficial liderada por las autoridades judiciales.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Cumplimiento de las legislaciones de seguridad infantil</h2>
            <p>Nuestras políticas, métodos de retención de datos y protocolos de reporte cumplen estrictamente con la legislación vigente nacional aplicable (República Argentina, Ley Nº 27.590 y normativas penales relacionadas), así como con los estándares y directrices internacionales, incluyendo aquellas definidas por la Tech Coalition para combatir el CSAE en línea.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Punto de contacto para la seguridad de los niños</h2>
            <p>Para consultas, reportes urgentes o comunicación oficial de entidades policiales o de protección al menor con respecto a incidentes CSAM / CSAE, hemos designado a los siguientes Oficiales de Contacto de Seguridad (Safety Points of Contact):</p>
            <div className="bg-muted/50 p-6 rounded-xl mt-4 border border-border">
              <ul className="space-y-3">
                <li><strong>Departamento de Seguridad y Moderación (EstuClub)</strong></li>
                <li><strong>Email principal para reportes:</strong> <a href="mailto:seguridad@estuclub.com.ar" className="text-primary hover:underline">seguridad@estuclub.com.ar</a></li>
                <li><strong>Email institucional:</strong> <a href="mailto:soporte@estuclub.com.ar" className="text-primary hover:underline">soporte@estuclub.com.ar</a></li>
                <li><strong>Respuesta esperada:</strong> Inmediata (24/7 para incidentes urgentes CSAM).</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
