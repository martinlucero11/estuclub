
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, query, where, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Announcement } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import BackButton from '@/components/layout/back-button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Megaphone, CheckCircle2, XCircle, Clock, Trash2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SplashScreen from '@/components/layout/splash-screen';
import { EmptyState } from '@/components/ui/empty-state';

export default function ApproveAnnouncementsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { roles, isUserLoading } = useUser();
    const [processingId, setProcessingId] = useState<string | null>(null);

    const isAdmin = roles.includes('admin');

    const pendingQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'announcements').withConverter(createConverter<Announcement>()),
            where('status', '==', 'pending')
        );
    }, [firestore]);

    const { data: pendingAnnouncements, isLoading } = useCollection(pendingQuery);

    const handleApprove = async (announcement: Announcement) => {
        if (!firestore) return;
        setProcessingId(announcement.id);
        try {
            // 1. Update status in Firestore
            const annRef = doc(firestore, 'announcements', announcement.id);
            await updateDoc(annRef, {
                status: 'approved',
                isVisible: true,
                approvedAt: serverTimestamp(),
            });

            // 2. Trigger FCM Notification
            const response = await fetch('/api/notifications/notify-announcement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: announcement.title,
                    content: announcement.content,
                    announcementId: announcement.id,
                    imageUrl: announcement.imageUrl,
                    supplierName: announcement.merchantName || 'Estuclub',
                    supplierId: announcement.supplierId,
                    targetType: announcement.notificationTarget || 'broadcast'
                })
            });

            const result = await response.json();
            
            toast({
                title: 'Anuncio Aprobado',
                description: result.success 
                    ? `Se enviaron ${result.sent} notificaciones push.` 
                    : 'Anuncio aprobado, pero hubo un problema con las notificaciones.',
            });
        } catch (error) {
            console.error('Error approving announcement:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo aprobar el anuncio.' });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        if (!firestore || !confirm('¿Estás seguro de rechazar este anuncio? Se marcará como rechazado.')) return;
        setProcessingId(id);
        try {
            await updateDoc(doc(firestore, 'announcements', id), {
                status: 'rejected',
                isVisible: false,
            });
            toast({ title: 'Anuncio rechazado' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo rechazar el anuncio.' });
        } finally {
            setProcessingId(null);
        }
    };

    if (isUserLoading || isLoading) return <SplashScreen />;
    if (!isAdmin) return <div className="p-20 text-center font-black uppercase tracking-widest text-red-500">Acceso Denegado</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <BackButton />
                    <div className="flex items-center gap-3 mt-4">
                        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                            <Megaphone className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Moderación de <span className="text-primary">Anuncios</span></h1>
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">Revisión y envío de Notificaciones FCM</p>
                        </div>
                    </div>
                </div>
                
                <Badge className="bg-primary/5 text-primary border-primary/10 px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest">
                    {pendingAnnouncements?.length || 0} Pendientes
                </Badge>
            </div>

            {pendingAnnouncements && pendingAnnouncements.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {pendingAnnouncements.map((ann) => (
                        <Card key={ann.id} className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden flex flex-col group hover:shadow-primary/5 transition-all duration-500">
                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="rounded-lg text-[8px] font-black uppercase bg-zinc-50 border-zinc-100">
                                            {ann.notificationTarget === 'broadcast' ? 'Toda la Comunidad' : 'Seguidores'}
                                        </Badge>
                                        <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                                            <Clock className="h-3 w-3" />
                                            {ann.submittedAt ? format(ann.submittedAt.toDate(), "d 'de' MMMM", { locale: es }) : 'Pendiente'}
                                        </div>
                                    </div>
                                    <Badge className="bg-amber-500/10 text-amber-500 border-none px-3 py-1 font-black text-[9px] uppercase tracking-widest">Pendiente</Badge>
                                </div>
                                <CardTitle className="text-2xl font-black uppercase italic tracking-tighter line-clamp-2 leading-none group-hover:text-primary transition-colors">
                                    {ann.title}
                                </CardTitle>
                                <CardDescription className="font-bold text-xs uppercase tracking-widest text-zinc-500 mt-2">
                                    Por: <span className="text-foreground">{ann.merchantName || 'Proveedor'}</span>
                                </CardDescription>
                            </CardHeader>
                            
                            <CardContent className="flex-1 space-y-4">
                                <p className="text-sm font-medium leading-relaxed text-zinc-600">
                                    {ann.content}
                                </p>
                                
                                {ann.imageUrl && (
                                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-zinc-100 group/img">
                                        <img 
                                            src={ann.imageUrl} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" 
                                            alt={ann.title} 
                                        />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                    </div>
                                )}

                                {ann.linkUrl && (
                                    <a 
                                        href={ann.linkUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                    >
                                        <ExternalLink className="h-3 w-3" /> Ver Enlace Externo
                                    </a>
                                )}
                            </CardContent>

                            <CardFooter className="pt-6 border-t border-zinc-50 grid grid-cols-2 gap-4">
                                <Button 
                                    variant="outline" 
                                    className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] border-zinc-100 hover:bg-zinc-50"
                                    onClick={() => handleReject(ann.id)}
                                    disabled={processingId === ann.id}
                                >
                                    <XCircle className="mr-2 h-4 w-4" /> Rechazar
                                </Button>
                                <Button 
                                    className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
                                    onClick={() => handleApprove(ann)}
                                    disabled={processingId === ann.id}
                                >
                                    {processingId === ann.id ? (
                                        <Clock className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Aprobar y Notificar
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState 
                    icon={Megaphone}
                    title="No hay anuncios para aprobar"
                    description="Los proveedores no han enviado nuevas solicitudes de anuncios por el momento."
                />
            )}
        </div>
    );
}

