'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
    Megaphone, Layout, Image as ImageIcon, Plus, 
    Gift, MessageSquare, Calendar as CalendarIcon, Truck,
    Zap, Heart, Clock, TrendingUp, Star, Trash2, Edit3, 
    Search, Save, X, ExternalLink, ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { 
  collection, query, orderBy, doc, updateDoc, deleteDoc, 
  serverTimestamp, collectionGroup, addDoc 
} from 'firebase/firestore';
import { Benefit, Announcement, Banner, Service, Product, Category, HomeSection } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { cn } from '@/lib/utils';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { HomeSectionTable } from '@/components/admin/home-sections/home-section-table';
import BenefitAdminList from '@/components/admin/benefit-admin-list';
import { BannerTable } from '@/components/admin/banners/banner-table';
import { CategoryTable } from '@/components/admin/categories/category-table';
import { AnnouncementTable } from '@/components/admin/announcements/announcement-table';

export default function AdminCMSPage() {
    const { isAdmin, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('banners');
    
    // --- DATA FETCHING ---
    const benefitsQuery = useMemo(() => 
        query(collection(firestore, 'perks').withConverter(createConverter<Benefit>()), orderBy('createdAt', 'desc')), 
    [firestore]);
    
    const announcementsQuery = useMemo(() => 
        query(collection(firestore, 'announcements').withConverter(createConverter<Announcement>()), orderBy('createdAt', 'desc')), 
    [firestore]);

    const bannersQuery = useMemo(() => 
        query(collection(firestore, 'banners').withConverter(createConverter<Banner>()), orderBy('createdAt', 'desc')), 
    [firestore]);

    const servicesQuery = useMemo(() => 
        query(collectionGroup(firestore, 'services').withConverter(createConverter<Service>()), orderBy('name', 'asc')),
    [firestore]);

    const productsQuery = useMemo(() => 
        query(collectionGroup(firestore, 'products').withConverter(createConverter<Product>()), orderBy('name', 'asc')),
    [firestore]);
    
    const { data: benefits, isLoading: loadingBenefits } = useCollection(benefitsQuery);
    const { data: announcements, isLoading: loadingAnnouncements } = useCollection(announcementsQuery);
    const { data: banners, isLoading: loadingBanners } = useCollection(bannersQuery);
    const { data: services, isLoading: loadingServices } = useCollection(servicesQuery);
    const { data: products, isLoading: loadingProducts } = useCollection(productsQuery);

    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    if (isUserLoading) return null;
    if (!isAdmin) return <div className="p-20 text-center font-black uppercase text-[#cb465a]">OVERLORD ACCESS REQUIRED</div>;

    // --- ACTIONS ---
    const handleToggleActive = async (item: any, type: string) => {
        try {
            let ref;
            let updateField = 'isVisible';
            
            if (type === 'perk') ref = doc(firestore, 'perks', item.id);
            else if (type === 'announcement') ref = doc(firestore, 'announcements', item.id);
            else if (type === 'banner') {
                ref = doc(firestore, 'banners', item.id);
                updateField = 'isActive';
            }
            else if (type === 'service') {
                ref = doc(firestore, 'roles_supplier', item.supplierId, 'services', item.id);
                updateField = 'isActive';
            }
            else if (type === 'product') {
                ref = doc(firestore, 'roles_supplier', item.supplierId, 'products', item.id);
                updateField = 'isActive';
            }

            if (!ref) return;

            const currentValue = item[updateField];
            await updateDoc(ref, { [updateField]: !currentValue });
            toast({ title: "Estado Actualizado", description: `El contenido ahora está ${!currentValue ? 'Activo' : 'Inactivo'}.` });
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Error al actualizar" });
        }
    };

    const handleDelete = async (item: any, type: string) => {
        if (!confirm("¿Estás seguro de eliminar este contenido permanentemente?")) return;
        try {
            let ref;
            if (type === 'perk') ref = doc(firestore, 'perks', item.id);
            else if (type === 'announcement') ref = doc(firestore, 'announcements', item.id);
            else if (type === 'banner') ref = doc(firestore, 'banners', item.id);
            else if (type === 'service') ref = doc(firestore, 'roles_supplier', item.supplierId, 'services', item.id);
            else if (type === 'product') ref = doc(firestore, 'roles_supplier', item.supplierId, 'products', item.id);

            if (!ref) return;
            await deleteDoc(ref);
            toast({ title: "Eliminado", description: "Contenido removido del sistema." });
        } catch (e) {
            toast({ variant: "destructive", title: "Error al eliminar" });
        }
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        
        const data: any = {
            updatedAt: serverTimestamp(),
        };

        let type = '';
        let pathParts: string[] = [];

        if (activeTab === 'benefits') {
            type = 'perks';
            data.title = formData.get('title');
            data.description = formData.get('description');
            data.category = formData.get('category');
            data.imageUrl = formData.get('imageUrl');
            data.points = Number(formData.get('points')) || 0;
            data.isService = formData.get('isService') === 'true';
        } else if (activeTab === 'announcements') {
            type = 'announcements';
            data.title = formData.get('title');
            data.content = formData.get('content');
            data.imageUrl = formData.get('imageUrl');
            data.linkUrl = formData.get('linkUrl');
        } else if (activeTab === 'banners') {
            type = 'banners';
            data.title = formData.get('title');
            data.description = formData.get('description');
            data.imageUrl = formData.get('imageUrl');
            data.link = formData.get('link');
            data.colorScheme = formData.get('colorScheme') || 'pink';
        } else if (activeTab === 'services') {
            data.name = formData.get('title');
            data.description = formData.get('description');
            data.duration = Number(formData.get('duration')) || 30;
            data.price = Number(formData.get('price')) || 0;
            data.imageUrl = formData.get('imageUrl');
            if (editingItem) {
                pathParts = ['roles_supplier', editingItem.supplierId, 'services', editingItem.id];
            }
        } else if (activeTab === 'products') {
            data.name = formData.get('title');
            data.description = formData.get('description');
            data.price = Number(formData.get('price')) || 0;
            data.imageUrl = formData.get('imageUrl');
            data.stockAvailable = formData.get('stockAvailable') === 'true';
            if (editingItem) {
                pathParts = ['roles_supplier', editingItem.supplierId, 'products', editingItem.id];
            }
        }

        try {
            if (editingItem) {
                const ref = pathParts.length > 0 
                    ? doc(firestore, pathParts[0], ...pathParts.slice(1)) 
                    : doc(firestore, type, editingItem.id);
                await updateDoc(ref, data);
            } else {
                if (activeTab === 'services' || activeTab === 'products') {
                    throw new Error("Crea servicios/productos desde el panel de Cluber.");
                }
                data.createdAt = serverTimestamp();
                await addDoc(collection(firestore, type), data);
            }
            toast({ title: "Guardado", description: "Contenido actualizado correctamente." });
            setIsEditorOpen(false);
            setEditingItem(null);
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: e.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-10 w-full max-w-full px-2 md:px-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-inner">
                            <Megaphone className="h-6 w-6 text-orange-500" />
                        </div>
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.3em] border-white/5 opacity-40">Marketing HQ</Badge>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-tight font-montserrat">
                        Admin <span className="text-orange-500 italic">CMS</span>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 ml-1 italic">Gestión de Experiencia Global • v3.0</p>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-orange-500 transition-colors" />
                        <Input 
                            placeholder="Filtrar contenido..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="h-12 pl-12 rounded-xl bg-card/30 border-white/5 focus:bg-card/50 text-white font-bold transition-all text-xs"
                        />
                    </div>
                    {['banners', 'perks', 'announcements'].includes(activeTab) && (
                        <Button 
                            onClick={() => { setEditingItem(null); setIsEditorOpen(true); }}
                            className="rounded-2xl h-14 bg-orange-500 text-white font-black uppercase text-[10px] tracking-widest px-8 shadow-xl hover:shadow-orange-500/20 transition-all w-full md:w-auto"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Item
                        </Button>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="bg-card/30 border border-white/5 p-1.5 rounded-2xl w-full h-auto flex flex-wrap gap-1.5 shadow-inner backdrop-blur-xl">
                    <TabsTrigger value="banners" className="flex-1 min-w-[120px] rounded-xl font-black uppercase text-[9px] tracking-widest py-3.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all">Banners</TabsTrigger>
                    <TabsTrigger value="categories" className="flex-1 min-w-[120px] rounded-xl font-black uppercase text-[9px] tracking-widest py-3.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all">Categorías</TabsTrigger>
                    <TabsTrigger value="benefits" className="flex-1 min-w-[120px] rounded-xl font-black uppercase text-[9px] tracking-widest py-3.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all">Beneficios</TabsTrigger>
                    <TabsTrigger value="announcements" className="flex-1 min-w-[120px] rounded-xl font-black uppercase text-[9px] tracking-widest py-3.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all">Anuncios</TabsTrigger>
                    <TabsTrigger value="services" className="flex-1 min-w-[120px] rounded-xl font-black uppercase text-[9px] tracking-widest py-3.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all">Servicios</TabsTrigger>
                    <TabsTrigger value="products" className="flex-1 min-w-[120px] rounded-xl font-black uppercase text-[9px] tracking-widest py-3.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all">Productos</TabsTrigger>
                </TabsList>

                {/* Banners & Home Config */}
                <TabsContent value="banners" className="space-y-12 animate-in fade-in duration-700">
                    <BannerTable search={search} />
                    
                    <div className="bg-card/30 border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-premium overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                            <Layout className="h-48 w-48" />
                        </div>
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12 relative z-10">
                            <div className="space-y-2">
                                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Arquitectura de <span className="text-primary italic">Inicio</span></h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">Malla estratégica de bloques dinámicos.</p>
                            </div>
                            
                            <Tabs defaultValue="delivery" className="w-full lg:w-auto">
                                <TabsList className="bg-background/50 border border-white/5 p-1.5 rounded-[1.5rem] h-14 w-full lg:w-[400px] shadow-inner backdrop-blur-md">
                                    <TabsTrigger value="delivery" className="flex-1 rounded-xl font-black uppercase text-[9px] tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Delivery Home</TabsTrigger>
                                    <TabsTrigger value="perks" className="flex-1 rounded-xl font-black uppercase text-[9px] tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Benefits Home</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="delivery" className="mt-8 focus-visible:outline-none animate-in slide-in-from-right-4 duration-500">
                                    <HomeSectionTable targetBoard="delivery" />
                                </TabsContent>
                                <TabsContent value="perks" className="mt-8 focus-visible:outline-none animate-in slide-in-from-right-4 duration-500">
                                    <HomeSectionTable targetBoard="perks" />
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="categories" className="animate-in fade-in duration-700">
                    <CategoryTable search={search} />
                </TabsContent>

                <TabsContent value="benefits" className="space-y-8 animate-in fade-in duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loadingBenefits ? [1,2,3].map(i => <div key={i} className="h-48 rounded-[2rem] bg-card/30 animate-pulse" />) : 
                            benefits?.filter(b => b.title.toLowerCase().includes(search.toLowerCase())).map(benefit => (
                                <ContentCard 
                                    key={benefit.id}
                                    title={benefit.title}
                                    subtitle={benefit.category}
                                    image={benefit.imageUrl}
                                    isVisible={!!benefit.isVisible}
                                    stats={`${benefit.redemptionCount || 0} canjes`}
                                    type="perk"
                                    onToggle={() => handleToggleActive(benefit, 'perk')}
                                    onDelete={() => handleDelete(benefit, 'perk')}
                                    onEdit={() => { setEditingItem(benefit); setIsEditorOpen(true); }}
                                    owner={benefit.supplierName || 'Estuclub Global'}
                                    badge={benefit.isService ? 'TURNO' : (benefit.isExclusive ? 'EXC' : undefined)}
                                />
                            ))
                        }
                    </div>
                </TabsContent>

                <TabsContent value="announcements" className="animate-in fade-in duration-700">
                    <AnnouncementTable search={search} />
                </TabsContent>

                <TabsContent value="services" className="space-y-8 animate-in fade-in duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loadingServices ? [1,2,3].map(i => <div key={i} className="h-48 rounded-[2rem] bg-card/30 animate-pulse" />) : 
                            services?.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map(service => (
                                <ContentCard 
                                    key={service.id}
                                    title={service.name}
                                    subtitle={`${service.duration} min • $${service.price}`}
                                    image={service.imageUrl}
                                    isVisible={!!service.isActive}
                                    stats="Servicio"
                                    type="service"
                                    onToggle={() => handleToggleActive(service, 'service')}
                                    onDelete={() => handleDelete(service, 'service')}
                                    onEdit={() => { setEditingItem(service); setIsEditorOpen(true); }}
                                    owner="Supplier"
                                />
                            ))
                        }
                    </div>
                </TabsContent>

                <TabsContent value="products" className="space-y-8 animate-in fade-in duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loadingProducts ? [1,2,3].map(i => <div key={i} className="h-48 rounded-[2rem] bg-card/30 animate-pulse" />) : 
                            products?.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(product => (
                                <ContentCard 
                                    key={product.id}
                                    title={product.name}
                                    subtitle={`$${product.price} • ${product.stockAvailable ? 'En Stock' : 'Sin Stock'}`}
                                    image={product.imageUrl}
                                    isVisible={!!product.isActive}
                                    stats="Producto"
                                    type="product"
                                    onToggle={() => handleToggleActive(product, 'product')}
                                    onDelete={() => handleDelete(product, 'product')}
                                    onEdit={() => { setEditingItem(product); setIsEditorOpen(true); }}
                                    owner="Supplier"
                                />
                            ))
                        }
                    </div>
                </TabsContent>
            </Tabs>

            {/* Editor Dialog */}
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <DialogContent className="bg-card/95 border-white/5 text-white max-w-2xl rounded-[2.5rem] p-8 md:p-12 backdrop-blur-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-4xl font-black italic tracking-tighter uppercase font-montserrat">
                            {editingItem ? 'Editar' : 'Crear'} <span className="text-orange-500 italic">{activeTab}</span>
                        </DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleSave} className="space-y-8 mt-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">Nombre / Título</Label>
                                <Input name="title" defaultValue={editingItem?.title || editingItem?.name} required className="h-14 bg-white/5 border-white/10 rounded-2xl focus:border-orange-500/50 transition-all font-bold" />
                            </div>
                            
                            {activeTab === 'benefits' && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">Categoría</Label>
                                    <Select name="category" defaultValue={editingItem?.category || 'Comercios'}>
                                        <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-white/10">
                                            <SelectItem value="Turismo">Turismo</SelectItem>
                                            <SelectItem value="Comercios">Comercios</SelectItem>
                                            <SelectItem value="Eventos">Eventos</SelectItem>
                                            <SelectItem value="Comida">Comida</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {activeTab === 'services' && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">Duración (min)</Label>
                                    <Input type="number" name="duration" defaultValue={editingItem?.duration || 30} className="h-14 bg-white/5 border-white/10 rounded-2xl" />
                                </div>
                            )}
                        </div>

                        {(activeTab === 'products' || activeTab === 'services') && (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">Precio ($)</Label>
                                    <Input type="number" name="price" defaultValue={editingItem?.price || 0} className="h-14 bg-white/5 border-white/10 rounded-2xl" />
                                </div>
                                {activeTab === 'products' && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">Stock</Label>
                                        <Select name="stockAvailable" defaultValue={editingItem?.stockAvailable?.toString() || 'true'}>
                                            <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-white/10">
                                                <SelectItem value="true">Disponible</SelectItem>
                                                <SelectItem value="false">Agotado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">Descripción / Contenido</Label>
                            <Textarea 
                                name={activeTab === 'announcements' ? 'content' : 'description'} 
                                defaultValue={activeTab === 'announcements' ? editingItem?.content : (editingItem?.description || '')} 
                                required 
                                className="min-h-[120px] bg-white/5 border-white/10 rounded-2xl focus:border-orange-500/50 transition-all" 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-2">URL Imagen</Label>
                            <Input name="imageUrl" defaultValue={editingItem?.imageUrl} required className="h-14 bg-white/5 border-white/10 rounded-2xl" />
                        </div>

                        <DialogFooter className="pt-6">
                            <Button type="button" variant="ghost" onClick={() => setIsEditorOpen(false)} className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</Button>
                            <Button type="submit" disabled={isSaving} className="h-14 px-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-orange-500/20">
                                {isSaving ? 'Guardando...' : 'Confirmar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ContentCard({ title, subtitle, image, isVisible, stats, type, onToggle, onDelete, onEdit, owner, badge }: any) {
    return (
        <Card className="bg-card/30 border-white/5 rounded-[2rem] overflow-hidden group hover:border-orange-500/30 transition-all duration-500 shadow-premium relative">
            <div className="relative aspect-[16/10] overflow-hidden">
                {image ? (
                    <img src={image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={title} />
                ) : (
                    <div className="w-full h-full bg-orange-500/5 flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-orange-500/20" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                
                <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className={cn("rounded-lg font-black text-[9px] px-3 py-1 uppercase tracking-widest border-none shadow-lg", isVisible ? "bg-emerald-500 text-white" : "bg-white/10 text-white/40")}>
                        {isVisible ? 'AL AIRE' : 'OCULTO'}
                    </Badge>
                    {badge && <Badge className="bg-orange-500 text-white rounded-lg font-black text-[9px] px-3 py-1 border-none tracking-widest shadow-lg">{badge}</Badge>}
                </div>

                <div className="absolute bottom-4 left-6 right-6">
                    <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.3em] mb-1 italic font-montserrat">{owner}</p>
                    <h4 className="text-xl font-black text-white uppercase tracking-tighter leading-tight italic font-montserrat truncate">{title}</h4>
                </div>
            </div>
            
            <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black text-white/30 uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                        {type === 'service' ? <Clock className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {subtitle}
                    </span>
                    <span>{stats}</span>
                </div>

                <div className="flex gap-2">
                    <Button 
                        variant="ghost" 
                        onClick={onToggle}
                        className={cn("flex-1 h-12 rounded-xl font-black text-[9px] uppercase tracking-widest border border-white/5 backdrop-blur-sm", isVisible ? "text-white/20 hover:text-white" : "text-emerald-400 hover:bg-emerald-400/10")}
                    >
                        {isVisible ? 'Ocultar' : 'Activar'}
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={onEdit}
                        className="h-12 w-12 rounded-xl bg-white/5 border border-white/5 text-white/20 hover:text-orange-500 transition-all"
                    >
                        <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={onDelete}
                        className="h-12 w-12 rounded-xl bg-white/5 border border-white/5 text-white/20 hover:text-red-500 transition-all"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}



