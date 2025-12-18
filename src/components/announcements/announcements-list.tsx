

'use client';

import AnnouncementCard from './announcement-card';
import type { SerializableAnnouncement } from '@/lib/data';

export default function AnnouncementsList({ announcements }: { announcements: SerializableAnnouncement[]}) {

  if (!announcements || announcements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
        <h3 className="text-xl font-semibold">No hay anuncios</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Parece que no hay nada nuevo que mostrar. ¡Vuelve más tarde!
        </p>
      </div>
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
