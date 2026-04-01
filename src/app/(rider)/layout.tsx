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

  useEffect(() => {
    if (!isUserLoading && !hasAccess) {
      router.replace('/');
    }
  }, [isUserLoading, hasAccess, router]);

  if (isUserLoading) return null;
  if (!hasAccess) return null;

  return (
    <div className="rider-night bg-[#050505] min-h-screen text-white selection:bg-[#d93b64]/30">
      <MainLayout>
        <div className="px-6 md:px-12 pt-24 pb-32 max-w-7xl mx-auto">
          {children}
        </div>
      </MainLayout>
    </div>
  );
}
