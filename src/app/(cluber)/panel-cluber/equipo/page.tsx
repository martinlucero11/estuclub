'use client';
import React, { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Shield, Star, Trash2, Mail, Loader2 } from 'lucide-react';
import BackButton from '@/components/layout/back-button';
import { collection, query, where, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

interface StaffMember {
    id: string;
    email: string;
    role: string;
    supplierId: string;
    addedAt: any;
}

export default function TeamManagementPage() {
    const { user, userData, roles } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const supplierId = user?.uid;

    const staffQuery = useMemo(() => {
        if (!firestore || !supplierId) return null;
        return query(
            collection(firestore, 'staff').withConverter(createConverter<StaffMember>()),
            where('supplierId', '==', supplierId)
        );
    }, [firestore, supplierId]);

    const { data: staff, isLoading } = useCollection(staffQuery);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !supplierId || !newEmail) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, 'staff'), {
                email: newEmail.toLowerCase(),
                role: 'collaborator',
                supplierId: supplierId,
                addedAt: serverTimestamp(),
            });
            toast({ title: 'Colaborador añadido', description: `${newEmail} ahora tiene acceso.` });
            setNewEmail('');
            setIsAddOpen(false);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo añadir al colaborador.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteMember = async (id: string, email: string) => {
        if (!firestore || !confirm(`¿Revocar acceso para ${email}?`)) return;
        try {
            await deleteDoc(doc(firestore, 'staff', id));
            toast({ title: 'Acceso revocado' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo revocar el acceso.' });
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-12 pb-32 animate-in fade-in duration-700">
            <BackButton />
            
            <header className="mb-12 mt-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 px-4 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                        <Users className="h-4 w-4 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Staff & Permisos</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none italic font-montserrat">
                        Gestión de <span className="text-indigo-500">Equipo</span>
                    </h1>
                    <p className="text-foreground font-bold text-sm uppercase tracking-widest max-w-lg">Administrá los accesos de tus colaboradores y asigná roles operativos.</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-14 px-8 rounded-2xl bg-indigo-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20">
                            <UserPlus className="h-4 w-4 mr-2" /> SUMAR MIEMBRO
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] border-white/10 glass-dark">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Invitar Colaborador</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddMember} className="space-y-6 pt-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Correo Electrónico</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                                    <Input 
                                        type="email" 
                                        required 
                                        placeholder="ejemplo@correo.com"
                                        className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl bg-indigo-500 font-black uppercase">
                                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'CONCEDER ACCESO'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* Admin Principal */}
                <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
                   <CardContent className="p-8 space-y-6">
                      <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                         <Shield className="h-8 w-8 text-indigo-500" />
                      </div>
                      <div className="space-y-1">
                         <h3 className="text-xl font-black uppercase italic tracking-tighter truncate">{userData?.firstName} {userData?.lastName}</h3>
                         <p className="text-[10px] font-bold text-foreground uppercase tracking-widest">{userData?.email}</p>
                         <div className="pt-2">
                            <span className="px-2 py-1 bg-indigo-500 text-white rounded-lg text-[8px] font-black uppercase">ADMINISTRADOR</span>
                         </div>
                      </div>
                   </CardContent>
                </Card>

                {/* Staff List */}
                {staff?.map((member) => (
                    <Card key={member.id} className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden animate-in zoom-in duration-300">
                        <CardContent className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="h-16 w-16 rounded-2xl bg-indigo-500/5 flex items-center justify-center border border-indigo-500/10">
                                    <Users className="h-8 w-8 text-indigo-500/40" />
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDeleteMember(member.id, member.email)}
                                    className="rounded-xl text-destructive hover:bg-destructive/5"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black uppercase italic tracking-tighter truncate">{member.email.split('@')[0]}</h3>
                                <p className="text-[10px] font-bold text-foreground uppercase tracking-widest truncate">{member.email}</p>
                                <div className="pt-2">
                                    <span className="px-2 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-[8px] font-black uppercase">COLABORADOR</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {isLoading && [1, 2].map(i => (
                    <Card key={i} className="rounded-[2.5rem] border-none shadow-2xl bg-white h-64 animate-pulse" />
                ))}

                {!isLoading && staff?.length === 0 && (
                     <Card className="rounded-[2.5rem] border-2 border-dashed border-indigo-500/20 bg-transparent flex flex-col items-center justify-center p-12 text-center space-y-6">
                        <Users className="h-12 w-12 opacity-10" />
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">No hay colaboradores adicionales</p>
                     </Card>
                )}
            </div>
        </div>
    );
}


