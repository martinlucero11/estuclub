'use client';

import React, { useRef, useState } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface MagneticButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  strength?: number; // How much it moves (default 40)
}

export const MagneticButton = React.forwardRef<HTMLDivElement, MagneticButtonProps>(({
  children,
  className,
  onClick,
  disabled,
  strength = 40,
  ...props
}, ref) => {
  const innerRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = (ref as any)?.current?.getBoundingClientRect() || innerRef.current!.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    x.set(middleX * (strength / 100));
    y.set(middleY * (strength / 100));
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={ref || innerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      className={cn("relative inline-block", className)}
    >
      <motion.div
        style={{
          x: springX,
          y: springY,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          if (!disabled) {
            haptic.vibrateImpact();
            onClick?.(e as any);
          }
        }}
        {...(props as any)}
      >
        {children}
      </motion.div>
    </div>
  );
});

MagneticButton.displayName = "MagneticButton";
