'use client';

import React from 'react';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';

// FIX: Restored the correct, fully-interactive Header and the BottomNav component to fix all navigation issues.

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <Header />
            <main className="flex-1 pb-20">{children}</main>
            <BottomNav />
        </div>
    );
}
