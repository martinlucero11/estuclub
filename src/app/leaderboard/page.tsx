'use client';

import { useMemo } from 'react';
import { useCollectionOnce, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import MainLayout from '@/components/layout/main-layout';
import { createConverter } from '@/lib/firestore-converter';
import type { UserProfile } from '@/types/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, User as UserIcon, Star } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getLevelInfo } from '@/lib/gamification';

function LeaderboardItem({ profile, rank, isCurrentUser }: { profile: UserProfile, rank: number, isCurrentUser: boolean }) {
  const levelInfo = getLevelInfo(profile.points || 0);
  
  const rankColors: Record<number, string> = {
    1: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200',
    2: 'text-slate-400 bg-slate-50 dark:bg-slate-900/20 border-slate-200',
    3: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200',
  };

  const isTopThree = rank <= 3;

  return (
    <div className={cn(
      "flex items-center p-4 rounded-2xl border transition-all duration-200",
      isCurrentUser ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm" : "bg-card border-border/50",
      isTopThree ? "scale-[1.02] shadow-sm mb-2" : "mb-1"
    )}>
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-black italic mr-4",
        isTopThree ? (rankColors[rank]) : "text-muted-foreground bg-muted/30"
      )}>
        {rank === 1 ? <Trophy className="h-5 w-5" /> : rank}
      </div>

      <Avatar className="h-12 w-12 mr-4 border-2 border-background shadow-sm">
        <AvatarImage src={profile.photoURL || undefined} className="object-cover" />
        <AvatarFallback className="font-bold">{getInitials(profile.username || 'U')}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
            <h3 className="font-bold truncate text-foreground">
                {profile.firstName} {profile.lastName}
            </h3>
            {isCurrentUser && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-primary text-white px-2 py-0.5 rounded-full">TÚ</span>
            )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md", levelInfo.color)}>
                Niv {levelInfo.level}
            </span>
            <span className="text-xs text-muted-foreground font-medium">@{profile.username}</span>
        </div>
      </div>

      <div className="text-right ml-4">
        <div className="flex items-center justify-end gap-1 text-primary font-black text-xl">
            <Star className="h-4 w-4 fill-current" />
            <span>{profile.points || 0}</span>
        </div>
        <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-tighter">Puntos XP</p>
      </div>
    </div>
  );
}

function LeaderboardContent() {
  const firestore = useFirestore();
  const { user } = useUser();

  const leaderboardQuery = useMemo(() => {
    return query(
      collection(firestore, 'users').withConverter(createConverter<UserProfile>()),
      orderBy('points', 'desc'),
      limit(20)
    );
  }, [firestore]);

  const { data: users, isLoading } = useCollectionOnce(leaderboardQuery);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-10 space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 mb-2">
            <Trophy className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-black tracking-tighter">Ranking de EstuClub</h1>
        <p className="text-muted-foreground font-medium">Los estudiantes más activos de la comunidad</p>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          [...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))
        ) : (
          users?.map((profile, index) => (
            <LeaderboardItem 
              key={profile.id} 
              profile={profile} 
              rank={index + 1} 
              isCurrentUser={user?.uid === profile.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <MainLayout>
      <LeaderboardContent />
    </MainLayout>
  );
}
