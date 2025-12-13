
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import AnnouncementDialog from './announcement-dialog';
import { cn } from '@/lib/utils';
import { Link2 } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorUsername: string;
  createdAt: string; // Expect a string
  imageUrl?: string;
  linkUrl?: string;
}

interface AnnouncementCardProps {
  announcement: Announcement;
  variant?: 'default' | 'carousel';
  className?: string;
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

const fallbackImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOMY2BgGwAFGwECEj4DKAAAAABJRU5ErkJggg==";


export default function AnnouncementCard({ announcement, variant = 'default', className }: AnnouncementCardProps) {
  const authorInitial = announcement.authorUsername ? announcement.authorUsername.charAt(0).toUpperCase() : 'A';
  const imageUrl = announcement.imageUrl || fallbackImageUrl;

  const cardContent = (
    <Card className={cn('flex h-full flex-col overflow-hidden transition-all hover:shadow-lg', className)}>
        <div className="relative h-48 w-full">
            <Image
                src={imageUrl}
                alt={announcement.title}
                fill
                className="object-cover"
            />
        </div>
        <div className="flex flex-1 flex-col">
            <CardHeader>
                <CardTitle className="line-clamp-2">{announcement.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                 <p className="text-sm text-muted-foreground line-clamp-3">{announcement.content}</p>
            </CardContent>
            <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                        <AvatarFallback>{authorInitial}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">@{announcement.authorUsername}</span>
                </div>
                <div className="flex items-center gap-2">
                    {announcement.linkUrl && (
                        <Link href={announcement.linkUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <Link2 className="h-4 w-4 hover:text-primary" />
                        </Link>
                    )}
                    <span>{formatTime(announcement.createdAt)}</span>
                </div>
            </CardFooter>
        </div>
    </Card>
  );
  
  if (variant === 'carousel') {
      const carouselCardContent = (
        <Card className={cn('relative h-full overflow-hidden text-white transition-all hover:shadow-lg', className)}>
            <Image
                src={imageUrl}
                alt={announcement.title}
                fill
                className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 flex h-full flex-col justify-between p-4">
                <div className="flex-grow">
                    <CardTitle className="text-xl line-clamp-2">{announcement.title}</CardTitle>
                </div>
                 <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Avatar className="h-6 w-6 text-foreground">
                        <AvatarFallback>{authorInitial}</AvatarFallback>
                    </Avatar>
                    <span>{formatTime(announcement.createdAt)}</span>
                </div>
            </div>
        </Card>
      )
      return (
        <AnnouncementDialog announcement={announcement}>
          <div className="h-full cursor-pointer">{carouselCardContent}</div>
        </AnnouncementDialog>
      )
  }
  
  return (
    <AnnouncementDialog announcement={announcement}>
      <div className="h-full cursor-pointer">{cardContent}</div>
    </AnnouncementDialog>
  )
}
