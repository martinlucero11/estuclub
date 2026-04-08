'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  imageClassName?: string;
}

export function OptimizedImage({
  src,
  alt,
  className,
  fill = false,
  width,
  height,
  priority = false,
  imageClassName,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center bg-black/5 overflow-hidden',
          className
        )}
        style={!fill ? { width, height } : undefined}
      >
        <div className="flex flex-col items-center gap-2 opacity-20">
          <ImageIcon className="h-10 w-10" />
          {!fill && (
            <span className="text-[10px] font-black uppercase tracking-widest italic">
              Estuclub
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={!fill ? { width, height } : undefined}
    >
      {isLoading && (
        <Skeleton className="absolute inset-0 z-10 rounded-none h-full w-full" />
      )}
      <Image
        src={src}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        fill={fill}
        priority={priority}
        className={cn(
          'transition-all duration-700 ease-in-out',
          isLoading ? 'scale-105 blur-lg opacity-0' : 'scale-100 blur-0 opacity-100',
          imageClassName
        )}
        onLoadingComplete={handleLoad}
        onError={handleError}
        unoptimized={src.startsWith('http')}
        {...props}
      />
    </div>
  );
}
