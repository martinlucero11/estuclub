'use client';

import { Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
}

export function ShareButton({ title, text, url, className }: ShareButtonProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentUrl = url || typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title,
      text: text || `¡Mira este beneficio en EstuClub: ${title}!`,
      url: currentUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
            console.error('Error sharing:', err);
            toast.error('No se pudo compartir');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(currentUrl);
        toast.success('¡Enlace copiado al portapapeles!');
      } catch (err) {
        toast.error('No se pudo copiar el enlace');
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={cn(
        "p-2 rounded-full transition-all duration-200 backdrop-blur-md bg-white/20 hover:bg-white/40 border border-white/20 text-white",
        className
      )}
      aria-label="Compartir beneficio"
    >
      <Share2 className="h-5 w-5" />
    </button>
  );
}
