
import type { Metadata } from 'next';
import { PT_Sans, Lobster } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase';
import { ThemeProvider } from '@/components/theme-provider';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
  display: 'swap', // Add display: swap for better font loading
});

const logoScript = Lobster({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-logo-script',
});

const graduationCapSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#D44459" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.084a1 1 0 0 0 0 1.838l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12v5c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-5"/></svg>`;
const faviconDataUri = `data:image/svg+xml;base64,${typeof window === 'undefined' ? Buffer.from(graduationCapSvg).toString('base64') : window.btoa(graduationCapSvg)}`;


export const metadata: Metadata = {
  title: 'EstuClub',
  description: 'Your one-stop hub for student benefits, discounts, and events.',
  icons: [{ rel: "icon", url: faviconDataUri }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${ptSans.variable} ${logoScript.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            {children}
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
