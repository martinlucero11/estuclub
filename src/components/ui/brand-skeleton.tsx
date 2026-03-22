'use client';

import { cn } from "@/lib/utils";

interface BrandSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Premium Brand-Themed Skeleton Loader
 * Uses a sophisticated pink gradient shimmer instead of generic gray.
 */
export function BrandSkeleton({ className, ...props }: BrandSkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/20",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-primary/10 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}
