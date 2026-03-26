'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, University, Award, ShieldCheck, Building, Fingerprint, Mail, Phone } from 'lucide-react';
import { cn, getAvatarUrl } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarFallbackFachero } from './avatar-selector';

interface IDCardProps {
  userProfile: {
    firstName: string;
    lastName: string;
    username: string;
    email?: string;
    phone?: string;
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
  const roleGlow = isAdmin ? 'shadow-red-500/20' : isSupplier ? 'shadow-amber-500/20' : 'shadow-primary/20';
  
  const photo = (userProfile.useAvatar || !userProfile.photoURL) 
    ? getAvatarUrl(userProfile.avatarSeed)
    : userProfile.photoURL;

  const fullName = `${userProfile.firstName} ${userProfile.lastName}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-[340px] mx-auto group perspective-1000"
    >
      {/* Glow Effect */}
      <div className={cn(
        "absolute -inset-2 rounded-[2.5rem] blur-2xl opacity-20 transition-opacity duration-500",
        roleColor
      )} />
      
      {/* Card Body */}
      <div className="relative aspect-[1/1.58] w-full rounded-[2.2rem] overflow-hidden glass glass-dark border border-white/10 flex flex-col shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-primary/10">
        
        {/* Header/Banner */}
        <div className={cn("h-32 w-full relative overflow-hidden", roleColor)}>
           <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
           <div className="absolute inset-0 bg-black/10" />
           {/* Decorative elements */}
           <div className="absolute top-6 right-8 flex items-center gap-2">
             <div className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse" />
             <span className="text-[10px] font-black tracking-[0.3em] text-white uppercase italic">EstuClub</span>
           </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col items-center -mt-16 px-6 pb-6 text-center z-10">
            {/* Avatar Cluster */}
            <div className="relative mb-4 group/avatar">
                <div className={cn(
                    "absolute -inset-1 blur-lg opacity-40 group-hover/avatar:opacity-70 transition-opacity",
                    roleColor
                )} />
                <Avatar className="h-32 w-32 rounded-[2rem] border-4 border-background shadow-2xl bg-background relative z-10 transition-transform duration-500 group-hover/avatar:rotate-2">
                    {photo ? (
                        <AvatarImage src={photo} alt={fullName} className="object-cover" />
                    ) : (
                        <AvatarFallbackFachero className="w-full h-full text-4xl" />
                    )}
                </Avatar>
                <div className={cn(
                    "absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl flex items-center justify-center text-white border-4 border-background shadow-xl z-20",
                    roleColor
                )}>
                    {isAdmin ? <ShieldCheck className="h-5 w-5" /> : isSupplier ? <Building className="h-5 w-5" /> : <Award className="h-5 w-5" />}
                </div>
            </div>

            {/* User Identity */}
            <div className="space-y-1 mb-6">
                <h3 className="text-2xl font-black tracking-tighter text-foreground leading-tight">
                    {fullName}
                </h3>
                <div className="flex items-center justify-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground/80 lowercase">@{userProfile.username}</span>
                    <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                    <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white",
                        roleColor
                    )}>
                        {roleLabel}
                    </span>
                </div>
            </div>

            {/* Info Grid - Designed to match Profile Page styles */}
            <div className="w-full space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-left">
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Identidad</p>
                        <div className="flex items-center gap-2 text-foreground/90 font-bold overflow-hidden">
                            <Fingerprint className="h-3 w-3 text-primary/60 shrink-0" />
                            <span className="text-xs truncate">{userProfile.dni}</span>
                        </div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-left">
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                            {isSupplier ? 'Categoría' : 'Institución'}
                        </p>
                        <div className="flex items-center gap-2 text-foreground/90 font-bold overflow-hidden">
                            {isSupplier ? <Building className="h-3 w-3 text-primary/60 shrink-0" /> : <University className="h-3 w-3 text-primary/60 shrink-0" />}
                            <span className="text-xs truncate">{userProfile.university || 'EstuClub'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Section - The Scannable part */}
            <div className="mt-auto w-full pt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-left">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Miembro Oficial</p>
                    <p className="text-[10px] font-bold text-muted-foreground/60">Verificado via EstuQR</p>
                  </div>
                  <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <QrCode className="h-3 w-3 text-primary" />
                  </div>
                </div>

                <div className="relative p-2 bg-white rounded-2xl shadow-inner inline-block group-hover:scale-105 transition-transform duration-500">
                    {isLoading ? (
                        <div className="h-28 w-28 flex items-center justify-center">
                           <div className="h-6 w-6 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : qrCodeUrl ? (
                         <img src={qrCodeUrl} alt="Verification QR" className="h-28 w-28 object-contain mix-blend-multiply" />
                    ) : (
                        <div className="h-28 w-28 flex flex-col items-center justify-center text-destructive text-[8px] font-black uppercase">
                            <QrCode className="h-6 w-6 mb-1 opacity-20" />
                            Error QR
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        {/* Footer Brand */}
        <div className="py-2.5 bg-black/20 text-center">
             <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/20">ESTUCLUB • DIGITAL ID SYSTEM</p>
        </div>
      </div>
    </motion.div>
  );
}
