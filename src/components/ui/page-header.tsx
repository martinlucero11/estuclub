
'use client';
import { BackButton } from '@/components/ui/back-button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    children?: React.ReactNode; // For actions
    className?: string;
}

export function PageHeader({ title, children, className }: PageHeaderProps) {
    return (
        <header className={cn("relative flex items-center justify-center h-14 mb-4", className)}>
            <div className="absolute left-0">
                <BackButton />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground truncate px-12">
                {title}
            </h1>
            <div className="absolute right-0">
                {children}
            </div>
        </header>
    );
}
