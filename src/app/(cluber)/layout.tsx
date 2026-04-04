'use client';

import MainLayout from "@/components/layout/main-layout";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CluberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { roles, isUserLoading } = useUser();
  const router = useRouter();

  const hasAccess = roles.includes('supplier') || roles.includes('admin');

  useEffect(() => {
    if (!isUserLoading && !hasAccess) {
      router.replace('/');
    }
  }, [isUserLoading, hasAccess, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">CARGANDO PANEL...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) return null;

  return (
    <div className="bg-white min-h-screen selection:bg-primary/10">
      <MainLayout>{children}</MainLayout>
    </div>
  );
}

