'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, University, Award, ShieldCheck, Building, Fingerprint } from 'lucide-react';
import { cn, getAvatarUrl } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarFallbackFachero } from './avatar-selector';

interface IDCardProps {
  userProfile: {
    firstName: string;
    lastName: string;
    username: string;
    role: string;
    dni: string;
    university?: string;
    avatarSeed?: string;
    photoURL?: string;
    useAvatar?: boolean;
    points?: number;
  };
  qrCodeUrl: string | null;
  isLoading?: boolean;
}

export function IDCard({ userProfile, qrCodeUrl, isLoading }: IDCardProps) {
  const isSupplier = userProfile.role === 'supplier';
  const isAdmin = userProfile.role === 'admin';
  
  const roleLabel = isAdmin ? 'Administrador' : isSupplier ? 'CluBer Pro' : 'Estudiante';
  const roleColor = isAdmin ? 'bg-red-500' : isSupplier ? 'bg-amber-500' : 'bg-primary';
  
  const photo = isSupplier && !userProfile.useAvatar 
    ? userProfile.photoURL 
    : getAvatarUrl(userProfile.avatarSeed);

  const fullName = `${userProfile.firstName} ${userProfile.lastName}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative w-full max-w-[340px] aspect-[1/1.58] mx-auto group"
    >
      {/* Glow Effect */}
      <div className={cn(
        "absolute -inset-1 rounded-[2.5rem] blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500",
        roleColor
      )} />
      
      {/* Card Body */}
      <div className="relative h-full w-full rounded-[2.2rem] overflow-hidden glass glass-dark border border-white/10 flex flex-col shadow-2xl">
        
        {/* Header/Pattern */}
        <div className={cn("h-24 w-full relative overflow-hidden", roleColor)}>
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
           <div className="absolute top-4 right-6 flex items-center gap-2">
             <span className="text-[10px] font-black tracking-[0.2em] text-white/90 uppercase italic">EstuClub</span>
           </div>
        </div>

        {/* Profile Section */}
        <div className="flex-1 flex flex-col items-center -mt-12 px-6 pb-6 text-center">
            {/* Avatar */}
            <div className="relative mb-4">
                <Avatar className="h-28 w-28 rounded-3xl border-4 border-background shadow-2xl bg-background overflow-hidden">
                    {photo ? (
                        <AvatarImage src={photo} alt={fullName} className="object-cover" />
                    ) : (
                        <AvatarFallbackFachero className="w-full h-full text-4xl" />
                    )}
                </Avatar>
                <div className={cn(
                    "absolute -bottom-1 -right-1 h-8 w-8 rounded-xl flex items-center justify-center text-white border-2 border-background shadow-lg",
                    roleColor
                )}>
                    {isAdmin ? <ShieldCheck className="h-4 w-4" /> : isSupplier ? <Building className="h-4 w-4" /> : <Award className="h-4 w-4" />}
                </div>
            </div>

            {/* Info */}
            <div className="space-y-1 mb-6">
                <h3 className="text-xl font-black tracking-tighter text-foreground leading-tight">
                    {fullName}
                </h3>
                <div className="flex items-center justify-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">@{userProfile.username}</span>
                    <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white",
                        roleColor
                    )}>
                        {roleLabel}
                    </span>
                </div>
            </div>

            {/* Details Grid */}
            <div className="w-full grid grid-cols-2 gap-4 mb-6">
                <div className="text-left space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Identidad</p>
                    <div className="flex items-center gap-1.5">
                        <Fingerprint className="h-3 w-3 text-primary/60" />
                        <span className="text-xs font-bold truncate">{userProfile.dni}</span>
                    </div>
                </div>
                <div className="text-left space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                        {isSupplier ? 'Categoría' : 'Institución'}
                    </p>
                    <div className="flex items-center gap-1.5">
                        {isSupplier ? <Building className="h-3 w-3 text-primary/60" /> : <University className="h-3 w-3 text-primary/60" />}
                        <span className="text-xs font-bold truncate">{userProfile.university || 'EstuClub'}</span>
                    </div>
                </div>
            </div>

            {/* QR Code Section */}
            <div className="mt-auto w-full pt-4 border-t border-white/5 flex flex-col items-center">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4">Escanear para verificar</p>
                <div className="relative p-3 bg-white rounded-3xl shadow-inner group-hover:scale-105 transition-transform duration-500">
                    {isLoading ? (
                        <div className="h-32 w-32 flex items-center justify-center">
                           <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : qrCodeUrl ? (
                         <img src={qrCodeUrl} alt="Verification QR" className="h-32 w-32 object-contain" />
                    ) : (
                        <div className="h-32 w-32 flex flex-col items-center justify-center text-destructive text-[10px] font-bold">
                            <QrCode className="h-8 w-8 mb-2 opacity-20" />
                            ERROR QR
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        {/* Footer Brand */}
        <div className="py-3 bg-black/20 text-center">
             <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/30">Official Member Card</p>
        </div>
      </div>
    </motion.div>
  );
}
