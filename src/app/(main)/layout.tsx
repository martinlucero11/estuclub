'use client';

import React from 'react';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import Footer from '@/components/layout/footer';
import { usePlatform } from '@/hooks/use-platform';

export default function MainGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isWeb } = usePlatform();

  return (
    <>
      <Header />
      {children}
      {isWeb && <Footer />}
      <BottomNav />
    </>
  );
}
