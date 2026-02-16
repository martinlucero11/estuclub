
'use client';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, Medal, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  username: string;
  photoURL?: string;
  points: number;
}

function RankingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 rounded-md border p-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getRankColor(rank: number) {
  if (rank === 1) return 'text-yellow-500';
  if (rank === 2) return 'text-gray-400';
  if (rank === 3) return 'text-yellow-700';
  return 'text-muted-foreground';
}

function RankingList({ users, currentUserUid }: { users: UserProfile[] | null, currentUserUid?: string }) {
  if (!users) {
    return <RankingSkeleton />;
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
        <h3 className="text-xl font-semibold">El ranking está vacío</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          ¡Canjea beneficios para empezar a sumar puntos!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {users.map((user, index) => {
        const rank = index + 1;
        const isCurrentUser = user.id === currentUserUid;
        const userInitial = user.username ? user.username.charAt(0).toUpperCase() : 'U';

        return (
          <Card key={user.id} className={cn(
            "flex items-center p-3 transition-all",
            isCurrentUser && "border-primary shadow-lg"
          )}>
            <div className="flex w-12 items-center justify-center">
              {rank <= 3 ? (
                 <Medal className={cn("h-6 w-6", getRankColor(rank))} />
              ) : (
                <span className="text-lg font-bold text-muted-foreground">{rank}</span>
              )}
            </div>
            <Avatar className="h-10 w-10">
                <AvatarImage src={user.photoURL} alt={user.username} />
                <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
            <div className="ml-4 flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">@{user.username}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1 pl-2 font-bold text-foreground">
              <Award className="h-4 w-4 text-primary" />
              {user.points || 0}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default function LeaderboardPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();

  const usersQuery = useMemoFirebase(
    () => query(collection(firestore, 'users'), orderBy('points', 'desc')),
    [firestore]
  );
  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  return (
    <MainLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8">
        <header className="space-y-2">
           <div className="flex items-center gap-3">
             <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Ranking de Puntos
            </h1>
           </div>
          <p className="text-muted-foreground">
            Mira quién está liderando la tabla de posiciones.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Top Estudiantes</CardTitle>
            <CardDescription>
              Los usuarios con la mayor cantidad de puntos acumulados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <RankingSkeleton /> : <RankingList users={users} currentUserUid={currentUser?.uid} />}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
