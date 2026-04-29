'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const PUBLIC_PATHS = ['/coming-soon', '/login', '/signup', '/register'];

export default function ComingSoonGuard({ children }: { children: React.ReactNode }) {
  const { roles, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = roles.includes('admin');
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  useEffect(() => {
    if (!mounted || isUserLoading) return;
    
    if (!isAdmin && !isPublicPath) {
      router.replace('/coming-soon');
    }
  }, [mounted, isUserLoading, isAdmin, isPublicPath, router]);

  // Loading state while determining auth or waiting for hydration
  if (!mounted || isUserLoading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="h-10 w-10 text-[#cb465a] animate-spin" />
      </div>
    );
  }

  // Prevent flash of content before redirect takes place
  if (!isAdmin && !isPublicPath) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="h-10 w-10 text-[#cb465a] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
