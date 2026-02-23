
'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, Gift, Megaphone } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import { useMemo } from 'react';

interface Notification {
    id: string;
    title: string;
    description: string;
    type: 'benefit' | 'announcement';
    referenceId: string;
    createdAt: Timestamp;
}

const typeIcons = {
    benefit: Gift,
    announcement: Megaphone
};

function formatTime(timestamp: Timestamp) {
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


function NotificationList() {
    const firestore = useFirestore();
    const notificationsQuery = useMemo(
        () => query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc'), limit(10)),
        [firestore]
    );

    const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);
    
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
                        <div className="flex items-start gap-3 p-2 hover:bg-accent rounded-md">
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
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell className="w-6 h-6 stroke-[1.5]" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#d83762] rounded-full border-2 border-white dark:border-slate-900"></span>
          <span className="sr-only">Abrir notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
            <h4 className="font-medium leading-none">Notificaciones</h4>
        </div>
        <Separator />
        <NotificationList />
      </PopoverContent>
    </Popover>
  );
}
