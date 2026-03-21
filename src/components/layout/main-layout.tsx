'use client';

import React from 'react';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 w-full pb-10">{children}</main>
            
            {/* Legal Footer for Google Play Compliance */}
            <footer className="w-full text-center py-6 pb-24 text-xs text-muted-foreground border-t bg-muted/20">
                <div className="flex justify-center gap-4 flex-wrap px-4">
                    <a href="/politica-de-privacidad" className="hover:underline">Política de Privacidad</a>
                    <span>•</span>
                    <a href="/seguridad-infantil" className="hover:underline">Estándares de Seguridad Infantil</a>
                </div>
                <p className="mt-2 text-[10px] opacity-70">© {new Date().getFullYear()} EstuClub. Todos los derechos reservados.</p>
            </footer>

            <BottomNav />
        </div>
    );
}
