
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Open_Sans, Lobster } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseProvider } from '@/firebase/provider';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: '800',
  variable: '--font-logo-sans',
  display: 'swap',
});

const lobster = Lobster({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-logo-display',
  display: 'swap',
});


export const metadata: Metadata = {
  title: 'EstuClub',
  description: 'Your one-stop hub for student benefits, discounts, and events.',
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} ${openSans.variable} ${lobster.variable} font-body antialiased bg-slate-50 dark:bg-slate-950`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseProvider>
            {children}
          </FirebaseProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
