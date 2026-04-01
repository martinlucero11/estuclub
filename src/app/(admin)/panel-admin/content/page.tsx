'use client';
/**
 * ESTUCLUB OVERLORD - CONTENT COMMAND CENTER (DIFUSIÓN)
 * Management of Benefits, Announcements and Global Content.
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  Megaphone, 
  Layers, 
  Plus, 
  ChevronRight, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Star,
  Trash2,
  Edit3,
  Calendar,
  Image as ImageIcon,
  ExternalLink,
  Save,
  X
} from 'lucide-react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { Benefit, Announcement, Banner, SerializableBenefit, SerializableAnnouncement } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { cn } from '@/lib/utils';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addDoc } from 'firebase/firestore';

export default function ContentCommandCenterPage() {
    const { isAdmin, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('benefits');

    // ── DATA FETCHING ─────────────────────────────────────
    const benefitsQuery = useMemo(() => 
        query(collection(firestore, 'perks').withConverter(createConverter<Benefit>()), orderBy('createdAt', 'desc')), 
    [firestore]);
    
    const announcementsQuery = useMemo(() => 
        query(collection(firestore, 'announcements').withConverter(createConverter<Announcement>()), orderBy('createdAt', 'desc')), 
    [firestore]);

    const bannersQuery = useMemo(() => 
        query(collection(firestore, 'banners').withConverter(createConverter<Banner>()), orderBy('createdAt', 'desc')), 
    [firestore]);
    
    const { data: benefits, isLoading: loadingBenefits } = useCollection(benefitsQuery);
    const { data: announcements, isLoading: loadingAnnouncements } = useCollection(announcementsQuery);
    const { data: banners, isLoading: loadingBanners } = useCollection(bannersQuery);

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    if (isUserLoading) return null;
    if (!isAdmin) return <div className="p-20 text-center font-black uppercase text-[#d93b64]">OVERLORD ACCESS REQUIRED</div>;

    // ── ACTIONS ───────────────────────────────────────────
    const handleToggleActive = async (id: string, current: boolean, type: 'perk' | 'announcement') => {
        try {
            const ref = doc(firestore, type === 'perk' ? 'perks' : 'announcements', id);
            await updateDoc(ref, { isVisible: !current });
            toast({ title: "Estado Actualizado", description: `El contenido ahora está ${!current ? 'Visible' : 'Oculto'}.` });
        } catch (e) {
            toast({ variant: "destructive", title: "Error al actualizar" });
        }
    };

    const handleDelete = async (id: string, type: 'perk' | 'announcement' | 'banner') => {
        if (!confirm("¿Estás seguro de eliminar este contenido permanentemente?")) return;
        try {
            const coll = type === 'perk' ? 'perks' : (type === 'announcement' ? 'announcements' : 'banners');
            await deleteDoc(doc(firestore, coll, id));
            toast({ title: "Eliminado", description: "Contenido removido del sistema." });
        } catch (e) {
            toast({ variant: "destructive", title: "Error al eliminar" });
        }
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const type = activeTab === 'benefits' ? 'perks' : (activeTab === 'announcements' ? 'announcements' : 'banners');
        
        const data: any = {
            updatedAt: serverTimestamp(),
        };

        if (activeTab === 'benefits') {
            data.title = formData.get('title');
            data.description = formData.get('description');
            data.category = formData.get('category');
            data.imageUrl = formData.get('imageUrl');
            data.points = Number(formData.get('points')) || 0;
            data.isVisible = true;
            data.isFeatured = false;
        } else if (activeTab === 'announcements') {
            data.title = formData.get('title');
            data.content = formData.get('content');
            data.imageUrl = formData.get('imageUrl');
            data.linkUrl = formData.get('linkUrl');
            data.status = 'approved';
            data.isVisible = true;
        } else {
            data.title = formData.get('title');
            data.description = formData.get('description');
            data.imageUrl = formData.get('imageUrl');
            data.link = formData.get('link');
            data.isActive = true;
            data.colorScheme = formData.get('colorScheme') || 'pink';
        }

        try {
            if (editingItem) {
                await updateDoc(doc(firestore, type, editingItem.id), data);
                toast({ title: "Actualizado", description: "Contenido modificado correctamente." });
            } else {
                data.createdAt = serverTimestamp();
                if (activeTab === 'announcements') data.submittedAt = serverTimestamp();
                await addDoc(collection(firestore, type), data);
                toast({ title: "Creado", description: "Nuevo contenido añadido al sistema." });
            }
            setIsEditorOpen(false);
            setEditingItem(null);
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Error al guardar" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-black pb-32 selection:bg-[#d93b64]/30">
            {/* Header: Command Style */}
            <header className="pt-16 pb-12 px-6 md:px-12 bg-gradient-to-b from-[#d93b64]/20 to-transparent">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Button asChild variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-[#d93b64]/20 transition-all">
                                <Link href="/panel-admin"><ChevronRight className="h-5 w-5 rotate-180" /></Link>
                            </Button>
                            <div className="h-10 w-10 rounded-xl bg-[#d93b64] flex items-center justify-center shadow-[0_0_20px_#d93b64]">
                                <Megaphone className="h-5 w-5 text-white" />
                            </div>
                            <Badge className="bg-white/10 text-white border-white/20 uppercase font-black text-[9px] tracking-widest px-3 py-1">Centro de Difusión</Badge>
                        </div>
                        <h1 className="text-6xl md:text-[5.5rem] font-black text-white uppercase tracking-tighter italic leading-[0.9] font-montserrat drop-shadow-2xl">
                            CONTENIDO <br/><span className="text-[#d93b64]">EXTREMO</span>
                        </h1>
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.5em] ml-2">Gestión de Beneficios, Anuncios y Banners</p>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                         <div className="flex gap-3 bg-white/5 backdrop-blur-xl p-4 rounded-3xl border border-white/10">
                            <div className="h-10 w-10 rounded-full bg-[#d93b64]/20 flex items-center justify-center">
                                <Zap className="h-5 w-5 text-[#d93b64]" />
                            </div>
                            <div className="pr-4">
                                <p className="text-[10px] font-black text-[#d93b64] uppercase tracking-widest leading-tight">Master Difusión</p>
                                <p className="text-xs font-bold text-white/80">Monitor de Tráfico Activo</p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => { setEditingItem(null); setIsEditorOpen(true); }}
                            className="bg-[#d93b64] hover:bg-[#d93b64]/90 text-white font-black text-[10px] uppercase tracking-widest h-12 px-8 rounded-2xl shadow-xl shadow-[#d93b64]/20"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Crear Nuevo ({activeTab === 'benefits' ? 'Beneficio' : (activeTab === 'announcements' ? 'Anuncio' : 'Banner')})
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 md:px-12 space-y-12">
                
                <Tabs defaultValue="benefits" onValueChange={setActiveTab} className="space-y-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <TabsList className="bg-white/5 border border-white/10 p-1.5 rounded-[2rem] h-16 w-full md:w-auto shadow-2xl backdrop-blur-lg">
                            <TabsTrigger value="benefits" className="rounded-[1.5rem] px-8 font-black uppercase text-[10px] tracking-[0.2em] data-[state=active]:bg-[#d93b64] data-[state=active]:text-white transition-all duration-500 h-full">Beneficios</TabsTrigger>
                            <TabsTrigger value="announcements" className="rounded-[1.5rem] px-8 font-black uppercase text-[10px] tracking-[0.2em] data-[state=active]:bg-[#d93b64] data-[state=active]:text-white transition-all duration-500 h-full">Anuncios</TabsTrigger>
                            <TabsTrigger value="banners" className="rounded-[1.5rem] px-8 font-black uppercase text-[10px] tracking-[0.2em] data-[state=active]:bg-[#d93b64] data-[state=active]:text-white transition-all duration-500 h-full">Banners</TabsTrigger>
                        </TabsList>

                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-[#d93b64] transition-colors" />
                            <Input 
                                placeholder="Buscar contenido..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 focus:bg-white/10 focus:border-[#d93b64]/40 text-white font-bold transition-all"
                            />
                        </div>
                    </div>

                    {/* BENEFITS TAB */}
                    <TabsContent value="benefits" className="space-y-6 focus-visible:outline-none">
                        {loadingBenefits ? <LoadingGrid /> : (
                            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {benefits?.filter(b => b.title.toLowerCase().includes(search.toLowerCase())).map(benefit => (
                                    <ContentCard 
                                        key={benefit.id}
                                        title={benefit.title}
                                        subtitle={benefit.category}
                                        image={benefit.imageUrl}
                                        isVisible={!!benefit.isVisible}
                                        stats={`${benefit.redemptionCount || 0} canjes`}
                                        type="perk"
                                        onToggle={() => handleToggleActive(benefit.id, !!benefit.isVisible, 'perk')}
                                        onDelete={() => handleDelete(benefit.id, 'perk')}
                                        owner={benefit.supplierName || 'Estuclub Global'}
                                        badge={benefit.isExclusive ? 'EXCLUSIVO' : undefined}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ANNOUNCEMENTS TAB */}
                    <TabsContent value="announcements" className="space-y-6 focus-visible:outline-none">
                        {loadingAnnouncements ? <LoadingGrid /> : (
                            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {announcements?.filter(a => a.title.toLowerCase().includes(search.toLowerCase())).map(ann => (
                                    <ContentCard 
                                        key={ann.id}
                                        title={ann.title}
                                        subtitle={ann.authorUsername || 'System'}
                                        image={ann.imageUrl}
                                        isVisible={!!ann.isVisible}
                                        stats={ann.submittedAt ? new Date(ann.submittedAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                        type="announcement"
                                        onToggle={() => handleToggleActive(ann.id, !!ann.isVisible, 'announcement')}
                                        onDelete={() => handleDelete(ann.id, 'announcement')}
                                        onEdit={() => { setEditingItem(ann); setIsEditorOpen(true); }}
                                        owner="Comunicación"
                                        status={ann.status}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* BANNERS TAB */}
                    <TabsContent value="banners" className="space-y-6 focus-visible:outline-none">
                        {loadingBanners ? <LoadingGrid /> : (
                            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {banners?.filter(b => b.title.toLowerCase().includes(search.toLowerCase())).map(banner => (
                                    <ContentCard 
                                        key={banner.id}
                                        title={banner.title}
                                        subtitle={banner.description}
                                        image={banner.imageUrl}
                                        isVisible={!!banner.isActive}
                                        stats={banner.link || 'Sin link'}
                                        type="banner"
                                        onToggle={() => handleToggleActive(banner.id, !!banner.isActive, 'perk' as any)} // reusing toggle but needs collection fix
                                        onDelete={() => handleDelete(banner.id, 'banner')}
                                        onEdit={() => { setEditingItem(banner); setIsEditorOpen(true); }}
                                        owner="Marketing"
                                        badge={banner.colorScheme?.toUpperCase()}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

            </main>

            {/* EDITOR DIALOG */}
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <DialogContent className="bg-black/95 border-white/10 text-white max-w-2xl rounded-[3rem] p-10">
                    <DialogHeader>
                        <DialogTitle className="text-4xl font-black italic tracking-tighter uppercase mb-4">
                            {editingItem ? 'Editar' : 'Crear'} <span className="text-[#d93b64]">{activeTab === 'benefits' ? 'Beneficio' : (activeTab === 'announcements' ? 'Anuncio' : 'Banner')}</span>
                        </DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-2">Título</Label>
                                <Input name="title" defaultValue={editingItem?.title} required className="h-12 bg-white/5 border-white/10 rounded-xl" />
                            </div>
                            
                            {activeTab === 'benefits' && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-2">Categoría</Label>
                                    <Select name="category" defaultValue={editingItem?.category || 'Comercio'}>
                                        <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black border-white/10">
                                            <SelectItem value="Turismo">Turismo</SelectItem>
                                            <SelectItem value="Comercios">Comercios</SelectItem>
                                            <SelectItem value="Eventos">Eventos</SelectItem>
                                            <SelectItem value="Comida">Comida</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {activeTab === 'banners' && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-2">Esquema de Color</Label>
                                    <Select name="colorScheme" defaultValue={editingItem?.colorScheme || 'pink'}>
                                        <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black border-white/10">
                                            <SelectItem value="pink">Rosa Estuclub</SelectItem>
                                            <SelectItem value="yellow">Amarillo Impact</SelectItem>
                                            <SelectItem value="blue">Azul Cyber</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-2">
                                {activeTab === 'announcements' ? 'Contenido' : 'Descripción'}
                            </Label>
                            <Textarea 
                                name={activeTab === 'announcements' ? 'content' : 'description'} 
                                defaultValue={activeTab === 'announcements' ? editingItem?.content : editingItem?.description} 
                                required 
                                className="min-h-[120px] bg-white/5 border-white/10 rounded-xl" 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-2">URL de Imagen</Label>
                            <Input name="imageUrl" defaultValue={editingItem?.imageUrl} required className="h-12 bg-white/5 border-white/10 rounded-xl" />
                        </div>

                        {(activeTab === 'announcements' || activeTab === 'banners') && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-2">Enlace de Acción (Link)</Label>
                                <Input name={activeTab === 'announcements' ? 'linkUrl' : 'link'} defaultValue={activeTab === 'announcements' ? editingItem?.linkUrl : editingItem?.link} className="h-12 bg-white/5 border-white/10 rounded-xl" />
                            </div>
                        )}

                        {activeTab === 'benefits' && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-2">Puntos</Label>
                                <Input type="number" name="points" defaultValue={editingItem?.points || 0} className="h-12 bg-white/5 border-white/10 rounded-xl" />
                            </div>
                        )}

                        <DialogFooter className="pt-6">
                            <Button type="button" variant="ghost" onClick={() => setIsEditorOpen(false)} className="h-12 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest">Cancelar</Button>
                            <Button type="submit" disabled={isSaving} className="h-12 px-10 rounded-xl bg-[#d93b64] hover:bg-[#d93b64]/90 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-[#d93b64]/20 transition-all">
                                {isSaving ? 'Guardando...' : (editingItem ? 'Guardar Cambios' : 'Crear Ahora')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function LoadingGrid() {
    return (
        <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 rounded-[2.5rem] bg-white/5 animate-pulse" />)}
        </div>
    );
}

function ContentCard({ title, subtitle, image, isVisible, stats, type, onToggle, onDelete, onEdit, owner, badge, status }: any) {
    return (
        <Card className="bg-white/5 border-white/10 rounded-[2.5rem] overflow-hidden group hover:border-[#d93b64]/40 transition-all shadow-2xl">
            <div className="relative aspect-video overflow-hidden">
                {image ? (
                    <img src={image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={title} />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-white/10" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                
                <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className={cn("rounded-lg font-black text-[9px] px-3 py-1 uppercase tracking-widest", isVisible ? "bg-green-500 text-white" : "bg-white/10 text-white/40")}>
                        {isVisible ? 'En Al aire' : 'Oculto'}
                    </Badge>
                    {badge && <Badge className="bg-amber-500 text-white rounded-lg font-black text-[9px] px-3 py-1 border-none tracking-widest">{badge}</Badge>}
                </div>

                <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                     <div>
                        <p className="text-[10px] font-black text-[#d93b64] uppercase tracking-[0.2em] mb-1 font-montserrat italic">{owner}</p>
                        <h4 className="text-xl font-black text-white uppercase tracking-tighter leading-tight italic font-montserrat truncate max-w-[200px]">{title}</h4>
                     </div>
                     <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white/60">
                        {type === 'perk' ? <Heart className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
                     </div>
                </div>
            </div>
            <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-white/20" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{stats}</span>
                    </div>
                    {status && (
                        <Badge variant="outline" className={cn("uppercase text-[8px] font-black", status === 'approved' ? "text-emerald-400 border-emerald-400/20" : "text-amber-400 border-amber-400/20")}>
                            {status}
                        </Badge>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button 
                        variant="ghost" 
                        onClick={onToggle}
                        className={cn("flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/5", isVisible ? "text-white/40 hover:text-white" : "text-[#d93b64] hover:bg-[#d93b64]/10")}
                    >
                        {isVisible ? 'Ocultar' : 'Activar'}
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={onEdit}
                        className="h-12 w-12 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10"
                    >
                        <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={onDelete}
                        className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
