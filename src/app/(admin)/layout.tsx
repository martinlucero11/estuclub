'use client';

import MainLayout from "@/components/layout/main-layout";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { roles, isUserLoading } = useUser();
  const router = useRouter();

  // RULE 2: Admin gets through instantly
  const isAdmin = roles.includes('admin');

  useEffect(() => {
    // Only redirect AFTER loading is fully complete AND user is confirmed non-admin
    if (!isUserLoading && !isAdmin) {
      router.replace('/');
    }
  }, [isUserLoading, isAdmin, router]);

  // While loading, render nothing (prevents flash of redirect)
  if (isUserLoading) return null;

  // If not admin after loading, render nothing while redirect happens
  if (!isAdmin) return null;

  return <MainLayout>{children}</MainLayout>;
}
