'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    Store, MapPin, Building2, Phone, Mail, Lock, 
    Loader2, CheckCircle2, ChevronRight, ArrowLeft, 
    ImageIcon, User as UserIcon, Wallet, ExternalLink
} from 'lucide-react';
import { getMPOAuthUrl } from '@/lib/mercadopago';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { useAuthService, useFirestore, useUser } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { haptic } from '@/lib/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import { MapLocationPicker } from '@/components/ui/map-location-picker';
import { cn } from '@/lib/utils';

const cluberSchema = z.object({
    // Step 1: Business
    supplierName: z.string().min(3, 'Nombre del local requerido'),
    category: z.string().min(1, 'Selecciona una categoría'),
    commercialPhone: z.string().min(8, 'WhatsApp inválido'),
    address: z.string().min(5, 'Ubicación requerida'),
    lat: z.number(),
    lng: z.number(),
    // Step 2: Owner
    fullName: z.string().min(3, 'Nombre requerido'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Mín. 8 caracteres'),
});

type CluberFormData = z.infer<typeof cluberSchema>;

const CATEGORIES = [
    'Comida y Bebida',
    'Indumentaria',
    'Librería y Regalos',
    'Tecnología',
    'Hogar',
    'Servicios',
    'Otro'
];

export function CluberSignupFlow() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [files, setFiles] = useState<{ logo: File | null; fachada: File | null }>({ logo: null, fachada: null });
    
    const auth = useAuthService();
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<CluberFormData>({
        resolver: zodResolver(cluberSchema),
        defaultValues: {
            supplierName: '',
            category: '',
            commercialPhone: '',
            address: '',
            lat: 0,
            lng: 0,
            fullName: '',
            email: '',
            password: ''
        }
    });

    const nextStep = async () => {
        const fields = ['supplierName', 'category', 'commercialPhone', 'address', 'lat', 'lng'];
        const isValid = await form.trigger(fields as any);
        if (isValid) {
            haptic.vibrateSubtle();
            setStep(2);
        } else {
            haptic.vibrateError();
            toast({ variant: 'destructive', title: 'Faltan datos', description: 'Por favor, completa la información del local y selecciona la ubicación en el mapa.' });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: 'logo' | 'fachada') => {
        if (e.target.files?.[0]) {
            setFiles(prev => ({ ...prev, [key]: e.target.files![0] }));
        }
    };

    const onSubmit = async (data: CluberFormData) => {
        setIsSubmitting(true);
        try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: data.fullName });

            const token = await user.getIdToken();

            // 2. Upload Files to Drive if provided
            const imageUrls: Record<string, string> = { logo: '', fachada: '' };
            const uploadPromises = Object.entries(files).map(async ([key, file]) => {
                if (!file) return null;
                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'cluber');

                const res = await fetch('/api/upload-drive', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if (res.ok) {
                    const resData = await res.json();
                    imageUrls[key] = resData.url;
                }
            });
            await Promise.all(uploadPromises);

            // 3. Batch Writes
            const batch = writeBatch(firestore);
            
            // User Doc
            batch.set(doc(firestore, 'users', user.uid), {
                uid: user.uid,
                email: data.email,
                firstName: (data.fullName || 'Propietario').split(' ')[0],
                lastName: (data.fullName || '').split(' ').slice(1).join(' ') || 'Sin_Apellido',
                role: 'cluber_pending',
                createdAt: serverTimestamp(),
            });

            // Request Doc
            const requestRef = doc(collection(firestore, 'supplier_requests'));
            batch.set(requestRef, {
                id: requestRef.id,
                userId: user.uid,
                supplierName: data.supplierName,
                category: data.category,
                address: data.address,
                lat: data.lat,
                lng: data.lng,
                commercialPhone: data.commercialPhone,
                logo: imageUrls.logo,
                fachada: imageUrls.fachada,
                status: 'pending',
                requestedAt: serverTimestamp(),
            });

            await batch.commit();
            
            haptic.vibrateSuccess();
            setIsSuccess(true);
        } catch (error: any) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo procesar tu solicitud.' });
            haptic.vibrateError();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-10">
                <div className="h-24 w-24 bg-emerald-500/10 mx-auto rounded-[2.5rem] flex items-center justify-center animate-bounce-slow border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <div className="space-y-3 px-4">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-montserrat">¡Casi listo!</h2>
                    <p className="text-xs font-bold text-foreground font-inter opacity-70 uppercase tracking-widest leading-relaxed">
                        Tu cuenta ha sido creada. Ahora, para poder cobrar tus ventas, <span className="text-[#cb465a]">necesitás vincular tu cuenta de Mercado Pago</span>.
                    </p>
                </div>
                <div className="space-y-4 px-4 pt-2">
                    <Button 
                        onClick={() => {
                            const u = auth.currentUser;
                            if (u) {
                                haptic.vibrateMedium();
                                window.location.href = getMPOAuthUrl(u.uid);
                            }
                        }}
                        className="w-full h-18 bg-[#cb465a] text-white font-black uppercase tracking-[0.2em] rounded-3xl shadow-[0_0_40px_rgba(203,70,90,0.3)] group py-8"
                    >
                        <Wallet className="mr-3 h-6 w-6" /> VINCULAR MERCADO PAGO <ExternalLink className="ml-2 h-4 w-4 opacity-40 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                    <p className="text-[9px] font-black text-foreground/40 uppercase tracking-[0.3em]">Serás redirigido a Mercado Pago para autorizar la conexión.</p>
                </div>
                <Button variant="ghost" onClick={() => window.location.href = '/'} className="w-full h-12 text-foreground/20 font-black uppercase tracking-widest text-[9px]">
                    OMITIR POR AHORA (NO PODRÁS COBRAR)
                </Button>
            </motion.div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Steps */}
            <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#cb465a] italic">Sección {step} de 2</p>
                <div className="flex gap-1.5">
                    {[1, 2].map(s => (
                        <div key={s} className={cn("h-1 w-10 rounded-full transition-all duration-500", step >= s ? "bg-[#cb465a]" : "bg-white/10")} />
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.div key="biz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="grid gap-5">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Nombre Comercial</Label>
                                <div className="relative group">
                                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-primary transition-colors" />
                                    <Input {...form.register('supplierName')} placeholder="Ej: Barber Shop 22" className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-foreground" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Ubica tu local en el mapa</Label>
                                <MapLocationPicker 
                                    onLocationSelect={(loc) => {
                                        form.setValue('lat', loc.lat);
                                        form.setValue('lng', loc.lng);
                                        form.setValue('address', loc.address);
                                    }}
                                    className="h-[240px] rounded-3xl border-white/5"
                                />
                                {form.watch('address') && (
                                    <p className="text-[9px] font-bold text-foreground italic truncate py-1 px-2 border-l-2 border-primary/20">
                                        Detectado: {form.watch('address')}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Categoría</Label>
                                    <Select onValueChange={(v) => form.setValue('category', v)} defaultValue={form.getValues('category')}>
                                        <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl text-white uppercase font-black text-[10px] tracking-widest">
                                            <SelectValue placeholder="Categoría" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#000000] border-white/10 text-white">
                                            {CATEGORIES.map(c => (
                                                <SelectItem key={c} value={c} className="uppercase font-black text-[10px] tracking-widest">{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">WhatsApp Ventas</Label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
                                        <Input {...form.register('commercialPhone')} placeholder="3755 000111" className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-foreground" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Button onClick={nextStep} className="w-full h-16 bg-[#cb465a] text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-[#cb465a]/20">
                            SIGUIENTE PASO <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div key="owner" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Nombre del Propietario</Label>
                            <div className="relative group">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
                                <Input {...form.register('fullName')} placeholder="Ej: Juan Pérez" className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-foreground" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Email y Password</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Input {...form.register('email')} type="email" placeholder="tienda@email.com" className="h-14 bg-white/5 border-white/10 rounded-2xl text-white" />
                                <Input {...form.register('password')} type="password" placeholder="••••••••" className="h-14 bg-white/5 border-white/10 rounded-2xl text-white" />
                            </div>
                        </div>

                        {/* Minimal Branding */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'logo', label: 'Logo Marca' },
                                { id: 'fachada', label: 'Foto Fachada' }
                            ].map(doc => (
                                <div key={doc.id} className="relative group h-24 bg-white/5 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center hover:border-primary/40 transition-all">
                                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, doc.id as any)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                    {files[doc.id as keyof typeof files] ? (
                                        <CheckCircle2 className="h-5 w-5 text-primary mb-1" />
                                    ) : (
                                        <ImageIcon className="h-5 w-5 text-foreground mb-1 group-hover:text-primary transition-colors" />
                                    )}
                                    <span className="text-[8px] font-black uppercase tracking-widest text-foreground">
                                        {files[doc.id as keyof typeof files] ? 'Cargado' : doc.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <Button variant="ghost" onClick={() => setStep(1)} className="h-16 w-16 bg-white/5 rounded-2xl border border-white/10 text-foreground">
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                            <Button 
                                onClick={form.handleSubmit(onSubmit)} 
                                disabled={isSubmitting}
                                className="flex-1 h-16 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20"
                            >
                                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'unirme al club'}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


