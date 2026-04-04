'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { HomeConfig, HomeHero, HomeBannerConfig } from '@/types/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DualImageField } from '@/components/ui/dual-image-field';
import { 
    LayoutTemplate, 
    Sparkles, 
    Image as ImageIcon, 
    Settings2, 
    Eye, 
    Save, 
    Plus, 
    Trash2, 
    MoveUp, 
    MoveDown,
    Link as LinkIcon,
    Smartphone,
    Monitor,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SplashScreen from '@/components/layout/splash-screen';

export default function HomeBuilderPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [config, setConfig] = useState<Partial<HomeConfig>>({
        hero: { title: '', subtitle: '', ctaText: '', ctaLink: '', bgImage: '' },
        banners: [],
        visibility: { showRiders: true, showCincoDos: true, showBenefits: true, showDelivery: true }
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');

    useEffect(() => {
        if (!firestore) return;
        
        const unsubscribe = onSnapshot(doc(firestore, 'settings', 'home_config'), (doc) => {
            if (doc.exists()) {
                setConfig(doc.data() as HomeConfig);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [firestore]);

    const handleSave = async () => {
        if (!firestore) return;
        setIsSaving(true);
        try {
            await setDoc(doc(firestore, 'settings', 'home_config'), {
                ...config,
                updatedAt: serverTimestamp()
            }, { merge: true });
            toast({ title: "✅ CAMBIOS PUBLICADOS", description: "La Landing Page ha sido actualizada globalmente." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error al publicar", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const addBanner = () => {
        const newBanner: HomeBannerConfig = {
            id: crypto.randomUUID(),
            title: 'Nuevo Banner',
            image: '',
            link: '',
            order: config.banners?.length || 0,
            isActive: true
        };
        setConfig({ ...config, banners: [...(config.banners || []), newBanner] });
    };

    const removeBanner = (id: string) => {
        setConfig({ ...config, banners: config.banners?.filter(b => b.id !== id) });
    };

    const updateBanner = (id: string, updates: Partial<HomeBannerConfig>) => {
        setConfig({
            ...config,
            banners: config.banners?.map(b => b.id === id ? { ...b, ...updates } : b)
        });
    };

    if (isUserLoading || isLoading) return <SplashScreen />;

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-fade-in pb-20">
            {/* BUILDER CONTROLS */}
            <div className="flex-1 space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(255,0,127,0.3)]">
                            <LayoutTemplate className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter italic text-white leading-none">Home <span className="text-primary">Builder</span></h1>
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mt-1">Arquitecto de Landing Page 2.0</p>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full md:w-auto h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,0,127,0.4)] hover:scale-105 active:scale-95 transition-all"
                    >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                        Publicar Cambios
                    </Button>
                </header>

                <Tabs defaultValue="hero" className="w-full space-y-6">
                    <TabsList className="bg-white/5 border border-white/5 p-1 rounded-2xl w-full h-14">
                        <TabsTrigger value="hero" className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest">
                            <Sparkles className="h-4 w-4 mr-2" /> Hero Section
                        </TabsTrigger>
                        <TabsTrigger value="banners" className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest">
                            <ImageIcon className="h-4 w-4 mr-2" /> Banners
                        </TabsTrigger>
                        <TabsTrigger value="visibility" className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest">
                            <Settings2 className="h-4 w-4 mr-2" /> Estructura
                        </TabsTrigger>
                    </TabsList>

                    {/* HERO EDITOR */}
                    <TabsContent value="hero" className="focus-visible:outline-none">
                        <Card className="rounded-[2.5rem] border-white/5 glass-dark overflow-hidden shadow-2xl">
                            <CardHeader className="p-8 border-b border-white/5 bg-white/5">
                                <CardTitle className="text-xl font-black uppercase tracking-widest">Hero Configuration</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Título Principal</Label>
                                        <Input 
                                            value={config.hero?.title} 
                                            onChange={e => setConfig({...config, hero: {...config.hero!, title: e.target.value}})}
                                            className="h-12 bg-white/5 border-white/10 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Subtítulo</Label>
                                        <Input 
                                            value={config.hero?.subtitle} 
                                            onChange={e => setConfig({...config, hero: {...config.hero!, subtitle: e.target.value}})}
                                            className="h-12 bg-white/5 border-white/10 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Texto del Botón (CTA)</Label>
                                        <Input 
                                            value={config.hero?.ctaText} 
                                            onChange={e => setConfig({...config, hero: {...config.hero!, ctaText: e.target.value}})}
                                            className="h-12 bg-white/5 border-white/10 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Link del Botón</Label>
                                        <Input 
                                            value={config.hero?.ctaLink} 
                                            onChange={e => setConfig({...config, hero: {...config.hero!, ctaLink: e.target.value}})}
                                            className="h-12 bg-white/5 border-white/10 rounded-xl"
                                        />
                                    </div>
                                </div>
                                <DualImageField 
                                    label="Imagen de Fondo (Background)" 
                                    value={config.hero?.bgImage || ''} 
                                    onChange={url => setConfig({...config, hero: {...config.hero!, bgImage: url}})}
                                    folder="home"
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* BANNERS MANAGER */}
                    <TabsContent value="banners" className="focus-visible:outline-none">
                        <div className="space-y-6">
                            <Button 
                                onClick={addBanner}
                                variant="outline" 
                                className="w-full h-16 rounded-[2rem] border-dashed border-primary/30 text-primary hover:bg-primary/5 font-black uppercase tracking-widest"
                            >
                                <Plus className="h-5 w-5 mr-2" /> Añadir Nuevo Banner
                            </Button>

                            <div className="grid gap-6">
                                {config.banners?.sort((a,b) => a.order - b.order).map((banner) => (
                                    <Card key={banner.id} className="rounded-[2.5rem] border-white/5 glass-dark overflow-hidden group">
                                        <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
                                            <div className="h-24 w-40 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shrink-0 relative">
                                                {banner.image ? (
                                                    <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                                <div className="space-y-1">
                                                    <Label className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Título Interno</Label>
                                                    <Input 
                                                        value={banner.title} 
                                                        onChange={e => updateBanner(banner.id, { title: e.target.value })}
                                                        className="h-10 bg-white/5 border-white/5 rounded-xl border-none"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Link Destino</Label>
                                                    <Input 
                                                        value={banner.link} 
                                                        onChange={e => updateBanner(banner.id, { link: e.target.value })}
                                                        className="h-10 bg-white/5 border-white/5 rounded-xl border-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button size="icon" variant="ghost" className="rounded-xl text-red-500 hover:bg-red-500/10" onClick={() => removeBanner(banner.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <div className="flex flex-col gap-1">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" disabled={banner.order === 0}>
                                                        <MoveUp className="h-3 w-3" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg">
                                                        <MoveDown className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <div className="px-6 pb-6 pt-2">
                                            <DualImageField 
                                                value={banner.image} 
                                                onChange={url => updateBanner(banner.id, { image: url })}
                                                folder="banners"
                                            />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* VISIBILITY TOGGLES */}
                    <TabsContent value="visibility" className="focus-visible:outline-none">
                        <Card className="rounded-[2.5rem] border-white/5 glass-dark overflow-hidden shadow-2xl">
                            <CardContent className="p-8 space-y-6">
                                {[
                                    { id: 'showBenefits', label: 'Módulo de Beneficios', desc: 'Gestiona la visualización del carrusel de descuentos.' },
                                    { id: 'showDelivery', label: 'Ecosistema Delivery', desc: 'Activa o desactiva la integración de pedidos.' },
                                    { id: 'showRiders', label: 'Sección de Riders', desc: 'Muestra u oculta la convocatoria a repartidores.' },
                                    { id: 'showCincoDos', label: 'Módulo Cinco.Dos', desc: 'Visibilidad del proyecto social y comedores.' }
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-[2rem] group hover:bg-white/10 transition-all">
                                        <div className="space-y-1">
                                            <p className="text-xs font-black uppercase tracking-widest">{item.label}</p>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">{item.desc}</p>
                                        </div>
                                        <Switch 
                                            checked={(config.visibility as any)?.[item.id]} 
                                            onCheckedChange={(val) => setConfig({
                                                ...config, 
                                                visibility: { ...(config.visibility as any), [item.id]: val }
                                            })}
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* LIVE PREVIEW AREA */}
            <aside className="w-full lg:w-[400px] shrink-0 space-y-6">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        <h2 className="text-[10px] font-black uppercase tracking-widest">Live Preview</h2>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-xl">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn("h-8 w-8 rounded-lg", previewMode === 'mobile' && "bg-primary text-white shadow-lg")}
                            onClick={() => setPreviewMode('mobile')}
                        >
                            <Smartphone className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn("h-8 w-8 rounded-lg", previewMode === 'desktop' && "bg-primary text-white shadow-lg")}
                            onClick={() => setPreviewMode('desktop')}
                        >
                            <Monitor className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <Card className={cn(
                    "bg-black border-white/10 overflow-hidden relative transition-all duration-500",
                    previewMode === 'mobile' ? "w-[320px] mx-auto h-[600px] rounded-[3rem] border-8 border-white/5 shadow-2xl" : "w-full h-[500px] rounded-3xl"
                )}>
                    {/* SIMULATED HOME RENDERING */}
                    <div className="h-full w-full overflow-y-auto bg-[#0a0a0a] custom-scrollbar scroll-smooth">
                        {/* Simulated Hero */}
                        <div className="relative h-64 w-full flex flex-col justify-end p-6 overflow-hidden">
                            {config.hero?.bgImage ? (
                                <img src={config.hero.bgImage} className="absolute inset-0 h-full w-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-black" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                            <div className="relative z-10 space-y-2">
                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">{config.hero?.title || 'Estuclub Premium'}</h3>
                                <p className="text-[10px] text-white/70 italic uppercase tracking-wider font-bold">{config.hero?.subtitle || 'Bienvenido a la red'}</p>
                                <Button size="sm" className="h-8 px-4 rounded-lg bg-primary text-white font-black uppercase text-[8px] tracking-widest mt-2">
                                    {config.hero?.ctaText || 'Explorar'}
                                </Button>
                            </div>
                        </div>

                        {/* Simulated Banners */}
                        <div className="p-4 space-y-4">
                            <div className="flex gap-4 overflow-x-auto pb-2 scroll-hide">
                                {config.banners?.filter(b => b.isActive).map(b => (
                                    <div key={b.id} className="min-w-[200px] h-28 rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative">
                                         {b.image && <img src={b.image} className="absolute inset-0 h-full w-full object-cover" />}
                                         <div className="absolute inset-0 bg-black/20" />
                                         <p className="absolute bottom-3 left-3 text-[9px] font-black uppercase tracking-widest text-white">{b.title}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Simulated Sections */}
                            {config.visibility?.showBenefits && (
                                <div className="space-y-3">
                                    <h4 className="text-[9px] font-black text-white/40 uppercase tracking-widest px-1">Beneficios Destacados</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="h-20 rounded-xl bg-white/5 border border-white/5" />
                                        <div className="h-20 rounded-xl bg-white/5 border border-white/5" />
                                    </div>
                                </div>
                            )}

                            {config.visibility?.showRiders && (
                                <div className="bg-primary/20 border border-primary/30 p-4 rounded-2xl text-center space-y-2">
                                    <p className="text-[10px] font-black text-primary uppercase">¡Únete como Rider!</p>
                                    <div className="h-1.5 w-full bg-primary/20 rounded-full overflow-hidden">
                                        <div className="h-full w-1/2 bg-primary" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] font-bold text-foreground/40 italic text-center">
                        La previsualización utiliza el estado local. Pulsa "Publicar" para impactar en producción.
                    </p>
                </div>
            </aside>
        </div>
    );
}
