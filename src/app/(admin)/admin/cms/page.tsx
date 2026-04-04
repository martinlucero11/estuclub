'use client';
export const dynamic = 'force-dynamic';

import { 
    Megaphone, Layout, Image as ImageIcon, Plus, 
    Gift, MessageSquare, Calendar as CalendarIcon, Truck,
    Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { HomeSectionTable } from '@/components/admin/home-sections/home-section-table';
import BenefitAdminList from '@/components/admin/benefit-admin-list';
import AnnouncementAdminList from '@/components/admin/announcement-admin-list';
import { useState } from 'react';

export default function AdminCMSPage() {
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState('banners');
    
    const handleAction = (type: string) => {
        if (type === 'Anuncios') setActiveTab('announcements');
        else if (type === 'Beneficios') setActiveTab('benefits');
        else if (type === 'Categorías') setActiveTab('categories');
        else if (type === 'Turnos') setActiveTab('turns');
        else if (type === 'Delivery') setActiveTab('delivery');
        else {
            toast({
                title: `Sección: ${type}`,
                description: "🚀 Iniciando editor de contenido...",
            });
        }
    };

    return (
        <div className="space-y-10 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Megaphone className="h-5 w-5 text-orange-500" />
                        </div>
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.3em] border-white/5 opacity-40">Marketing</Badge>
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter italic">Content <span className="text-orange-500 italic">Management</span></h1>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Gestión integral de la experiencia visual y comercial.</p>
                </div>
                <Button 
                    onClick={() => handleAction('Global')}
                    className="rounded-2xl h-14 bg-orange-500 text-white font-black uppercase text-[10px] tracking-widest px-8 shadow-xl hover:shadow-orange-500/20 transition-all shrink-0"
                >
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Contenido
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="bg-card/50 border border-white/5 p-1 rounded-2xl w-full h-auto flex flex-wrap gap-1 shadow-inner">
                    <TabsTrigger value="banners" className="flex-1 min-w-[120px] rounded-xl font-black uppercase text-[9px] tracking-widest py-3 data-[state=active]:bg-orange-500 data-[state=active]:text-white">Banners</TabsTrigger>
                    <TabsTrigger value="categories" className="flex-1 min-w-[120px] rounded-xl font-black uppercase text-[9px] tracking-widest py-3 data-[state=active]:bg-orange-500 data-[state=active]:text-white">Categorías</TabsTrigger>
                    <TabsTrigger value="benefits" className="flex-1 min-w-[120px] rounded-xl font-black uppercase text-[9px] tracking-widest py-3 data-[state=active]:bg-orange-500 data-[state=active]:text-white">Beneficios</TabsTrigger>
                    <TabsTrigger value="announcements" className="flex-1 min-w-[120px] rounded-xl font-black uppercase text-[9px] tracking-widest py-3 data-[state=active]:bg-orange-500 data-[state=active]:text-white">Anuncios</TabsTrigger>
                    <TabsTrigger value="turns" className="flex-1 min-w-[120px] rounded-xl font-black uppercase text-[9px] tracking-widest py-3 data-[state=active]:bg-orange-500 data-[state=active]:text-white">Turnos</TabsTrigger>
                    <TabsTrigger value="delivery" className="flex-1 min-w-[120px] rounded-xl font-black uppercase text-[9px] tracking-widest py-3 data-[state=active]:bg-orange-500 data-[state=active]:text-white">Delivery</TabsTrigger>
                </TabsList>

                <TabsContent value="banners" className="space-y-8 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <CMSCard 
                            title="Banner Hero" 
                            desc="Editor de carrusel principal" 
                            icon={<ImageIcon className="h-6 w-6" />} 
                            onClick={() => handleAction('Banner Hero')}
                        />
                        <CMSCard 
                            title="Promos Grid" 
                            desc="Sección de ofertas flash" 
                            icon={<Zap className="h-6 w-6" />} 
                            onClick={() => handleAction('Promos Grid')}
                        />
                    </div>
                    <div className="bg-card/30 border border-white/5 rounded-[2.5rem] p-8 shadow-premium overflow-hidden">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Gestión de Secciones de Inicio</h2>
                        <HomeSectionTable />
                    </div>
                </TabsContent>

                <TabsContent value="categories" className="space-y-8 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <CMSCard 
                            title="Icon Mappings" 
                            desc="Gestión de emojis y colores" 
                            icon={<Layout className="h-6 w-6" />} 
                            onClick={() => handleAction('Categorías')}
                        />
                    </div>
                    <div className="bg-card/30 border border-white/5 rounded-[2.5rem] p-8 shadow-premium overflow-hidden">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Gestión de Categorías</h2>
                        <p className="text-sm opacity-60">Utiliza la tabla de Secciones para gestionar el orden y visibilidad de las categorías en la home.</p>
                    </div>
                </TabsContent>

                <TabsContent value="benefits" className="space-y-8 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <CMSCard 
                            title="Destacados" 
                            desc="Beneficios top de la semana" 
                            icon={<Gift className="h-6 w-6" />} 
                            onClick={() => handleAction('Beneficios')}
                        />
                    </div>
                    <div className="bg-card/30 border border-white/5 rounded-[2.5rem] p-8 shadow-premium overflow-hidden">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Todos los Beneficios</h2>
                        <BenefitAdminList />
                    </div>
                </TabsContent>

                <TabsContent value="announcements" className="space-y-8 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <CMSCard 
                            title="Push Notify" 
                            desc="Enviador de notificaciones" 
                            icon={<MessageSquare className="h-6 w-6" />} 
                            onClick={() => handleAction('Anuncios')}
                        />
                    </div>
                    <div className="bg-card/30 border border-white/5 rounded-[2.5rem] p-8 shadow-premium overflow-hidden">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Lista de Anuncios</h2>
                        <AnnouncementAdminList />
                    </div>
                </TabsContent>

                <TabsContent value="turns" className="space-y-8 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <CMSCard 
                            title="Agenda Config" 
                            desc="Gestión de turnos médicos" 
                            icon={<CalendarIcon className="h-6 w-6" />} 
                            onClick={() => handleAction('Turnos')}
                        />
                    </div>
                    <div className="p-8 text-center bg-card/30 border border-white/5 rounded-[2.5rem]">
                        <p className="text-sm opacity-40 uppercase tracking-widest font-black italic">Módulo de Turnos Activo</p>
                    </div>
                </TabsContent>

                <TabsContent value="delivery" className="space-y-8 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <CMSCard 
                            title="Tarifas Envío" 
                            desc="Configuración de logística" 
                            icon={<Truck className="h-6 w-6" />} 
                            onClick={() => handleAction('Delivery')}
                        />
                    </div>
                    <div className="p-8 text-center bg-card/30 border border-white/5 rounded-[2.5rem]">
                        <p className="text-sm opacity-40 uppercase tracking-widest font-black italic">Módulo de Logística Activo</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function CMSCard({ title, desc, icon, onClick }: { title: string, desc: string, icon: any, onClick: () => void }) {
    return (
        <Card 
            onClick={onClick}
            className="group bg-card/30 border-white/5 rounded-[2.5rem] p-8 border-none ring-1 ring-white/5 hover:ring-orange-500/40 transition-all cursor-pointer active:scale-95 shadow-premium"
        >
            <CardContent className="p-0 space-y-6">
                <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all text-orange-500">
                    {icon}
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter group-hover:text-orange-500 transition-colors">{title}</h3>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest leading-relaxed">{desc}</p>
                </div>
            </CardContent>
        </Card>
    );
}


