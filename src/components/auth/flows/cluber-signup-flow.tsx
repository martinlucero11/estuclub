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
    password: z.string().min(8, 'Mínimo 8 caracteres')
        .regex(/[a-z]/, 'Falta letra minúscula')
        .regex(/[A-Z]/, 'Falta letra mayúscula')
        .regex(/[0-9]/, 'Falta un número')
        .regex(/[^a-zA-Z0-9]/, 'Falta símbolo especial'),
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

    const handlePlanSelect = async (planId: string) => {
        setIsSubmitting(true);
        try {
            const idToken = await auth.currentUser?.getIdToken();
            const res = await fetch('/api/cluber/membership-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ planId })
            });
            const data = await res.json();
            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                throw new Error("Error al generar link");
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No pudimos generar el link de pago.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-6">
                <div className="h-16 w-16 bg-emerald-500/10 mx-auto rounded-2xl flex items-center justify-center animate-bounce-slow border border-emerald-500/20">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div className="space-y-2 px-4">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground">¡Registro Completo!</h2>
                    <p className="text-[10px] font-bold text-foreground/70 uppercase tracking-widest leading-relaxed">
                        Para activar tu comercio y aparecer en Estuclub, elegí tu plan de suscripción.
                    </p>
                </div>
                
                <div className="space-y-4 px-2 text-left">
                    {/* Plan Cluber */}
                    <div className="p-5 rounded-3xl border border-black/5 bg-white shadow-xl hover:shadow-[0_10px_30px_rgba(203,70,90,0.1)] transition-all cursor-pointer group" onClick={() => handlePlanSelect('cluber')}>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-black uppercase tracking-widest text-[#cb465a]">Plan Cluber</h3>
                            <span className="font-black text-xl italic">$25.000</span>
                        </div>
                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest mb-4">
                            Solo crea beneficios o servicios. No incluye productos ni delivery.
                        </p>
                        <Button className="w-full h-10 rounded-xl bg-black/5 text-foreground hover:bg-[#cb465a] hover:text-white uppercase font-black text-[10px] tracking-widest transition-colors" disabled={isSubmitting}>
                            {isSubmitting ? 'Procesando...' : 'Elegir Plan'}
                        </Button>
                    </div>

                    {/* Plan Delivery */}
                    <div className="p-5 rounded-3xl border border-[#cb465a]/20 bg-[#cb465a]/5 shadow-xl relative overflow-hidden flex flex-col cursor-pointer" onClick={() => handlePlanSelect('delivery')}>
                        <div className="absolute -right-4 -top-4 w-12 h-12 bg-[#cb465a] rotate-45" />
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-black uppercase tracking-widest text-foreground">Plan Delivery</h3>
                            <span className="font-black text-xl text-[#cb465a] italic">$35.000</span>
                        </div>
                        <p className="text-[9px] font-bold text-foreground/60 uppercase tracking-widest mb-4">
                            Acceso completo a creación de productos y plataforma de Delivery.
                        </p>
                        <Button className="w-full h-10 rounded-xl bg-[#cb465a] text-white hover:bg-[#cb465a]/90 uppercase font-black text-[10px] tracking-widest shadow-lg shadow-[#cb465a]/20" disabled={isSubmitting}>
                            {isSubmitting ? 'Procesando...' : 'Elegir Plan Delivery'}
                        </Button>
                    </div>

                    {/* Plan Pro */}
                    <div className="p-5 rounded-3xl border border-amber-500/30 bg-amber-500/5 shadow-xl cursor-pointer" onClick={() => handlePlanSelect('pro')}>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-black uppercase tracking-widest text-amber-600">Plan Pro ⭐</h3>
                            <span className="font-black text-xl italic">$50.000</span>
                        </div>
                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest mb-4">
                            Todo lo anterior + Comercio Destacado y aparición en publicidades.
                        </p>
                        <Button className="w-full h-10 rounded-xl bg-amber-500 text-white hover:bg-amber-600 uppercase font-black text-[10px] tracking-widest shadow-lg shadow-amber-500/20" disabled={isSubmitting}>
                            {isSubmitting ? 'Procesando...' : 'Elegir Plan Pro'}
                        </Button>
                    </div>
                </div>
                
                <Button variant="ghost" onClick={() => window.location.href = '/panel-cluber'} className="w-full mt-4 h-12 text-foreground/20 font-black uppercase tracking-widest text-[9px]">
                    Ir a mi panel (Pagar más tarde)
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
                        <div key={s} className={cn("h-1 w-10 rounded-full transition-all duration-500", step >= s ? "bg-[#cb465a]" : "bg-black/10")} />
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
                                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40 group-focus-within:text-primary transition-colors" />
                                    <Input {...form.register('supplierName')} placeholder="Ej: Barber Shop 22" className="h-14 pl-12 bg-black/[0.03] border-black/10 rounded-2xl text-foreground placeholder:text-foreground/40" />
                                </div>
                                {form.formState.errors.supplierName && <p className="text-red-500 text-[10px] font-bold ml-2 -mt-1">{form.formState.errors.supplierName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Ubica tu local en el mapa</Label>
                                <MapLocationPicker 
                                    onLocationSelect={(loc) => {
                                        form.setValue('lat', loc.lat);
                                        form.setValue('lng', loc.lng);
                                        form.setValue('address', loc.address);
                                    }}
                                    className="h-[240px] rounded-3xl border border-black/10"
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
                                        <SelectTrigger className="h-14 bg-black/[0.03] border-black/10 rounded-2xl text-foreground uppercase font-black text-[10px] tracking-widest">
                                            <SelectValue placeholder="Categoría" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-black/10 text-foreground">
                                            {CATEGORIES.map(c => (
                                                <SelectItem key={c} value={c} className="uppercase font-black text-[10px] tracking-widest">{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.category && <p className="text-red-500 text-[10px] font-bold ml-2 -mt-1">{form.formState.errors.category.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">WhatsApp Ventas</Label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                                        <Input {...form.register('commercialPhone')} placeholder="3755 000111" className="h-14 pl-12 bg-black/[0.03] border-black/10 rounded-2xl text-foreground placeholder:text-foreground/40" />
                                    </div>
                                    {form.formState.errors.commercialPhone && <p className="text-red-500 text-[10px] font-bold ml-2 -mt-1">{form.formState.errors.commercialPhone.message}</p>}
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
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                                <Input {...form.register('fullName')} placeholder="Ej: Juan Pérez" className="h-14 pl-12 bg-black/[0.03] border-black/10 rounded-2xl text-foreground placeholder:text-foreground/40" />
                            </div>
                            {form.formState.errors.fullName && <p className="text-red-500 text-[10px] font-bold ml-2 -mt-1">{form.formState.errors.fullName.message}</p>}
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Email</Label>
                                <Input {...form.register('email')} type="email" placeholder="tienda@email.com" className="w-full h-14 bg-black/[0.03] border-black/10 rounded-2xl text-foreground placeholder:text-foreground/40" />
                                {form.formState.errors.email && <p className="text-red-500 text-[10px] font-bold ml-2 -mt-1">{form.formState.errors.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Contraseña</Label>
                                <Input {...form.register('password')} type="password" placeholder="••••••••" className="w-full h-14 bg-black/[0.03] border-black/10 rounded-2xl text-foreground placeholder:text-foreground/40" />
                                {form.formState.errors.password && <p className="text-red-500 text-[10px] font-bold ml-2 -mt-1">{form.formState.errors.password.message}</p>}
                            </div>
                        </div>

                        {/* Minimal Branding */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'logo', label: 'Logo Marca' },
                                { id: 'fachada', label: 'Foto Fachada' }
                            ].map(doc => (
                                <div key={doc.id} className="relative group h-24 bg-black/[0.03] rounded-2xl border-2 border-dashed border-black/10 flex flex-col items-center justify-center hover:border-primary/40 transition-all">
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
                            <Button variant="ghost" onClick={() => setStep(1)} className="h-16 w-16 bg-black/[0.03] rounded-2xl border border-black/5 text-foreground hover:bg-black/[0.05]">
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


