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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full max-w-[340px] mx-auto group perspective-1000"
    >
      {/* Premium Glow Effect */}
      <div className={cn(
        "absolute -inset-4 rounded-[3rem] blur-3xl opacity-30 transition-all duration-700 group-hover:opacity-50",
        roleColor
      )} />
      
      {/* Card Body */}
      <div className="relative aspect-[1/1.58] w-full rounded-[2.5rem] overflow-hidden bg-[#121212] border border-white/10 flex flex-col shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-primary/20">
        
        {/* Header/Banner with Pattern */}
        <div className={cn("h-36 w-full relative overflow-hidden", roleColor)}>
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.8),_transparent_70%)]" />
          <div className="absolute inset-0 bg-black/5" />
          
          {/* Brand Logo and Minimal Indicator */}
          <div className="absolute top-8 left-0 right-0 px-8 flex justify-between items-center">
            <span className="text-[12px] font-black tracking-[0.4em] text-white uppercase italic drop-shadow-md">EstuClub</span>
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col items-center -mt-20 px-8 pb-8 text-center z-10">
          {/* Avatar Cluster */}
          <div className="relative mb-6 group/avatar">
            <div className={cn(
              "absolute -inset-1.5 blur-xl opacity-50 group-hover/avatar:opacity-80 transition-all duration-500",
              roleColor
            )} />
            <div className="relative p-1.5 bg-[#1a1a1a] rounded-[2.2rem] border border-white/10 shadow-3xl">
              <Avatar className="h-32 w-32 rounded-[1.8rem] border border-white/5 bg-[#222]">
                {photo ? (
                  <AvatarImage src={photo} alt={fullName} className="object-cover" />
                ) : (
                  <AvatarFallbackFachero className="w-full h-full text-4xl" />
                )}
              </Avatar>
            </div>
            
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className={cn(
                "absolute -bottom-1 -right-1 h-11 w-11 rounded-2xl flex items-center justify-center text-white border-4 border-[#121212] shadow-2xl z-20 transition-transform",
                roleColor
              )}
            >
              {isAdmin ? <ShieldCheck className="h-6 w-6" /> : isSupplier ? <Building className="h-6 w-6" /> : <Award className="h-6 w-6" />}
            </motion.div>
          </div>

          {/* User Identity */}
          <div className="space-y-1.5 mb-8">
            <h3 className="text-3xl font-black tracking-tighter text-white leading-tight drop-shadow-sm">
                {fullName}
            </h3>
            <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] font-bold text-white/50 tracking-wide uppercase">@{userProfile.username}</span>
                <div className="h-1 w-1 rounded-full bg-white/20" />
                <span className={cn(
                    "px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-lg",
                    roleColor
                )}>
                    {roleLabel}
                </span>
            </div>
          </div>

          {/* Info Grid - Premium Aesthetic */}
          <div className="w-full grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-white/[0.03] rounded-[1.5rem] border border-white/10 text-left transition-colors hover:bg-white/[0.06]">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">Identidad</p>
                  <div className="flex items-center gap-2 text-white/90 font-bold overflow-hidden">
                      <Fingerprint className="h-4 w-4 text-primary shrink-0 opacity-70" />
                      <span className="text-[11px] truncate">{userProfile.dni}</span>
                  </div>
              </div>
              <div className="p-4 bg-white/[0.03] rounded-[1.5rem] border border-white/10 text-left transition-colors hover:bg-white/[0.06]">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">
                      {isSupplier ? 'Categoría' : 'Institución'}
                  </p>
                  <div className="flex items-center gap-2 text-white/90 font-bold overflow-hidden">
                      {isSupplier ? <Building className="h-4 w-4 text-primary shrink-0 opacity-70" /> : <University className="h-4 w-4 text-primary shrink-0 opacity-70" />}
                      <span className="text-[11px] truncate">{userProfile.university || 'EstuClub'}</span>
                  </div>
              </div>
          </div>

          {/* QR Section - Modern & Scannable */}
          <div className="mt-auto w-full pt-6 border-t border-white/10 flex flex-col items-center">
              <div className="relative p-3 bg-white rounded-3xl shadow-2xl group-hover:scale-[1.03] transition-transform duration-500">
                  <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-primary/20 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-primary/20 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-primary/20 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-primary/20 rounded-br-xl" />

                  {isLoading ? (
                      <div className="h-32 w-32 flex items-center justify-center">
                         <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      </div>
                  ) : qrCodeUrl ? (
                      <div className="bg-white p-1 rounded-xl">
                        <img src={qrCodeUrl} alt="Verification QR" className="h-32 w-32 object-contain" />
                      </div>
                  ) : (
                      <div className="h-32 w-32 flex flex-col items-center justify-center text-destructive text-[10px] font-black uppercase">
                          <QrCode className="h-8 w-8 mb-2 opacity-20" />
                          Error QR
                      </div>
                  )}
              </div>

              <div className="mt-4 flex items-center gap-2 text-white/30">
                <ShieldCheck className="h-3 w-3" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Digital ID System</span>
              </div>
          </div>
        </div>
        
        {/* Minimal Footer */}
        <div className="py-3 bg-black/40 text-center border-t border-white/5">
            <p className="text-[9px] font-black uppercase tracking-[0.6em] text-white/10">ESTUCLUB VERIFIED</p>
        </div>
      </div>
    </motion.div>
  );
}
