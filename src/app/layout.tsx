
import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/theme-provider';
import { FirebaseProvider } from '@/firebase/provider';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-body',
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
      <body className={`${ptSans.variable} font-body antialiased bg-slate-50 dark:bg-slate-950`}>
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
