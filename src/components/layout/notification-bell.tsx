'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, Gift, Megaphone } from 'lucide-react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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


function NotificationList({ 
    notifications, 
    isLoading, 
    onItemClick 
}: { 
    notifications: Notification[] | undefined, 
    isLoading: boolean,
    onItemClick: (n: Notification) => void
}) {
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
                    <div key={notification.id} onClick={() => onItemClick(notification)}>
                        <div className="flex items-start gap-3 p-3 hover:bg-accent/50 rounded-xl cursor-pointer transition-all active:scale-[0.98]">
                             <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
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
    const router = useRouter();
    const { user } = useUser();
    const [open, setOpen] = useState(false);
    const notificationsQuery = useMemo(
        () => {
            if (!user) return null;
            return query(collection(firestore, 'notifications').withConverter(createConverter<Notification>()), orderBy('createdAt', 'desc'), limit(10));
        },
        [firestore, user]
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

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (newOpen) {
            setHasUnread(false);
            localStorage.setItem('estuclub_last_read_notifications', Date.now().toString());
        }
    };

    const handleNotificationClick = (n: Notification) => {
        setOpen(false);
        if (n.type === 'benefit') {
            router.push(`/perks/view?id=${n.referenceId}`);
        } else if (n.type === 'announcement') {
            router.push(`/announcements`);
        } else if (n.type === 'appointment') {
            router.push(`/mis-turnos/view?id=${n.referenceId}`);
        }
    };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
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
            <h4 className="font-bold text-xs uppercase tracking-widest text-primary">Notificaciones</h4>
        </div>
        <NotificationList 
            notifications={notifications} 
            isLoading={isLoading} 
            onItemClick={handleNotificationClick}
        />
      </PopoverContent>
    </Popover>
  );
}