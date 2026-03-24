import { type Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface PremiumEmptyStateProps {
  icon: Icon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  hideAction?: boolean;
  className?: string;
}

export function PremiumEmptyState({ 
    icon: Icon, 
    title, 
    description, 
    actionLabel, 
    onAction, 
    hideAction, 
    className 
}: PremiumEmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-primary/20 p-12 text-center",
      "glass glass-dark shadow-premium backdrop-blur-md transition-all duration-300",
      className
    )}>
      <div className="mb-6 p-4 rounded-3xl bg-primary/5 text-primary border border-primary/10 shadow-inner group flex items-center justify-center">
        <Icon className="h-10 w-10 opacity-70" />
      </div>
      <h3 className="text-xl font-black uppercase tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground font-medium max-w-[280px] mx-auto opacity-70 italic mb-6">{description}</p>
      
      {!hideAction && actionLabel && onAction && (
          <Button onClick={onAction} className="rounded-xl shadow-premium-glow px-8 h-12 text-sm uppercase tracking-wider font-bold">
              {actionLabel}
          </Button>
      )}
    </div>
  );
}
