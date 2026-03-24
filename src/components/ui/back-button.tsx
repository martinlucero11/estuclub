
'use client';

import { useRouter } from 'next/navigation';
import { CaretLeft } from '@phosphor-icons/react';
import { Button } from './button';

export function BackButton() {
  const router = useRouter();

  return (
    <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver atrás">
      <CaretLeft className="h-6 w-6" />
      <span className="sr-only">Volver</span>
    </Button>
  );
}
