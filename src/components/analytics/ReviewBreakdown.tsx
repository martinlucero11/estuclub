'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare } from '@phosphor-icons/react';
import { cn } from "@/lib/utils";

interface Review {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    date: Date;
}

interface ReviewBreakdownProps {
    avgRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
    recentReviews: Review[];
}

export function ReviewBreakdown({ avgRating, totalReviews, distribution, recentReviews }: ReviewBreakdownProps) {
    return (
        <Card className="border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-xl border-2">
            <CardHeader className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 py-8">
                <CardTitle className="flex items-center gap-4 text-2xl font-black italic text-foreground dark:text-white">
                    <div className="p-3 bg-yellow-500/20 rounded-2xl border border-yellow-500/30">
                        <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                    </div>
                    Calificaciones y Reseñas
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
                <div className="grid gap-12 lg:grid-cols-2">
                    {/* Star Distribution */}
                    <div className="space-y-8">
                        <div className="flex items-end gap-6">
                            <h3 className="text-7xl font-black text-foreground dark:text-white tracking-tighter">
                                {avgRating.toFixed(1)}
                            </h3>
                            <div className="pb-2 space-y-1">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className={cn("h-4 w-4", s <= Math.round(avgRating) ? "text-yellow-500 fill-yellow-500" : "text-black/10 dark:text-white/10")} />
                                    ))}
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Basado en {totalReviews} reseñas
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                const count = distribution[rating] || 0;
                                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                                return (
                                    <div key={rating} className="flex items-center gap-4 group">
                                        <span className="text-xs font-black text-muted-foreground w-4">{rating}</span>
                                        <div className="flex-1 h-3 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/10">
                                            <div 
                                                className="h-full bg-yellow-500 dark:bg-yellow-400 group-hover:bg-primary transition-all duration-700 rounded-full" 
                                                style={{ width: `${percentage}%` }} 
                                            />
                                        </div>
                                        <span className="text-[10px] font-black text-foreground/60 dark:text-white/40 w-8">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recent Feedback List */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Comentarios Recientes
                        </h4>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {recentReviews.length > 0 ? recentReviews.map((r) => (
                                <div key={r.id} className="p-5 rounded-3xl bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-primary/30 transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-xs font-black text-foreground dark:text-white group-hover:text-primary transition-colors">{r.userName}</p>
                                            <div className="flex gap-0.5 mt-0.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} className={cn("h-2.5 w-2.5", i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-black/10 dark:text-white/10")} />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-[8px] font-black text-muted-foreground uppercase">{new Date(r.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-[11px] text-foreground/70 dark:text-white/60 italic leading-relaxed">
                                        "{r.comment}"
                                    </p>
                                </div>
                            )) : (
                                <div className="h-40 flex items-center justify-center text-muted-foreground text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-black/5 dark:border-white/5 rounded-3xl">
                                    No hay comentarios todavía
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
