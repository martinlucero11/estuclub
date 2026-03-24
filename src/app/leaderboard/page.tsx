'use client';

import { useMemo } from 'react';
import { useCollectionOnce, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import MainLayout from '@/components/layout/main-layout';
import { createConverter } from '@/lib/firestore-converter';
import type { UserProfile } from '@/types/data';
import { BrandSkeleton } from '@/components/ui/brand-skeleton';
import { Trophy, Medal, User as UserIcon, Star } from '@phosphor-icons/react';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getLevelInfo } from '@/lib/gamification';

function LeaderboardItem({ profile, rank, isCurrentUser, index }: { profile: UserProfile, rank: number, isCurrentUser: boolean, index: number }) {
  const levelInfo = getLevelInfo(profile.points || 0);
  
  const rankColors: Record<number, string> = {
    1: 'text-amber-500 bg-amber-50/50 dark:bg-amber-900/20 border-amber-200/50 shadow-[0_0_15px_rgba(251,191,36,0.2)]',
    2: 'text-slate-400 bg-slate-50/50 dark:bg-slate-900/20 border-slate-200/50',
    3: 'text-orange-600 bg-orange-50/50 dark:bg-orange-900/20 border-orange-200/50',
  };

  const isTopThree = rank <= 3;

  return (
    <div 
      className={cn(
        "flex items-center p-4 rounded-[2rem] border transition-all duration-500",
        "glass glass-dark shadow-premium group",
        isCurrentUser ? "border-primary/30 bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.1)]" : "border-primary/5",
        isTopThree ? "scale-[1.02] z-10" : "opacity-90 hover:opacity-100",
        "animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black italic mr-4 text-lg shadow-sm border",
        isTopThree ? (rankColors[rank]) : "text-muted-foreground bg-background/50 border-primary/5"
      )}>
        {rank === 1 ? <Trophy className="h-6 w-6 animate-pulse" /> : rank}
      </div>

      <Avatar className="h-14 w-14 mr-4 rounded-2xl border-2 border-background shadow-md overflow-hidden">
        <AvatarImage src={profile.photoURL || undefined} className="object-cover transition-transform duration-500 group-hover:scale-110" />
        <AvatarFallback className="font-bold bg-primary/10 text-primary">{getInitials(profile.username || 'U')}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
            <h3 className="font-black truncate text-foreground tracking-tight text-base group-hover:text-primary transition-colors">
                {profile.firstName} {profile.lastName}
            </h3>
            {isCurrentUser && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-primary text-white px-2 py-0.5 rounded-full shadow-lg shadow-primary/20">TÚ</span>
            )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border border-primary/10", levelInfo.color)}>
                {levelInfo.label} • NIV {levelInfo.level}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold tracking-wider opacity-70">@{profile.username}</span>
        </div>
      </div>

      <div className="text-right ml-4">
        <div className="flex items-center justify-end gap-1 text-primary font-black text-2xl tracking-tighter">
            <Star className="h-4 w-4 fill-current drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            <span>{profile.points || 0}</span>
        </div>
        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-60">PUNTOS XP</p>
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
    <div className="container mx-auto px-4 py-8 max-w-2xl min-h-screen">
      <div className="text-center mb-10 space-y-3 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex p-4 rounded-[2rem] glass glass-dark shadow-premium border-primary/10 mb-2">
            <Trophy className="h-10 w-10 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-foreground">
            Ranking <span className="text-primary tracking-[0.2em] font-black ml-2">EstuClub</span>
        </h1>
        <p className="text-muted-foreground font-bold text-xs uppercase tracking-[0.3em] opacity-70">
            Los estudiantes más activos del Club
        </p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [...Array(10)].map((_, i) => (
            <BrandSkeleton key={i} className="h-24 w-full rounded-[2rem]" />
          ))
        ) : (
          users?.map((profile, index) => (
            <LeaderboardItem 
              key={profile.id} 
              profile={profile} 
              rank={index + 1} 
              isCurrentUser={user?.uid === profile.id}
              index={index}
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
