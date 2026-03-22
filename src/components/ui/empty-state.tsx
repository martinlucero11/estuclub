
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-primary/20 p-12 text-center",
      "glass glass-dark shadow-premium backdrop-blur-md",
      className
    )}>
      <div className="mb-6 p-4 rounded-3xl bg-primary/5 text-primary border border-primary/10 shadow-inner">
        <Icon className="h-10 w-10 opacity-70" />
      </div>
      <h3 className="text-xl font-black uppercase tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground font-medium max-w-[250px] mx-auto opacity-70 italic">{description}</p>
    </div>
  );
}
