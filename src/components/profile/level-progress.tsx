'use client';

import { getLevelInfo, getProgressToNextLevel } from '@/lib/gamification';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Award, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelProgressProps {
  points: number;
  className?: string;
}

export function LevelProgress({ points, className }: LevelProgressProps) {
  const levelInfo = getLevelInfo(points);
  const progress = getProgressToNextLevel(points);

  return (
    <Card className={cn("overflow-hidden border-2 border-primary/10 shadow-lg", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Nivel {levelInfo.level}
            </CardTitle>
            <CardDescription className="font-medium text-primary/80">
              {levelInfo.label}
            </CardDescription>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
            <Zap className="h-6 w-6 text-primary fill-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span className="text-muted-foreground uppercase tracking-wider">Progreso</span>
            <span className="text-primary">{Math.floor(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3 bg-primary/10" />
        </div>
        
        <div className="flex justify-between items-end">
            <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter text-left">Puntos Actuales</p>
                <p className="text-lg font-black text-foreground">{points} XP</p>
            </div>
            <div className="text-right space-y-0.5">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">Siguiente Nivel</p>
                <p className="text-sm font-bold text-primary">{levelInfo.maxXp} XP</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
