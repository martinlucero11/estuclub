'use client';

import React from 'react';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 w-full pb-20">{children}</main>
            <BottomNav />
        </div>
    );
}
