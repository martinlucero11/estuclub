'use client';

import React from 'react';
import { useUser } from '@/firebase';
import { ReviewList } from '@/components/reviews/review-list';
import { Star, MessageSquare, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export function RiderReviews() {
    const { userData } = useUser();
    const riderId = userData?.uid;

    if (!riderId) return null;

    // Derived stats from userData
    const avgRating = userData.avgRating || 0;
    const reviewCount = userData.reviewCount || 0;

    return (
        <div className="space-y-8 pb-20">
            {/* Header Stats */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-[2.5rem] bg-white border border-zinc-100 shadow-xl flex flex-col items-center justify-center text-center space-y-2"
                >
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-1">
                        <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                    </div>
                    <p className="text-3xl font-black tracking-tighter text-zinc-900">{avgRating.toFixed(1)}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Promedio</p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-[2.5rem] bg-white border border-zinc-100 shadow-xl flex flex-col items-center justify-center text-center space-y-2"
                >
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-1">
                        <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-3xl font-black tracking-tighter text-zinc-900">{reviewCount}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Reseñas</p>
                </motion.div>
            </div>

            {/* Reputation Banner */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-[2.5rem] bg-zinc-900 text-white shadow-2xl relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <Award className="h-20 w-20" />
                </div>
                <div className="relative z-10 space-y-1">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Reputación Activa</span>
                    </div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">Tu compromiso es valorado</h3>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-tight max-w-[200px]">Las reseñas positivas aumentan tu prioridad en el radar.</p>
                </div>
            </motion.div>

            {/* List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#cb465a]">Comentarios Recientes</h4>
                    <div className="h-px flex-1 bg-zinc-100 ml-4" />
                </div>
                <ReviewList entityId={riderId} type="rider" />
            </div>
        </div>
    );
}
