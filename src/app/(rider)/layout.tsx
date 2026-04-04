'use client';

import MainLayout from "@/components/layout/main-layout";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { roles, isUserLoading } = useUser();
  const router = useRouter();

  // Riders AND admins can access rider routes
  const hasAccess = roles.includes('rider') || roles.includes('admin');

  /* 
  // EMERGENCY DISABLE FOR DEMO
  useEffect(() => {
    if (!isUserLoading && !hasAccess) {
      router.replace('/');
    }
  }, [isUserLoading, hasAccess, router]);
  */

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#000000] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#cb465a] border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">CARGANDO...</p>
        </div>
      </div>
    );
  }

  // EMERGENCY DISABLE FOR DEMO
  // if (!hasAccess) return null;

  return (
    <div className="rider-night bg-[#000000] min-h-screen text-white selection:bg-[#cb465a]/30">
      <MainLayout>
        <div className="px-6 md:px-12 pt-24 pb-32 max-w-7xl mx-auto">
          {children}
        </div>
      </MainLayout>
    </div>
  );
}

