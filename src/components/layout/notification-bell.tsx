'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, Gift, Megaphone } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import { useMemo, useState, useEffect } from 'react';
import { createConverter } from '@/lib/firestore-converter';
import type { Notification } from '@/types/data';

const typeIcons = {
    benefit: Gift,
    announcement: Megaphone
};

function formatTime(timestamp: Notification['createdAt']) {
    if (!timestamp) return 'Justo ahora';
    const date = timestamp.toDate();
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


function NotificationList({ notifications, isLoading }: { notifications: Notification[] | undefined, isLoading: boolean }) {
    if (isLoading) {
        return (
            <div className="space-y-2 p-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }
    
    if (!notifications || notifications.length === 0) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                No tienes notificaciones nuevas.
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2 p-2">
            {notifications.map((notification, index) => {
                const Icon = typeIcons[notification.type] || Bell;
                return (
                    <div key={notification.id}>
                        <div className="flex items-start gap-3 p-2 hover:bg-accent rounded-md cursor-pointer transition-colors">
                             <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                                <Icon className="h-4 w-4 text-secondary-foreground" />
                            </div>
                            <div className='flex-1'>
                                <p className="text-sm font-medium">{notification.title}</p>
                                <p className="text-sm text-muted-foreground">{notification.description}</p>
                                <p className="text-xs text-muted-foreground pt-1">{formatTime(notification.createdAt)}</p>
                            </div>
                        </div>
                         {index < notifications.length - 1 && <Separator />}
                    </div>
                )
            })}
        </div>
    )
}

export default function NotificationBell() {
    const firestore = useFirestore();
    const notificationsQuery = useMemo(
        () => query(collection(firestore, 'notifications').withConverter(createConverter<Notification>()), orderBy('createdAt', 'desc'), limit(10)),
        [firestore]
    );

    const { data: notifications, isLoading } = useCollection(notificationsQuery);
    
    const [hasUnread, setHasUnread] = useState(false);
    
    useEffect(() => {
        if (notifications && notifications.length > 0) {
            const latestNotifTime = notifications[0].createdAt?.toDate().getTime() || 0;
            const lastReadTime = parseInt(localStorage.getItem('estuclub_last_read_notifications') || '0', 10);
            if (latestNotifTime > lastReadTime) {
                setHasUnread(true);
            }
        }
    }, [notifications]);

    const handleOpenChange = (open: boolean) => {
        if (open) {
            setHasUnread(false);
            localStorage.setItem('estuclub_last_read_notifications', Date.now().toString());
        }
    };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative p-2 rounded-full text-white hover:bg-white/20 hover:text-white transition-colors group" aria-label="Ver Notificaciones">
          <Bell className="w-5 h-5 stroke-[2] group-hover:scale-110 transition-transform" />
          {hasUnread && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full border border-primary/20 animate-pulse shadow-glow-pink"></span>
          )}
          <span className="sr-only">Abrir notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
            <h4 className="font-semibold text-sm leading-none">Notificaciones</h4>
        </div>
        <NotificationList notifications={notifications} isLoading={isLoading} />
      </PopoverContent>
    </Popover>
  );
}