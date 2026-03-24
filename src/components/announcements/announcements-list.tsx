

'use client';

import AnnouncementCard from './announcement-card';
import type { SerializableAnnouncement } from '@/types/data';
import { EmptyState } from '../ui/empty-state';
import { Megaphone } from 'lucide-react';

export default function AnnouncementsList({ announcements }: { announcements: SerializableAnnouncement[]}) {

  if (!announcements || announcements.length === 0) {
    return (
      <EmptyState 
        icon={Megaphone}
        title="No hay anuncios"
        description="Parece que no hay nada nuevo que mostrar. ¡Vuelve más tarde!"
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {announcements.map((announcement) => (
        <AnnouncementCard key={announcement.id} announcement={announcement} />
      ))}
    </div>
  );
}
