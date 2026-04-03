import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autenticación | EstuClub',
  description: 'Inicia sesión o regístrate en EstuClub.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background py-10 px-4 md:px-8">
      <div className="w-full max-w-2xl animate-in fade-in duration-500">
        {children}
      </div>
    </main>
  );
}
