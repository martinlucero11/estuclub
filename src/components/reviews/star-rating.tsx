'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  max?: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StarRating({ 
  rating, 
  max = 5, 
  onRatingChange, 
  readonly = false,
  size = 'md',
  className
}: StarRatingProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        const isActive = starValue <= rating;

        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onRatingChange?.(starValue)}
            className={cn(
              "transition-all duration-200",
              readonly ? "cursor-default" : "hover:scale-110 active:scale-95",
              isActive ? "text-yellow-400" : "text-foreground dark:text-foreground"
            )}
          >
            <Star 
              className={cn(
                sizes[size], 
                isActive && "fill-current"
              )} 
            />
          </button>
        );
      })}
    </div>
  );
}

