
'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { motion } from 'framer-motion';

interface BackButtonProps {
    className?: string;
    href?: string;
}

export function BackButton({ className, href }: BackButtonProps) {
    const router = useRouter();

    const handleClick = () => {
        haptic.vibrateSubtle();
        if (href) {
            router.push(href);
        } else {
            router.back();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn("fixed top-4 left-4 z-[60]", className)}
        >
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleClick} 
                aria-label="Volver atrás"
                className="h-12 w-12 rounded-2xl glass glass-dark border border-white/10 shadow-premium hover:bg-primary/10 transition-all duration-300"
            >
                <ChevronLeft className="h-6 w-6" />
                <span className="sr-only">Volver</span>
            </Button>
        </motion.div>
    );
}
