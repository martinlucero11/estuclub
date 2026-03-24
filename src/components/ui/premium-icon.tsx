'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PremiumIconProps {
  icon: LucideIcon;
  className?: string;
  glow?: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

export function PremiumIcon({ 
  icon: Icon, 
  className, 
  glow = true, 
  color = 'text-primary',
  size = 'md' 
}: PremiumIconProps) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {glow && (
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={cn(
            "absolute inset-0 blur-lg rounded-full",
            color.replace('text-', 'bg-') + '/20'
          )}
        />
      )}
      <Icon 
        className={cn(
          sizeClasses[size],
          color,
          "relative z-10 drop-shadow-[0_0_8px_rgba(var(--primary),0.4)]",
          glow && "animate-pulse"
        )} 
      />
    </div>
  );
}
