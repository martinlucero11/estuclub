'use client';

import Link from 'next/link';
import { Home, Search, Ghost } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import MainLayout from '@/components/layout/main-layout';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-20 max-w-2xl min-h-[70vh] flex flex-col justify-center">
        <div className="text-center mb-10 space-y-4">
            <h1 className="text-8xl font-black italic tracking-tighter text-primary/20 leading-none">404</h1>
            <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">Página Perdida en el Espacio</h2>
            <p className="text-sm font-medium text-foreground italic max-w-sm mx-auto">
                No pudimos encontrar lo que buscabas. Pero no te vayas, ¡tenemos el desafío de Mismuki esperándote!
            </p>
        </div>

        <PremiumEmptyState 
            icon={Ghost}
            title="¡Perdidos!"
            description="Mientras buscas el camino de regreso, ¿por qué no intentas superar tu récord en Mismuki The Game?"
            actionLabel="Volver al Inicio"
            onAction={() => router.push('/')}
            showGame={true}
        />

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Button variant="outline" asChild className="rounded-xl font-bold uppercase tracking-widest text-[10px] gap-2">
                <Link href="/search"><Search className="h-3.5 w-3.5" /> Buscar beneficios</Link>
            </Button>
            <Button variant="ghost" asChild className="rounded-xl font-bold uppercase tracking-widest text-[10px] gap-2">
                <Link href="/"><Home className="h-3.5 w-3.5" /> Ir a la Home</Link>
            </Button>
        </div>
      </div>
    </MainLayout>
  );
}

