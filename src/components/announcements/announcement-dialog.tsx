
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Link2 } from 'lucide-react';
import Link from 'next/link';
import type { SerializableAnnouncement } from '@/lib/data';

interface AnnouncementDialogProps {
  announcement: SerializableAnnouncement;
  children: React.ReactNode;
}


function formatTime(isoString: string) {
    if (!isoString) return 'Justo ahora';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
}

export default function AnnouncementDialog({ announcement, children }: AnnouncementDialogProps) {
  const authorInitial = announcement.authorUsername ? announcement.authorUsername.charAt(0).toUpperCase() : 'A';
  
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{announcement.title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground whitespace-pre-wrap">{announcement.content}</p>
        </div>
        <DialogFooter className="flex-wrap items-center justify-between text-sm text-muted-foreground sm:justify-between">
            <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                    <AvatarFallback>{authorInitial}</AvatarFallback>
                </Avatar>
                <span>@{announcement.authorUsername}</span>
            </div>
            <div className='flex items-center gap-4'>
                {announcement.linkUrl && (
                  <Button asChild variant="secondary" size="sm">
                    <Link href={announcement.linkUrl} target="_blank" rel="noopener noreferrer">
                      <Link2 className="mr-2 h-4 w-4" />
                      Visitar Enlace
                    </Link>
                  </Button>
                )}
                <span>{formatTime(announcement.createdAt)}</span>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
