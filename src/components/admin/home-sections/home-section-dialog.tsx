
'use client';

import type { HomeSection } from '@/types/data';

interface HomeSectionDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    section?: HomeSection | null;
}

// This component is deprecated and is no longer used.
// The new dialog is located in /components/admin/home-builder/home-section-dialog.tsx
export function HomeSectionDialog({ isOpen, onOpenChange, section }: HomeSectionDialogProps) {
    return null;
}
