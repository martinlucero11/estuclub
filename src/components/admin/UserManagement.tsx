'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { 
  Users, 
  Search, 
  Calendar, 
  Zap, 
  MoreVertical,
  Loader2,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/admin-context';
import { UserProfile } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { syncUserRole } from '@/lib/actions/role-actions';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function UserManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { setImpersonatedUserId } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyingUser, setVerifyingUser] = useState<UserProfile | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Fetch Users
  const usersQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users').withConverter(createConverter<UserProfile>()),
      limit(50)
    );
  }, [firestore]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users || [];
    const lowerQuery = searchQuery.toLowerCase();
    return users?.filter(u => 
      (u.firstName?.toLowerCase() || '').includes(lowerQuery) || 
      (u.lastName?.toLowerCase() || '').includes(lowerQuery) || 
      (u.username?.toLowerCase() || '').includes(lowerQuery) ||
      (u.email?.toLowerCase() || '').includes(lowerQuery) ||
      u.uid.toLowerCase().includes(lowerQuery)
    ) || [];
  }, [users, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin opacity-40 mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground animate-pulse">Indexando Población...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="relative w-full max-w-xl group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="BUSCAR USUARIO POR NOMBRE O EMAIL..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-16 pl-16 rounded-[2rem] bg-card/50 border-white/5 focus:border-primary/40 text-sm font-bold uppercase transition-all shadow-premium"
          />
        </div>
        <Button variant="outline" className="rounded-2xl h-16 px-8 border-white/5 bg-card/50 font-black uppercase text-[10px] tracking-widest flex gap-3">
            <Filter className="h-4 w-4" />
            Filtros Avanzados
        </Button>
      </div>

      {/* User Table Header (Desktop only) */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-8 pb-4 text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-40">
        <div className="col-span-3">Usuario</div>
        <div className="col-span-2">Rol Base</div>
        <div className="col-span-2">Alumno</div>
        <div className="col-span-2">Registro</div>
        <div className="col-span-3 text-right">Acciones</div>
      </div>

      {/* User List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <div 
            key={user.uid} 
            className="md:grid grid-cols-12 items-center gap-4 p-6 md:px-8 bg-card/30 border border-white/5 rounded-[2.5rem] hover:bg-card/50 transition-all group shadow-premium"
          >
            {/* User Info */}
            <div className="col-span-4 flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-background border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:border-primary/40 transition-colors relative">
                  {user.photoURL ? (
                    <OptimizedImage src={user.photoURL} alt="" fill />
                  ) : (
                    <Users className="h-5 w-5 text-foreground" />
                  )}
               </div>
               <div className="min-w-0">
                  <p className="font-black text-sm tracking-tight truncate">
                    {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.username || 'Sin Nombre'}
                  </p>
                  <p className="text-[10px] text-foreground truncate opacity-60">{user.email || user.uid}</p>
               </div>
            </div>

            {/* Roles */}
            <div className="col-span-2 py-4 md:py-0">
               <Badge className="bg-primary/10 text-primary border-primary/20 rounded-lg text-[8px] font-black uppercase tracking-widest px-3 py-1">
                  {user.role || 'Estudiante'}
               </Badge>
            </div>

            {/* Student Status */}
            <div className="col-span-2">
                {user.isStudent ? (
                    <Badge 
                        variant="outline" 
                        className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border-white/5",
                            user.studentStatus === 'verified' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            user.studentStatus === 'submitted' ? "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse" :
                            "bg-white/5 text-white/40"
                        )}
                    >
                        {user.studentStatus || 'inactive'}
                    </Badge>
                ) : (
                    <span className="text-[10px] opacity-20 font-black uppercase tracking-widest">-</span>
                )}
            </div>

            {/* Date */}
            <div className="col-span-2 flex items-center gap-2 text-[10px] font-bold text-foreground italic">
               <Calendar className="h-3 w-3 opacity-30" />
               Hoy, 14:20hs
            </div>

            {/* Actions */}
            <div className="col-span-3 flex items-center justify-end gap-3">
               <Button 
                 onClick={() => {
                   const name = user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.username || user.uid;
                   toast({ title: 'Simulación Maestra', description: `Inyectando identidad: ${name}` });
                   setImpersonatedUserId(user.uid);
                 }}
                 className="rounded-2xl bg-primary h-12 px-6 text-white font-black uppercase text-[9px] tracking-widest shadow-xl hover:bg-primary/90 transition-all flex items-center gap-3"
               >
                  <Zap className="h-4 w-4" />
                  Simular Sesión
               </Button>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 opacity-40 hover:opacity-100 transition-all">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card border-white/10 z-[100] rounded-2xl p-2 shadow-2xl">
                    <DropdownMenuItem 
                      onClick={async () => {
                        const newRole = prompt('Nuevo Rol (estudiante, rider, admin, cluber):', user.role || 'estudiante');
                        if (newRole) {
                          try {
                            const result = await syncUserRole(user.uid, newRole);
                            if (result.success) {
                              toast({ title: 'Sincronización Atómica Exitosa', description: `Nuevo rol: ${newRole} (Reflejado en Auth & DB)` });
                            }
                          } catch (e: any) {
                             toast({ variant: 'destructive', title: 'Fallo de Seguridad en Servidor', description: e.message });
                          }
                        }
                      }}
                      className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-3 py-3 cursor-pointer"
                    >
                      <Edit className="h-4 w-4" /> Editar Rol Seguro
                    </DropdownMenuItem>

                    {user.isStudent && user.studentStatus === 'submitted' && (
                        <DropdownMenuItem 
                            onClick={() => setVerifyingUser(user)}
                            className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-3 py-3 cursor-pointer text-amber-500 focus:text-amber-600 focus:bg-amber-500/10"
                        >
                            <ShieldCheck className="h-4 w-4" /> Verificar Alumno
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem 
                      onClick={() => {
                        if (confirm(`¿Estás SEGURO de eliminar a ${user.username || user.uid}?`) && firestore) {
                          deleteDoc(doc(firestore, 'users', user.uid))
                            .then(() => toast({ title: 'Usuario Eliminado', description: 'Se ha borrado el registro permanentemente.' }))
                            .catch(e => toast({ variant: 'destructive', title: 'Error', description: e.message }));
                        }
                      }}
                      className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-3 py-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" /> Borrar Usuario
                    </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
          </div>
        ))}
      </div>

      {/* Verification Dialog */}
      <Dialog open={!!verifyingUser} onOpenChange={(o) => !o && setVerifyingUser(null)}>
          <DialogContent className="bg-card border-none rounded-[3rem] p-0 max-w-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <div className="p-10 border-b border-white/5 bg-background/50">
                  <DialogHeader className="flex flex-row items-center gap-6">
                      <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <ShieldCheck className="h-8 w-8 text-amber-500" />
                      </div>
                      <div className="text-left">
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-1">Verificación Académica</p>
                          <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase font-montserrat leading-none">
                              {verifyingUser?.firstName} {verifyingUser?.lastName}
                          </DialogTitle>
                          <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mt-1">Institución: {verifyingUser?.institution || 'Desconocida'}</p>
                      </div>
                  </DialogHeader>
              </div>

              <div className="p-10 space-y-8">
                  <div className="space-y-4">
                      <Label className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] ml-2">Certificado Presentado</Label>
                      <div className="rounded-3xl border border-white/10 overflow-hidden bg-black/40 aspect-[4/3] relative flex items-center justify-center group">
                          {verifyingUser?.studentCertificateUrl ? (
                              <img 
                                src={verifyingUser.studentCertificateUrl} 
                                alt="Certificado" 
                                className="w-full h-full object-contain"
                              />
                          ) : (
                              <div className="flex flex-col items-center gap-4 py-20 text-white/20">
                                  <FileText className="h-12 w-12" />
                                  <p className="text-xs font-black uppercase tracking-widest">Sin imagen cargada</p>
                              </div>
                          )}
                          {verifyingUser?.studentCertificateUrl && (
                             <a 
                                href={verifyingUser.studentCertificateUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3 backdrop-blur-sm"
                             >
                                <FileText className="h-8 w-8 text-white" />
                                <span className="text-[10px] font-black uppercase text-white tracking-widest">Abrir en pestaña nueva</span>
                             </a>
                          )}
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                          <p className="text-[8px] font-black opacity-20 uppercase tracking-widest">Carrera</p>
                          <p className="text-xs font-bold uppercase truncate">{verifyingUser?.career || '-'}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                          <p className="text-[8px] font-black opacity-20 uppercase tracking-widest">Nivel</p>
                          <p className="text-xs font-bold uppercase truncate">{verifyingUser?.educationLevel || '-'}</p>
                      </div>
                  </div>
              </div>

              <DialogFooter className="p-10 pt-0 flex gap-4">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-red-500/20 text-red-500 hover:bg-red-500/10"
                    disabled={isUpdating}
                    onClick={async () => {
                        if (!firestore || !verifyingUser) return;
                        setIsUpdating(true);
                        try {
                            await updateDoc(doc(firestore, 'users', verifyingUser.uid), {
                                studentStatus: 'pending' // Re-solicitar o simplemente rechazar
                            });
                            toast({ title: 'Solicitud Rechazada' });
                            setVerifyingUser(null);
                        } finally { setIsUpdating(false); }
                    }}
                  >
                      <XCircle className="h-4 w-4 mr-2" /> Rechazar
                  </Button>
                  <Button 
                    className="flex-1 h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/20"
                    disabled={isUpdating}
                    onClick={async () => {
                        if (!firestore || !verifyingUser) return;
                        setIsUpdating(true);
                        try {
                            await updateDoc(doc(firestore, 'users', verifyingUser.uid), {
                                studentStatus: 'verified'
                            });
                            toast({ title: '✅ ALUMNO VERIFICADO', description: 'El acceso a beneficios ha sido habilitado.' });
                            setVerifyingUser(null);
                        } finally { setIsUpdating(false); }
                    }}
                  >
                      <ShieldCheck className="h-4 w-4 mr-2" /> Validar Alumno
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}

