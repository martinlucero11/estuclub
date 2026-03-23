'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AnnouncementDialog from './announcement-dialog';
import { cn, optimizeImage } from '@/lib/utils';
import { Link2 } from 'lucide-react';
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
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOMY2BgGwAFGwECEj4DKAAAAABJRU5ErkJggg==';

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
    <Card className={cn('flex h-full flex-col overflow-hidden transition-all duration-500 hover:scale-[1.02] rounded-[2rem] border-primary/5 glass glass-dark shadow-premium group', className)}>
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={optimizeImage(imageUrl, 800)}
          alt={announcement.title}
          fill
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3">
          <h3 className="text-lg font-black tracking-tight line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {announcement.title}
          </h3>
        </div>
        <div className="flex-grow">
          <p className="text-sm text-muted-foreground/80 line-clamp-3 font-medium leading-relaxed">
            {announcement.content}
          </p>
        </div>
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-primary/5 text-xs">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7 rounded-xl border border-primary/10">
              <AvatarFallback className="font-black bg-primary/10 text-primary text-[10px]">{authorInitial}</AvatarFallback>
            </Avatar>
            <span className="font-bold tracking-tight text-muted-foreground">@{announcement.authorUsername}</span>
          </div>
          <div className="flex items-center gap-3">
            {announcement.linkUrl && (
              <Link href={announcement.linkUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all">
                <Link2 className="h-3.5 w-3.5" />
              </Link>
            )}
            <span className="font-bold text-muted-foreground/60">{formatTime(announcement.createdAt)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
  
  // Variant: Carousel
  if (variant === 'carousel') {
    const carouselCardContent = (
      <Card className={'relative h-full w-full overflow-hidden text-white transition-all duration-500 hover:scale-[1.02] rounded-[2rem] border-0 shadow-premium group'}>
        <Image
          src={optimizeImage(imageUrl, 1000)}
          alt={announcement.title}
          fill
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500 group-hover:from-primary/90" />
        <div className="relative z-10 flex h-full flex-col justify-end p-6">
          <div className="space-y-2">
            <span className="inline-block px-2 py-0.5 rounded-lg bg-primary/20 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary-foreground">
              Novedad
            </span>
            <h3 className="text-xl md:text-2xl font-black tracking-tighter line-clamp-2 leading-tight drop-shadow-md">
              {announcement.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 pt-4 text-xs font-bold text-white/80">
            <Avatar className="h-6 w-6 rounded-lg border border-white/20">
              <AvatarFallback className="bg-white/10 backdrop-blur-sm text-white font-black text-[10px]">{authorInitial}</AvatarFallback>
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
