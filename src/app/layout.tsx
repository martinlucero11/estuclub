import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Montserrat, Inter } from "next/font/google";
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

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

// ... (Metadatos se mantienen igual)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("min-h-screen flex flex-col bg-background font-sans antialiased selection:bg-primary/20", fontSans.variable, fontMontserrat.variable, fontInter.variable)}>
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
                        <FloatingAdminMetrics />
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
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_MAPS_API_KEY || "AIzaSyA5uoVL0SxsuSwaudRvZewzgHHEMGG8Fng"}&libraries=places,geometry`} 
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

