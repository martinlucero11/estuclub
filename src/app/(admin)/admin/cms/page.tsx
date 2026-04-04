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
import { BannerTable } from '@/components/admin/banners/banner-table';
import { CategoryTable } from '@/components/admin/categories/category-table';
import { AnnouncementTable } from '@/components/admin/announcements/announcement-table';
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

                    <div className="space-y-12">
                        <BannerTable />
                        
                        <div className="bg-card/30 border border-white/5 rounded-[3rem] p-8 shadow-premium overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                                <Layout className="h-40 w-40" />
                            </div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Arquitectura de <span className="text-primary">Inicio</span></h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Configura el orden y bloques de cada pantalla principal.</p>
                                </div>
                                
                                <Tabs defaultValue="delivery" className="w-full md:w-auto">
                                    <TabsList className="bg-background/50 border border-white/5 p-1.5 rounded-[1.25rem] h-14 w-full md:w-[350px] shadow-inner">
                                        <TabsTrigger value="delivery" className="flex-1 rounded-xl font-black uppercase text-[9px] tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Delivery Home</TabsTrigger>
                                        <TabsTrigger value="perks" className="flex-1 rounded-xl font-black uppercase text-[9px] tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Benefits Home</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="delivery" className="mt-8 focus-visible:outline-none animate-in fade-in duration-500">
                                        <HomeSectionTable targetBoard="delivery" />
                                    </TabsContent>
                                    <TabsContent value="perks" className="mt-8 focus-visible:outline-none animate-in fade-in duration-500">
                                        <HomeSectionTable targetBoard="perks" />
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </div>

                <TabsContent value="categories" className="space-y-8 focus-visible:outline-none">
                    <CategoryTable />
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
                    <AnnouncementTable />
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


