# Estuclub - Arquitectura y Contexto del Proyecto

Este documento proporciona un resumen detallado de la aplicación **Estuclub** para dar contexto inmediato a cualquier IA o desarrollador que se integre al proyecto.

## 1. Stack Tecnológico General
- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS, Framer Motion (para animaciones complejas y micro-interacciones), Lucide React (iconos), React Hook Form + Zod (validaciones).
- **Backend/Base de Datos**: Firebase (Firestore, Authentication, Storage), Firebase Admin SDK (ejecutándose en Rutas API de Next.js).
- **Integraciones de Terceros**:
  - **Mercado Pago**: SDK y Webhooks para pagos de e-commerce, comisiones y Suscripciones (PreApproval API) de usuarios Clubers y Riders.
  - **Google Cloud / Drive API**: Almacenamiento directo de documentación sensible (KYC, DNI, Certificados de alumno regular).
  - **Google Maps API**: Geocodificación y mapas interactivos (ubicaciones de comercios y seguimiento de cadetes).

## 2. Roles de Usuario y Ecosistema
Estuclub es una plataforma multifacética (Marketplace + Servicios + Logística), dividida por un sistema estricto de roles (`role-actions.ts`) manejado por Custom Claims de Firebase y bases de datos.

*   **Estudiante (`student`)**: Usuario final. Requiere comprobación manual/visual de un certificado de alumno regular para activar beneficios. Puede comprar productos por delivery, canjear descuentos o agendar servicios.
*   **Comercio / Cluber (`cluber`)**: Paga una suscripción en Mercado Pago mensual ($25k, $35k, $50k) para pertenecer al ecosistema. Tienen un panel de administración (`panel-cluber`) donde gestionan sus productos (con soporte para variantes y adicionales), aprueban/rechazan turnos de servicios y analizan sus ventas.
*   **Cadete / Rider (`rider`)**: Sistema logístico descentralizado. Hacen un proceso de Onboarding complejo subiendo su DNI y Selfie. Pagan $25.000 mensuales de membresía. Visualizan un Dashboard de mapa 3D con entregas pendientes.
*   **Administrador (`admin`)**: Superusuario de Estuclub. Gestiona el CMS, aprueba identidades, modifica roles, impone la verificación de alumnos, y expulsa/activa usuarios.

## 3. Interfaces Clave y Modelo de Datos (Firestore)
La base de datos NoSQL sigue una estructura plana optimizada para lecturas masivas.

- **Colección `users`**: Contiene todo usuario (Student, Cluber, Rider). Campos varian según el rol (ej: estado de suscripción `membershipPaidUntil`, estatus de estudiante `studentStatus`, o datos de DNI).
- **Colección `products`**: Los items del menú. Han sido evolucionados para soportar `variants` (e.g. Tamaño: Chico, Mediano) y `addons` (Adicionales como Queso).
- **Colección `orders`**: Los pedidos de delivery generados. Poseen integración compleja `logistics_split` y ciclos de estado: `pending -> accepted -> searching_rider -> assigned -> at_store -> on_the_way -> delivered -> completed`.
- **Colección `supplier_requests` / `rider_requests`**: Colecciones transitorias donde caen temporalmente las postulaciones antes de que un admin las analice y procese el Alta definitiva del comercio/rider.

## 4. Filosofía de Sistema y Arquitectura de Código
- **Diseño (UI/UX)**: Es una premisa fundamental de Estuclub. Todo debe sentirse _Premium_, moderno y altamente fluido. Se prioriza fuertemente el _Glassmorphism_, paletas en modo oscuro/profundo, contrastes elegantes, tipografía gruesa y cursiva (Italic Black Montserrat/Inter), animaciones `AnimatePresence` de Framer y el color primario identitario de marca es el _Rosa Estuclub_ (`#cb465a` o equivalentemente llamativo).
- **Seguridad y Trazabilidad**: 
  - Las rutas API internas están protegidas decodificando el Bearer Token (`adminAuth.verifyIdToken(token)`).
  - Los Webhooks de Mercado pago están asegurados verificando el hash asimétrico `x-signature`.
- **Líneas de Diseño de Código**: Tipado fuerte (`src/types/data.ts`), Server Actions centralizados para operaciones críticas que requieren atomicidad (manejo de roles, integraciones de pago y transiciones de estado logístico), hooks extensivos de Firestore.

## Estado Actual (Fase: Alerta Roja Pre-Lanzamiento)
La plataforma cuenta con los paneles operativos funcionales de `admin`, `cluber`, y `rider`. Recientemente se completó una estabilización crítica de pre-lanzamiento que incluye:

1. **Arquitectura Financiera (Split Payments):** 
   - El checkout de Mercado Pago opera en modo Marketplace descentralizado. Los pagos se dirigen directamente a las credenciales (`mp_credentials`) de cada Comercio, reteniendo automáticamente un *Marketplace Fee* fijo de la plataforma ($500 ARS).
   - El costo de envío está excluido de la pasarela digital; el Rider recauda el envío directamente en Efectivo o Transferencia en puerta.

2. **Seguridad y Atomicidad de Estados (Server Actions):**
   - Transiciones críticas (ej: Comercio acepta pedido, Rider toma viaje, Rider finaliza con PIN) se manejan vía **Server Actions** usando transacciones atómicas de Firestore (`adminDb.runTransaction`).
   - Todos los Server Actions validan identidad criptográficamente en el backend (`adminAuth.verifyIdToken`) previniendo ataques de inyección, Race Conditions y cancelaciones simultáneas.
   - El `deliveryPin` está protegido mediante Firestore Rules de lectura/escritura, ofuscando su modificación no autorizada.
