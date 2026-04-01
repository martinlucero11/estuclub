'use client';

import React, { useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Store, 
    Image as ImageIcon, 
    CheckCircle2, 
    ChevronRight, 
    Phone, 
    Building2, 
    MapPin, 
    Loader2,
    ArrowLeft,
    Building,
    Target,
    Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import MainLayout from '@/components/layout/main-layout';

// ─── TYPES ────────────────────────────────────────────────
type CluberStep = 'business' | 'contact' | 'branding' | 'payment' | 'success';

const CATEGORIES = [
    'Comida y Bebida',
    'Indumentaria',
    'Librería y Regalos',
    'Tecnología',
    'Hogar',
    'Servicios',
    'Otro'
];

import { useSearchParams } from 'next/navigation';

export default function BeCluberPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const [step, setStep] = useState<CluberStep>((searchParams.get('step') as CluberStep) || 'business');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        supplierName: '',
        category: '',
        address: '',
        commercialPhone: '',
    });

    // File State
    const [files, setFiles] = useState<{
        logo: File | null;
         fachada: File | null;
    }>({
        logo: null,
        fachada: null
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof files) => {
        if (e.target.files?.[0]) {
            setFiles(prev => ({ ...prev, [key]: e.target.files![0] }));
        }
    };

    const validateBusiness = () => formData.supplierName.length > 3 && formData.category;
    const validateContact = () => formData.address.length > 5 && formData.commercialPhone.length > 7;
    const validateBranding = () => files.logo;

    const handleSubmit = async () => {
        if (!validateBranding() || !user || !firestore) return;
        setIsSubmitting(true);

        try {
            // 1. Auth Token
            const token = await user.getIdToken();

            // 2. Upload Files to Drive API
            const uploadPromises = Object.entries(files).map(async ([key, file]) => {
                if (!file) return null;
                
                const formDataUpload = new FormData();
                formDataUpload.append('file', file);
                formDataUpload.append('folder', 'cluber');

                const res = await fetch('/api/upload-drive', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formDataUpload
                });

                if (!res.ok) throw new Error('Error al subir a Drive');
                const data = await res.json();
                return { key, url: data.url };
            });

            const results = await Promise.all(uploadPromises);
            const imageUrls = results.reduce((acc, curr) => {
                if (curr) acc[curr.key] = curr.url;
                return acc;
            }, {} as Record<string, string>);

            // 3. Save Request to Firestore (with 7-day grace period for MP)
            const gracePeriodEnd = new Date();
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

            const batch = writeBatch(firestore);
            
            // Add request
            const requestRef = doc(collection(firestore, 'supplier_requests'));
            batch.set(requestRef, {
                id: requestRef.id,
                userId: user.uid,
                ...formData,
                ...imageUrls,
                status: 'pending',
                requestedAt: serverTimestamp(),
                mp_grace_period_end: gracePeriodEnd
            });

            // Update user role
            const userRef = doc(firestore, 'users', user.uid);
            batch.update(userRef, {
                role: 'cluber_pending'
            });

            await batch.commit();

            setStep('success');
        } catch (error) {
            console.error('Error submitting shop request (Drive):', error);
            alert('Error al enviar la solicitud. Por favor reintenta.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isUserLoading) return null;

    if (!user) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                    <Card className="bg-white border-slate-200 rounded-[3rem] p-12 max-w-sm text-center space-y-8 shadow-premium border-0">
                        <div className="h-20 w-20 bg-[#d93b64]/10 rounded-3xl flex items-center justify-center mx-auto border border-[#d93b64]/20 shadow-inner">
                            <Store className="h-10 w-10 text-[#d93b64]" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Acceso Corporativo</h2>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-loose">Necesitás iniciar sesión para postular tu marca.</p>
                        </div>
                        <Button asChild className="w-full h-14 bg-slate-900 text-white font-black uppercase tracking-widest rounded-3xl shadow-xl">
                            <Link href="/login">IDENTIFICAR COMERCIO</Link>
                        </Button>
                    </Card>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-inter relative overflow-hidden">
                {/* Background Orbs */}
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-400/5 blur-[120px] rounded-full -z-10" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#d93b64]/5 blur-[100px] rounded-full -z-10" />

                <div className="max-w-2xl mx-auto px-6 pt-32 pb-40">
                    {/* Header */}
                    <header className="mb-20 space-y-6">
                        <div className="inline-flex items-center gap-3 px-6 py-2 bg-[#d93b64]/5 rounded-3xl border border-[#d93b64]/10 shadow-sm">
                            <Target className="h-4 w-4 text-[#d93b64]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d93b64]">Corporate Onboarding</span>
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic uppercase leading-[0.75] text-[#1a1a1a] select-none font-montserrat">
                                Impulsá tu <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d93b64] to-[#D00067]">Negocio</span>
                            </h1>
                            <p className="text-sm md:text-base text-slate-400 font-bold max-w-sm italic uppercase tracking-[0.2em] leading-relaxed opacity-80">Unite a la red de beneficios que mueve a los estudiantes.</p>
                        </div>
                    </header>

                    <AnimatePresence mode="wait">
                        {step === 'business' && (
                            <motion.div key="biz" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-10">
                                <Card className="bg-white border-slate-100/50 rounded-[3rem] p-10 shadow-premium border-0">
                                    <CardContent className="p-0 space-y-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre Marcial / Fantasía</Label>
                                            <div className="relative">
                                                <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                                <Input 
                                                    value={formData.supplierName}
                                                    onChange={e => setFormData({...formData, supplierName: e.target.value})}
                                                    placeholder="Ej: Mismo Studio" 
                                                    className="h-16 pl-14 bg-slate-50 border-0 rounded-3xl text-sm font-bold focus:ring-2 focus:ring-[#d93b64]/20 transition-all" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoría del rubro</Label>
                                            <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                                                <SelectTrigger className="h-16 bg-slate-50 border-0 rounded-3xl px-6 text-sm font-bold shadow-none">
                                                    <SelectValue placeholder="Seleccioná una categoría" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-slate-100">
                                                    {CATEGORIES.map(c => (
                                                        <SelectItem key={c} value={c} className="font-bold py-3">{c}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button 
                                            disabled={!validateBusiness()} 
                                            onClick={() => setStep('contact')}
                                            className="w-full h-16 bg-[#d93b64] text-white font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-[#d93b64]/20"
                                        >
                                            SIGUIENTE PASO <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {step === 'contact' && (
                            <motion.div key="contact" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-10">
                                <Card className="bg-white border-slate-100/50 rounded-[3rem] p-10 shadow-premium border-0">
                                    <CardContent className="p-0 space-y-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dirección del Local</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                                <Input 
                                                    value={formData.address}
                                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                                    placeholder="Ej: Av. Santa Fe 1234, CABA" 
                                                    className="h-16 pl-14 bg-slate-50 border-0 rounded-3xl text-sm font-bold" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono Comercial</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                                <Input 
                                                    value={formData.commercialPhone}
                                                    onChange={e => setFormData({...formData, commercialPhone: e.target.value})}
                                                    placeholder="+54 11 1234 5678" 
                                                    className="h-16 pl-14 bg-slate-50 border-0 rounded-3xl text-sm font-bold" 
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <Button variant="ghost" onClick={() => setStep('business')} className="h-16 w-16 bg-slate-50 border-0 rounded-3xl text-slate-300">
                                                <ArrowLeft className="h-6 w-6" />
                                            </Button>
                                            <Button 
                                                disabled={!validateContact()} 
                                                onClick={() => setStep('branding')}
                                                className="flex-1 h-16 bg-slate-900 text-white font-black uppercase tracking-widest rounded-3xl shadow-xl"
                                            >
                                                IDENTIDAD VISUAL <ChevronRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {step === 'branding' && (
                            <motion.div key="brand" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-8">
                                <div className="grid gap-6">
                                    {[
                                        { id: 'logo', label: 'Logo de la Marca', sub: 'Imagen cuadrada recomendada' },
                                        { id: 'fachada', label: 'Foto del Local', sub: 'Opcional (fachada o interior)' }
                                    ].map(doc => (
                                        <div key={doc.id} className="relative group overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm transition-all hover:border-[#d93b64]/30">
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={e => handleFileChange(e, doc.id as any)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="p-8 flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        "h-14 w-14 rounded-2xl flex items-center justify-center transition-colors",
                                                        files[doc.id as keyof typeof files] ? "bg-green-500/10 text-green-500" : "bg-slate-50 text-slate-300 group-hover:bg-[#d93b64]/5 group-hover:text-[#d93b64]"
                                                    )}>
                                                        {files[doc.id as keyof typeof files] ? <CheckCircle2 className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-800">{doc.label}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 italic mt-0.5">{files[doc.id as keyof typeof files] ? files[doc.id as keyof typeof files]?.name : doc.sub}</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase tracking-widest text-[#d93b64]">SELECCIONAR</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <Button variant="ghost" onClick={() => setStep('contact')} className="h-16 w-16 bg-slate-50 border-0 rounded-3xl text-slate-300">
                                        <ArrowLeft className="h-6 w-6" />
                                    </Button>
                                    <Button 
                                        disabled={!validateBranding() || isSubmitting} 
                                        onClick={() => setStep('payment')}
                                        className="flex-1 h-16 bg-[#d93b64] text-white font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-[#d93b64]/30"
                                    >
                                        VINCULAR PAGOS <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'payment' && (
                            <motion.div key="payment" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-10">
                                <Card className="bg-white border-slate-100/50 rounded-[3rem] p-10 shadow-premium border-0 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Wallet className="h-40 w-40 text-blue-600" />
                                    </div>
                                    <CardContent className="p-0 space-y-8 relative z-10">
                                        <div className="space-y-4">
                                            <div className="h-14 w-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                                <Wallet className="h-7 w-7 text-blue-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black uppercase tracking-tight italic">Conectar Mercado Pago</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enlazá tu cuenta para recibir tus cobros al instante.</p>
                                            </div>
                                        </div>

                                        <div className="p-8 rounded-[2rem] bg-blue-50/50 border border-blue-100 text-center space-y-6">
                                            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest leading-loose">
                                                Al hacer clic, serás redirigido a Mercado Pago para autorizar a <b>Estuclub</b> a gestionar tus ventas.
                                            </p>
                                            <Button 
                                                asChild
                                                className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-blue-600/20"
                                            >
                                                <a href={`https://auth.mercadopago.com.ar/authorization?client_id=YOUR_CLIENT_ID&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/mercadopago/callback?role=supplier&uid=' + user.uid)}`}>
                                                    VINCULAR MI CUENTA
                                                </a>
                                            </Button>
                                        </div>

                                        <div className="flex gap-4">
                                            <Button variant="ghost" onClick={() => setStep('branding')} className="h-16 w-16 bg-slate-50 border-0 rounded-3xl text-slate-300">
                                                <ArrowLeft className="h-6 w-6" />
                                            </Button>
                                            <Button 
                                                onClick={handleSubmit}
                                                className="flex-1 h-16 bg-slate-900/10 text-slate-400 font-black uppercase tracking-widest rounded-3xl"
                                            >
                                                SALTEAR POR AHORA
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                                <p className="text-[10px] text-center font-bold text-slate-300 italic px-10">Es recomendable vincular tu cuenta ahora para que tu comercio sea aprobado más rápido por nuestro equipo.</p>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="fixed inset-0 bg-[#FDFDFD] z-[200] flex items-center justify-center p-10">
                                <div className="text-center space-y-12 max-w-md">
                                    <div className="relative mx-auto inline-block">
                                        <div className="h-32 w-32 bg-slate-900 rounded-[2.5rem] flex items-center justify-center animate-bounce-slow shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
                                            <Building className="h-14 w-14 text-white" />
                                        </div>
                                        <div className="absolute -top-4 -right-4 h-12 w-12 bg-[#d93b64] rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="space-y-5">
                                        <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-[#1a1a1a] leading-none font-montserrat">Solicitud <br/><span className="text-[#d93b64]">Recibida</span></h2>
                                        <p className="text-slate-400 font-bold text-sm leading-relaxed max-w-[280px] mx-auto italic uppercase tracking-widest opacity-80">El equipo de expansión de Estuclub revisará tu perfil corporativo en breve.</p>
                                    </div>
                                    <Button asChild className="w-full h-16 bg-slate-900 text-white font-black uppercase tracking-widest rounded-3xl shadow-2xl">
                                        <Link href="/">FINALIZAR PROCESO</Link>
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MainLayout>
    );
}
