import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { FirebaseProvider } from "@/firebase/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { MessagingProvider } from "@/firebase/messaging";
import { Suspense } from "react";
import { StatusBarConfig } from "@/components/layout/status-bar-config";
import Loading from "./loading";
import VerificationGate from "@/components/auth/verification-gate";
import { CartProvider } from "@/context/cart-context";
import { AdminProvider } from "@/context/admin-context";
import { FloatingAdminMetrics } from "@/components/analytics/FloatingAdminMetrics";

const fontSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" }
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: {
    default: "EstuClub - Plataforma Estudiantil",
    template: "%s | EstuClub"
  },
  description: "La comunidad exclusiva con los mejores beneficios y descuentos para estudiantes. ¡Mismo Boutique Creativa!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EstuClub",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://estuclub.com.ar",
    title: "EstuClub - Mismo Boutique Creativa",
    description: "La comunidad de beneficios exclusivos para estudiantes más grande. ¡Descubre increíbles descuentos en tu ciudad!",
    siteName: "EstuClub",
    images: [{
      url: "https://estuclub.com.ar/og-image.jpg",
      width: 1200,
      height: 630,
      alt: "EstuClub - Plataforma Estudiantil"
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EstuClub - Mismo Boutique Creativa",
    description: "La comunidad exclusiva con los mejores beneficios y descuentos para estudiantes. ¡Súmate a EstuClub!",
    images: ["https://estuclub.com.ar/og-image.jpg"],
  },
  icons: {
    icon: '/favicon.png',          // El icono pequeño (48x48 o similar)
    shortcut: '/icon-192.png',     // El de 192px
    apple: '/icon-192.png',        // Apple se ve mejor con un PNG cuadrado
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("min-h-screen mesh-gradient animate-mesh font-sans antialiased overflow-x-hidden", fontSans.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StatusBarConfig />
          <Suspense fallback={<Loading />}>
            <FirebaseProvider>
              <AdminProvider>
                <VerificationGate>
                  <CartProvider>
                    <MessagingProvider>
                      {children}
                      <FloatingAdminMetrics />
                    </MessagingProvider>
                  </CartProvider>
                </VerificationGate>
              </AdminProvider>
              <Toaster />
            </FirebaseProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
