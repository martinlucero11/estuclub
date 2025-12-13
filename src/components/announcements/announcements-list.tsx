

'use client';

import AnnouncementCard from './announcement-card';

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

export default function AnnouncementsList({ announcements }: { announcements: Announcement[]}) {

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

