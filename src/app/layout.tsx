import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "EstuClub",
  description: "La mejor app de beneficios para estudiantes",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
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
