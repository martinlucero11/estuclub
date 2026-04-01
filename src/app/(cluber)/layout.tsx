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

  if (isUserLoading) return null;
  if (!hasAccess) return null;

  return <MainLayout>{children}</MainLayout>;
}
