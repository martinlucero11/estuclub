import MainLayout from '@/components/layout/main-layout';

export const metadata = {
  title: 'Política de Privacidad - EstuClub',
};

export default function PrivacyPolicyPage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Política de Privacidad de EstuClub</h1>
        <p className="text-sm text-foreground mb-8">Última actualización: 20 de marzo de 2026</p>
        
        <div className="space-y-6 text-foreground/80 leading-relaxed">
          <p>Bienvenido/a a EstuClub. En esta Política de Privacidad te explicamos cómo recopilamos, usamos, compartimos y protegemos tu información personal cuando utilizas nuestra aplicación y sitio web (https://estuclub.com.ar). Al registrarte y usar nuestros servicios, aceptas las prácticas descritas en este documento.</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Información que recopilamos</h2>
            <p className="mb-2">Para brindarte el mejor servicio, recopilamos los siguientes tipos de información:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Información proporcionada por el usuario:</strong> Al crear una cuenta, te pedimos datos personales como tu dirección de correo electrónico, nombre y contraseña.</li>
              <li><strong>Datos de uso y dispositivo:</strong> Podemos recopilar información sobre cómo interactúas con la aplicación (páginas visitadas, tiempo de uso) y datos técnicos como tu dirección IP, tipo de navegador y sistema operativo.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. Cómo utilizamos tu información</h2>
            <p className="mb-2">Usamos los datos que recopilamos exclusivamente para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Crear y gestionar tu cuenta en EstuClub.</li>
              <li>Enviarte correos operativos (como confirmación de registro o restablecimiento de contraseña).</li>
              <li>Mejorar el funcionamiento, diseño y seguridad de nuestra aplicación.</li>
              <li>Brindarte soporte técnico y responder a tus consultas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Servicios de terceros (Proveedores)</h2>
            <p className="mb-4">Para que EstuClub funcione, utilizamos servicios de terceros que pueden procesar tus datos. El principal es Google (Firebase), que nos provee la infraestructura de base de datos y el sistema de autenticación de usuarios.</p>
            <p className="mb-4">Tus contraseñas son encriptadas y gestionadas de forma segura por Firebase; nosotros no tenemos acceso a tu contraseña en texto plano.</p>
            <p>Te recomendamos revisar la Política de Privacidad de Google para entender cómo manejan estos datos en sus servidores.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Seguridad de los datos</h2>
            <p>Nos tomamos muy en serio la seguridad de tu información. Utilizamos protocolos estándar de la industria (como conexiones seguras HTTPS y autenticación mediante Firebase) para proteger tus datos contra accesos no autorizados, alteraciones o destrucción. Sin embargo, debes saber que ningún método de transmisión por Internet es 100% seguro.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Retención de datos</h2>
            <p>Conservaremos tu información personal mientras tu cuenta de EstuClub esté activa o según sea necesario para brindarte nuestros servicios. Si decides eliminar tu cuenta, borraremos tus datos de nuestros registros activos, salvo aquellos que estemos obligados a conservar por motivos legales.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Tus derechos (Ley 25.326 - Argentina)</h2>
            <p className="mb-2">De acuerdo con la Ley N° 25.326 de Protección de Datos Personales de la República Argentina, tienes derecho a:</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>Acceder a los datos personales que tenemos sobre ti.</li>
              <li>Rectificar (corregir) cualquier dato inexacto o incompleto.</li>
              <li>Solicitar la eliminación de tu cuenta y tus datos personales de nuestras bases de datos.</li>
            </ul>
            <p>Para ejercer cualquiera de estos derechos, puedes contactarnos directamente.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">7. Cambios en esta política</h2>
            <p>Podemos actualizar esta Política de Privacidad ocasionalmente para reflejar cambios en nuestra app o por razones legales. Te notificaremos sobre cambios significativos enviándote un correo electrónico o mostrando un aviso destacado en la aplicación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">8. Contacto</h2>
            <p className="mb-2">Si tienes alguna pregunta, inquietud o solicitud relacionada con esta Política de Privacidad o el manejo de tus datos, por favor contáctanos en:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Correo electrónico:</strong> <a href="mailto:usuarios@estuclub.com.ar" className="text-primary hover:underline">usuarios@estuclub.com.ar</a> (o <a href="mailto:soporte@estuclub.com.ar" className="text-primary hover:underline">soporte@estuclub.com.ar</a>)</li>
              <li><strong>Sitio web:</strong> <a href="https://estuclub.com.ar" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://estuclub.com.ar</a></li>
            </ul>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}

