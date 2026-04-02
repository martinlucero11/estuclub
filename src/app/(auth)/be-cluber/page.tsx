'use client';

import React, { useState, useMemo } from 'react';
import { useUser, useFirestore, useAuthService } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
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
    Target,
    Wallet,
    AtSign,
    Lock,
    Mail,
    User as UserIcon,
    ShieldCheck
} from 'lucide-react';
import NextImage from 'next/image';
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
import { useSearchParams, useRouter } from 'next/navigation';
import { haptic } from '@/lib/haptics';

// ─── TYPES ────────────────────────────────────────────────
type CluberStep = 'account' | 'business' | 'contact' | 'branding' | 'payment' | 'success';

const CATEGORIES = [
    'Comida y Bebida',
    'Indumentaria',
    'Librería y Regalos',
    'Tecnología',
    'Hogar',
    'Servicios',
    'Otro'
];

export default function BeCluberPage() {
    const { user: currentUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuthService();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Determine initial step
    const [step, setStep] = useState<CluberStep>(() => {
        if (searchParams.get('step')) return searchParams.get('step') as CluberStep;
        return currentUser ? 'business' : 'account';
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        // Account (if needed)
        email: '',
        password: '',
        fullName: '',
        // Business
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

    const validateAccount = () => formData.email.includes('@') && formData.password.length >= 6 && formData.fullName.length >= 3;
    const validateBusiness = () => formData.supplierName.length > 3 && formData.category;
    const validateContact = () => formData.address.length > 5 && formData.commercialPhone.length > 7;
    const validateBranding = () => files.logo;

    const handleAccountCreation = async () => {
        if (!validateAccount() || !auth || !firestore) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: formData.fullName });
            
            // Create user doc
            await setDoc(doc(firestore, 'users', user.uid), {
                uid: user.uid,
                email: formData.email,
                firstName: formData.fullName.split(' ')[0],
                lastName: formData.fullName.split(' ').slice(1).join(' ') || '',
                role: 'cluber_pending',
                createdAt: serverTimestamp(),
            });

            haptic.vibrateSuccess();
            setStep('business');
        } catch (err: any) {
            console.error(err);
            setError(err.message === 'auth/email-already-in-use' ? 'El email ya está registrado.' : 'Error al crear la cuenta.');
            haptic.vibrateError();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        const user = currentUser || auth?.currentUser;
        if (!validateBranding() || !user || !firestore) return;
        setIsSubmitting(true);

        try {
            const token = await user.getIdToken();

            // Upload Files to Drive
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

            const gracePeriodEnd = new Date();
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

            const batch = writeBatch(firestore);
            const requestRef = doc(collection(firestore, 'supplier_requests'));
            batch.set(requestRef, {
                id: requestRef.id,
                userId: user.uid,
                supplierName: formData.supplierName,
                category: formData.category,
                address: formData.address,
                commercialPhone: formData.commercialPhone,
                ...imageUrls,
                status: 'pending',
                requestedAt: serverTimestamp(),
                mp_grace_period_end: gracePeriodEnd
            });

            batch.update(doc(firestore, 'users', user.uid), { role: 'cluber_pending' });
            await batch.commit();
            setStep('success');
        } catch (error) {
            console.error(error);
            alert('Error al enviar la solicitud.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isUserLoading) return null;

    return (
        <MainLayout>
            <div className="min-h-screen bg-[#FDFDFD] text-slate-900 relative overflow-hidden font-inter selection:bg-[#d93b64]/10">
                {/* Background Accents */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full -z-10" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#d93b64]/5 blur-[100px] rounded-full opacity-10 -z-10" />

                <div className="mobile-container pt-32 pb-32">
                    <header className="mb-12 flex flex-col items-center text-center space-y-6">
                        <Link href="/" className="mb-2 transition-transform hover:scale-110 duration-500">
                            <NextImage 
                                src="/logo.svg" 
                                alt="EstuClub Logo" 
                                width={160} 
                                height={40} 
                                className="h-10 w-auto"
                                style={{ filter: 'invert(34%) sepia(87%) saturate(3474%) hue-rotate(325deg) brightness(88%) contrast(92%)' }}
                            />
                        </Link>
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-[#d93b64]/5 rounded-full border border-[#d93b64]/10">
                            <Store className="h-4 w-4 text-[#d93b64]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d93b64] italic">Inscripción Cluber</span>
                        </div>
                   </header>

                    <AnimatePresence mode="wait">
                        {step === 'account' && (
                            <motion.div key="account" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <div className="text-center space-y-2 mb-8">
                                    <h1 className="text-4xl font-black tracking-tighter italic uppercase leading-[0.8] font-montserrat text-slate-950">
                                        Crea tu <br/><span className="text-[#d93b64]">Cuenta Comercial</span>
                                    </h1>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] italic max-w-xs mx-auto">Empecemos con tus datos de acceso.</p>
                                </div>
                                <Card className="bg-white border-slate-100 rounded-[2.5rem] p-10 shadow-premium border-0">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#d93b64] ml-1">Nombre y Apellido</Label>
                                            <div className="relative group/input">
                                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within/input:text-[#d93b64]" />
                                                <Input 
                                                    value={formData.fullName}
                                                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                                                    placeholder="Ej: Juan Pérez" 
                                                    className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl focus:border-[#d93b64]" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#d93b64] ml-1">Email Corporativo</Label>
                                            <div className="relative group/input">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within/input:text-[#d93b64]" />
                                                <Input 
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                                    placeholder="negocio@email.com" 
                                                    className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl focus:border-[#d93b64]" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#d93b64] ml-1">Contraseña</Label>
                                            <div className="relative group/input">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within/input:text-[#d93b64]" />
                                                <Input 
                                                    type="password"
                                                    value={formData.password}
                                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                                    placeholder="••••••••" 
                                                    className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl focus:border-[#d93b64]" 
                                                />
                                            </div>
                                        </div>
                                        {error && <p className="text-[10px] font-bold text-red-500 uppercase text-center">{error}</p>}
                                        <Button 
                                            disabled={!validateAccount() || isSubmitting} 
                                            onClick={handleAccountCreation}
                                            className="w-full h-16 bg-[#d93b64] text-white font-black uppercase tracking-widest rounded-2xl"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'CONTINUAR'}
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {step === 'business' && (
                            <motion.div key="biz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <Card className="bg-white border-slate-100 rounded-[2.5rem] p-10 shadow-premium border-0">
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#d93b64] ml-1">Nombre del Local</Label>
                                            <div className="relative">
                                                <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                                <Input 
                                                    value={formData.supplierName}
                                                    onChange={e => setFormData({...formData, supplierName: e.target.value})}
                                                    placeholder="Ej: Estuclub Barber Shop" 
                                                    className="h-16 pl-14 bg-slate-50 border-0 rounded-3xl text-sm font-bold focus:ring-2 focus:ring-[#d93b64]/20 transition-all" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#d93b64] ml-1">Categoría</Label>
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
                                            CONTINUAR <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {step === 'contact' && (
                            <motion.div key="contact" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <Card className="bg-white border-slate-100 rounded-[2.5rem] p-10 shadow-premium border-0">
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#d93b64] ml-1">Dirección Exacta</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                                <Input 
                                                    value={formData.address}
                                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                                    placeholder="Ej: Av. Córdoba 1500, CABA" 
                                                    className="h-16 pl-14 bg-slate-50 border-0 rounded-3xl text-sm font-bold" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#d93b64] ml-1">WhatsApp de Ventas</Label>
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
                                            <Button variant="ghost" onClick={() => setStep('business')} className="h-16 w-16 bg-slate-50 rounded-3xl text-slate-300">
                                                <ArrowLeft className="h-6 w-6" />
                                            </Button>
                                            <Button 
                                                disabled={!validateContact()} 
                                                onClick={() => setStep('branding')}
                                                className="flex-1 h-16 bg-slate-900 text-white font-black uppercase tracking-widest rounded-3xl shadow-xl"
                                            >
                                                SIGUIENTE <ChevronRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {step === 'branding' && (
                            <motion.div key="brand" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <div className="grid gap-6">
                                    {[
                                        { id: 'logo', label: 'Logo de la Marca', sub: 'Imagen cuadrada' },
                                        { id: 'fachada', label: 'Imagen de Fachada', sub: 'Muestra tu local' }
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
                                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{files[doc.id as keyof typeof files] ? files[doc.id as keyof typeof files]?.name : doc.sub}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-4">
                                    <Button variant="ghost" onClick={() => setStep('contact')} className="h-16 w-16 bg-slate-50 rounded-3xl text-slate-300">
                                        <ArrowLeft className="h-6 w-6" />
                                    </Button>
                                    <Button 
                                        disabled={!validateBranding() || isSubmitting} 
                                        onClick={() => setStep('payment')}
                                        className="flex-1 h-16 bg-[#d93b64] text-white font-black uppercase tracking-widest rounded-3xl"
                                    >
                                        PAGOS <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'payment' && (
                            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <Card className="bg-white border-slate-100 rounded-[3rem] p-10 shadow-premium border-0 overflow-hidden relative">
                                    <div className="space-y-8 relative z-10">
                                        <div className="space-y-4">
                                            <div className="h-14 w-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                                <Wallet className="h-7 w-7 text-blue-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black uppercase tracking-tight italic">Cobros Automáticos</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enlazá Mercado Pago para recibir tus ventas.</p>
                                            </div>
                                        </div>
                                        <div className="p-8 rounded-[2rem] bg-blue-50/50 border border-blue-100 text-center space-y-6">
                                            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest leading-loose">
                                                Vincula tu cuenta para que nuestro sistema deposite tus ganancias automáticamente.
                                            </p>
                                            <Button 
                                                asChild
                                                className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-blue-600/20"
                                            >
                                                <a href={`https://auth.mercadopago.com.ar/authorization?client_id=${process.env.NEXT_PUBLIC_MP_APP_ID}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(window.location.origin + '/api/mp/callback')}&state=${currentUser?.uid || auth?.currentUser?.uid}`}>
                                                    VINCULAR MI CUENTA
                                                </a>
                                            </Button>
                                        </div>
                                        <div className="flex gap-4">
                                            <Button variant="ghost" onClick={() => setStep('branding')} className="h-16 w-16 bg-slate-50 rounded-3xl text-slate-300">
                                                <ArrowLeft className="h-6 w-6" />
                                            </Button>
                                            <Button 
                                                onClick={handleSubmit}
                                                className="flex-1 h-16 bg-slate-900/10 text-slate-400 font-black uppercase tracking-widest rounded-3xl"
                                            >
                                                SALTEAR
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="fixed inset-0 bg-[#FDFDFD] z-[200] flex items-center justify-center p-10">
                                <div className="text-center space-y-12 max-w-md">
                                    <div className="h-32 w-32 bg-slate-900 mx-auto rounded-[2.5rem] flex items-center justify-center animate-bounce-slow shadow-2xl">
                                        <Building2 className="h-14 w-14 text-white" />
                                    </div>
                                    <div className="space-y-5">
                                        <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-[#1a1a1a] leading-none font-montserrat">Postulado <br/><span className="text-[#d93b64]">Correctamente</span></h2>
                                        <p className="text-slate-400 font-bold text-sm leading-relaxed max-w-[280px] mx-auto italic uppercase tracking-widest opacity-80">El equipo de expansión de Estuclub revisará tu local en breve.</p>
                                    </div>
                                    <Button asChild className="w-full h-16 bg-slate-900 text-white font-black uppercase tracking-widest rounded-3xl shadow-2xl">
                                        <Link href="/">VOLVER AL INICIO</Link>
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
