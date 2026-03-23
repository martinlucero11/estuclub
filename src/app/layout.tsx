import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { FirebaseProvider } from "@/firebase/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { MessagingProvider } from "@/firebase/messaging";
import { Suspense } from "react";
import Loading from "./loading";

const fontSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" }
  ],
};

export const metadata: Metadata = {
  title: {
    default: "EstuClub - Plataforma Estudiantil",
    template: "%s | EstuClub"
  },
  description: "La comunidad exclusiva con los mejores beneficios y descuentos para estudiantes. ¡Mismo Boutique Creativa!",
  manifest: "/manifest.json",
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
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("min-h-screen mesh-gradient animate-mesh font-sans antialiased", fontSans.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={<Loading />}>
            <FirebaseProvider>
              <MessagingProvider>
                {children}
              </MessagingProvider>
              <Toaster />
            </FirebaseProvider>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
