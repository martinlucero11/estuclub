'use client';

import Image from 'next/Image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AnnouncementDialog from './announcement-dialog';
import { cn, optimizeImage } from '@/lib/utils';
import { Link2 } from '@phosphor-icons/react';
import type { SerializableAnnouncement } from '@/types/data';

interface AnnouncementCardProps {
  announcement: SerializableAnnouncement;
  variant?: 'default' | 'carousel';
  className?: string;
  priority?: boolean;
}

function formatTime(isoString: string) {
  if (!isoString) return 'Justo ahora';
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
  if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  return 'Justo ahora';
}

const fallbackImageUrl =
  'data:Image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOMY2BgGwAFGwECEj4DKAAAAABJRU5ErkJggg==';

export default function AnnouncementCard({
  announcement,
  variant = 'default',
  className,
  priority = false,
}: AnnouncementCardProps) {
  const authorInitial = announcement.authorUsername ? announcement.authorUsername.charAt(0).toUpperCase() : 'A';
  const imageUrl = announcement.imageUrl || fallbackImageUrl;

  // Variant: Default (non-carousel)
  const cardContent = (
    <Card className={cn('flex h-full flex-col overflow-hidden transition-all duration-700 hover:scale-[1.02] rounded-[2.5rem] border-white/5 glass glass-dark shadow-premium group hover:shadow-primary/10 hover:border-primary/20', className)}>
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={optimizeImage(imageUrl, 800)}
          alt={announcement.title}
          fill
          priority={priority}
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, 50vw" weight="duotone" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3">
          <h3 className="text-xl font-black tracking-tighter line-clamp-2 group-hover:text-primary transition-colors leading-[1.1] drop-shadow-sm">
            {announcement.title}
          </h3>
        </div>
        <div className="flex-grow">
          <p className="text-sm text-muted-foreground/90 line-clamp-3 font-medium leading-relaxed tracking-tight">
            {announcement.content}
          </p>
        </div>
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-primary/10 text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 rounded-2xl border border-primary/20 bg-primary/5 shadow-inner">
              <AvatarFallback className="font-black bg-transparent text-primary">{authorInitial}</AvatarFallback>
            </Avatar>
            <span className="text-foreground/70 group-hover:text-primary transition-colors">@{announcement.authorUsername}</span>
          </div>
          <div className="flex items-center gap-3">
            {announcement.linkUrl && (
              <Link href={announcement.linkUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-lg hover:scale-110">
                <Link2 className="h-4 w-4" />
              </Link>
            )}
            <span className="text-muted-foreground/40">{formatTime(announcement.createdAt)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
  
  // Variant: Carousel
  if (variant === 'carousel') {
    const carouselCardContent = (
      <Card className={'relative h-full w-full overflow-hidden text-white transition-all duration-700 hover:scale-[1.02] rounded-[2.5rem] border-white/5 shadow-premium group hover:shadow-primary/20 hover:border-primary/30'}>
        <Image
          src={optimizeImage(imageUrl, 1000)}
          alt={announcement.title}
          fill
          priority={priority}
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, 50vw" weight="duotone" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-all duration-700 group-hover:from-primary/60 group-hover:via-black/20" />
        <div className="relative z-10 flex h-full flex-col justify-end p-7">
          <div className="space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/20 backdrop-blur-xl border border-primary/30 text-[9px] font-black uppercase tracking-[0.2em] text-primary-foreground shadow-xl animate-pulse">
              Novedad
            </span>
            <h3 className="text-2xl md:text-3xl font-black tracking-tighter line-clamp-2 leading-[0.9] drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] group-hover:scale-[1.02] transition-transform duration-500 origin-left">
              {announcement.title}
            </h3>
          </div>
          <div className="flex items-center gap-3 pt-6 text-[10px] font-black uppercase tracking-widest text-white/70">
            <Avatar className="h-7 w-7 rounded-xl border border-white/20 shadow-2xl">
              <AvatarFallback className="bg-white/10 backdrop-blur-md text-white font-black">{authorInitial}</AvatarFallback>
            </Avatar>
            <span>{formatTime(announcement.createdAt)}</span>
          </div>
        </div>
      </Card>
    );

    return (
      <AnnouncementDialog announcement={announcement}>
        <div className={cn('cursor-pointer h-full', className)}> 
            {carouselCardContent}
        </div>
      </AnnouncementDialog>
    );
  }

  // Return default card if not carousel
  return (
    <AnnouncementDialog announcement={announcement}>
      <div className="h-full cursor-pointer">{cardContent}</div>
    </AnnouncementDialog>
  );
}
