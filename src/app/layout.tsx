import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Montserrat, Inter, Lobster } from "next/font/google";
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
import { GlobalErrorBoundary } from "@/components/errors/global-error-boundary";
import Script from "next/script";

export const dynamic = 'force-dynamic';

const fontSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMontserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["700", "800"],
});

const fontLobster = Lobster({
  subsets: ["latin"],
  variable: "--font-lobster",
  weight: ["400"],
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "Estuclub - Beneficios y Delivery para Estudiantes",
  description: "La plataforma exclusiva para que los estudiantes encuentren los mejores beneficios y delivery en su ciudad.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            const originalConsoleWarn = console.warn;
            console.warn = function() {
              if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].includes('google.maps')) return;
              originalConsoleWarn.apply(console, arguments);
            };
            const originalConsoleError = console.error;
            console.error = function() {
              if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].includes('google.maps')) return;
              originalConsoleError.apply(console, arguments);
            };
          `
        }} />
      </head>
      <body className={cn("min-h-screen flex flex-col bg-background font-sans antialiased selection:bg-primary/20", fontSans.variable, fontMontserrat.variable, fontInter.variable, fontLobster.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <FirebaseProvider>
            <AdminProvider>
              <VerificationGate>
                <CartProvider>
                  <MessagingProvider>
                    <GlobalErrorBoundary>
                      <Suspense fallback={<Loading />}>
                        <StatusBarConfig />
                        {children}
                      </Suspense>
                    </GlobalErrorBoundary>
                  </MessagingProvider>
                </CartProvider>
              </VerificationGate>
              <Toaster />
            </AdminProvider>
          </FirebaseProvider>
        </ThemeProvider>
        <Script 
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry,marker,geocoding&v=weekly&loading=async`} 
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

