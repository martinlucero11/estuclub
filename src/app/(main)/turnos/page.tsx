
'use client';

import MainLayout from '@/components/layout/main-layout';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarClock, Zap } from 'lucide-react';
import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { HomeSection } from '@/types/data';
import { useMemo } from 'react';
import { createConverter } from '@/lib/firestore-converter';
import { Button } from '@/components/ui/button';
import HomeSectionRenderer from '@/components/home/home-section-renderer';

function TurnsHomeSkeleton() {
    return (
        <div className="space-y-12">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                    <Skeleton className="h-4 w-48 rounded-full" />
                    <div className="flex gap-4 overflow-hidden">
                        {[...Array(3)].map((_, j) => (
                            <Skeleton key={j} className="h-48 min-w-[280px] rounded-[2.5rem]" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function TurnsHomeSections() {
    const firestore = useFirestore();
    
    const sectionsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'home_sections').withConverter(createConverter<HomeSection>()),
            where('targetBoard', '==', 'turns'),
            where('isActive', '==', true),
            orderBy('order', 'asc')
        );
    }, [firestore]);

    const { data: sections, isLoading, error } = useCollection(sectionsQuery);

    if (isLoading) return <TurnsHomeSkeleton />;

    if (error) {
        return (
            <div className="py-20 text-center">
                <p className="text-destructive font-bold uppercase tracking-widest text-[10px]">Error de Conexión</p>
                <p className="text-foreground opacity-40 text-xs mt-2">{error.message}</p>
            </div>
        );
    }

        return (
            <EmptyState
                icon={Zap}
                title="Próximamente"
                description="Estamos preparando las mejores opciones para tus turnos. ¡Vuelve pronto!"
            >
                <Button asChild variant="outline" className="rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest">
                    <Link href="/admin/home-builder">Configurar en Admin</Link>
                </Button>
            </EmptyState>
        );

    return (
        <div className="space-y-12 pb-20 animate-in fade-in duration-1000">
            {sections.map((section) => (
                <div key={section.id} className="space-y-6">
                    {section.title && (
                        <div className="flex items-center gap-4 px-1">
                             <div className="h-1 w-8 bg-primary rounded-full hidden md:block" />
                             <h2 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase font-montserrat">
                                {section.title}
                             </h2>
                        </div>
                    )}
                    <HomeSectionRenderer section={section} />
                </div>
            ))}
        </div>
    );
}

export default function TurnosPage() {
    return (
        <MainLayout>
            <BackButton />
            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="space-y-2">
                        <PageHeader title="Agendar Turnos" className="p-0 border-none bg-transparent shadow-none" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                             Servicios • Profesionales • Estética
                        </p>
                    </div>
                    
                    <Button asChild className="h-14 px-10 rounded-[1.5rem] bg-primary text-white font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-all">
                        <Link href="/mis-turnos">
                            <CalendarClock className="mr-3 h-5 w-5" />
                            Mis Turnos
                        </Link>
                    </Button>
                </header>

                <TurnsHomeSections />
            </div>
        </MainLayout>
    );
}

