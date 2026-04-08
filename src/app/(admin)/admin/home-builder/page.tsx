'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HomeSectionTable } from "@/components/admin/home-sections/home-section-table";
import { Layout, Truck, Star, CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { HomeSectionDialog } from "@/components/admin/home-builder/home-section-dialog";

export default function HomeBuilderPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'delivery' | 'benefits' | 'turns'>('delivery');

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                        <Layout className="h-10 w-10 text-orange-500" />
                        Home Builder
                    </h2>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">
                        Gestiona la estructura visual de las pantallas principales
                    </p>
                </div>
                <Button 
                    onClick={() => setIsDialogOpen(true)}
                    className="rounded-2xl h-14 px-8 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 gap-3"
                >
                    <Plus className="h-5 w-5" />
                    Nuevo Bloque
                </Button>
            </div>

            <Tabs defaultValue="delivery" className="space-y-8" onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="bg-card/30 border border-white/5 p-1 rounded-2xl h-16 w-full max-w-2xl">
                    <TabsTrigger value="delivery" className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-orange-500 data-[state=active]:text-white gap-2">
                        <Truck className="h-4 w-4" />
                        Delivery
                    </TabsTrigger>
                    <TabsTrigger value="benefits" className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-orange-500 data-[state=active]:text-white gap-2">
                        <Star className="h-4 w-4" />
                        Beneficios
                    </TabsTrigger>
                    <TabsTrigger value="turns" className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-orange-500 data-[state=active]:text-white gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Turnos
                    </TabsTrigger>
                </TabsList>

                <div className="glass glass-dark rounded-[2.5rem] border border-white/5 p-8 shadow-premium min-h-[600px]">
                    <TabsContent value="delivery" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4 mb-6">
                            <h3 className="text-2xl font-extrabold tracking-tight uppercase italic">Home Delivery</h3>
                            <p className="text-xs font-bold opacity-40 uppercase tracking-widest leading-relaxed">
                                Estas secciones aparecerán en la pestaña central de la App.
                            </p>
                        </div>
                        <HomeSectionTable targetBoard="delivery" />
                    </TabsContent>

                    <TabsContent value="benefits" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4 mb-6">
                            <h3 className="text-2xl font-extrabold tracking-tight uppercase italic">Home Beneficios</h3>
                            <p className="text-xs font-bold opacity-40 uppercase tracking-widest leading-relaxed">
                                Estas secciones aparecerán en la pestaña de beneficios globales.
                            </p>
                        </div>
                        <HomeSectionTable targetBoard="benefits" />
                    </TabsContent>

                    <TabsContent value="turns" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4 mb-6">
                            <h3 className="text-2xl font-extrabold tracking-tight uppercase italic">Home Turnos</h3>
                            <p className="text-xs font-bold opacity-40 uppercase tracking-widest leading-relaxed">
                                Estas secciones aparecerán en la nueva pantalla de reserva de turnos.
                            </p>
                        </div>
                        <HomeSectionTable targetBoard="turns" />
                    </TabsContent>
                </div>
            </Tabs>

            <HomeSectionDialog 
                isOpen={isDialogOpen} 
                onOpenChange={setIsDialogOpen} 
                defaultBoard={activeTab}
            />
        </div>
    );
}
