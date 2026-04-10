'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    Bike, MapPin, Truck, Car, Phone, Mail, Lock, 
    Loader2, CheckCircle2, ChevronRight, ArrowLeft, 
    Camera, User as UserIcon, X, FlipHorizontal, 
    Smartphone, Fingerprint 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthService, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { haptic } from '@/lib/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import { MapLocationPicker } from '@/components/ui/map-location-picker';
import { cn } from '@/lib/utils';

const riderSchema = z.object({
    // Step 1: Vehicle & Location
    vehicleType: z.enum(['bici', 'moto', 'auto']),
    patente: z.string().optional(),
    address: z.string().min(5, 'Ubicación requerida'),
    lat: z.number(),
    lng: z.number(),
    // Step 2: Personal
    fullName: z.string().min(3, 'Nombre requerido'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(8, 'WhatsApp inválido'),
    password: z.string().min(8, 'Mín. 8 caracteres'),
});

type RiderFormData = z.infer<typeof riderSchema>;

// --- Internal Camera Component ---
function CameraCapture({ onCapture, onClose, title }: { onCapture: (file: File) => void, onClose: () => void, title: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            console.error(err);
            alert("No se pudo acceder a la cámara.");
            onClose();
        }
    }, [facingMode, onClose]);

    React.useEffect(() => {
        startCamera();
        return () => {
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(t => t.stop());
        };
    }, [startCamera]);

    const capture = () => {
        const video = videoRef.current;
        if (!video) return;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `rider_${Date.now()}.jpg`, { type: 'image/jpeg' });
                onCapture(file);
                onClose();
            }
        }, 'image/jpeg', 0.85);
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-6">
            <div className="absolute top-8 left-8 right-8 flex justify-between items-center text-white">
                <h3 className="font-black uppercase tracking-widest text-[10px] text-primary">{title}</h3>
                <Button variant="ghost" onClick={onClose}><X /></Button>
            </div>
            <video ref={videoRef} autoPlay playsInline className="w-full max-w-md aspect-[3/4] bg-background rounded-[2rem] object-cover" />
            <div className="mt-10 flex gap-10 items-center">
                <Button variant="ghost" className="h-14 w-14 rounded-full bg-white/10" onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')}><FlipHorizontal className="text-white" /></Button>
                <div onClick={capture} className="h-20 w-20 rounded-full border-4 border-white/20 flex items-center justify-center cursor-pointer active:scale-95 transition-all">
                    <div className="h-16 w-16 bg-white rounded-full" />
                </div>
                <div className="h-14 w-14" />
            </div>
        </div>
    );
}

export function RiderSignupFlow() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [activeCamera, setActiveCamera] = useState<{ id: string, label: string } | null>(null);
    const [files, setFiles] = useState<{ dni: File | null; selfie: File | null }>({ dni: null, selfie: null });
    
    const auth = useAuthService();
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<RiderFormData>({
        resolver: zodResolver(riderSchema),
        defaultValues: {
            vehicleType: 'moto',
            patente: '',
            address: '',
            lat: 0,
            lng: 0,
            fullName: '',
            email: '',
            phone: '',
            password: ''
        }
    });

    const nextStep = async () => {
        const fields = ['vehicleType', 'address', 'lat', 'lng'];
        const isValid = await form.trigger(fields as any);
        if (isValid) {
            haptic.vibrateSubtle();
            setStep(2);
        } else {
            haptic.vibrateError();
        }
    };

    const onSubmit = async (data: RiderFormData) => {
        if (!files.dni || !files.selfie) {
            toast({ variant: 'destructive', title: 'Faltan documentos', description: 'Por favor, captura tu DNI y Selfie.' });
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Create Account in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: data.fullName });

            const token = await user.getIdToken();

            // 2. Comprehensive KYC Request (OCR + Upload + Firestore)
            const formData = new FormData();
            formData.append('dni', files.dni);
            formData.append('selfie', files.selfie);
            formData.append('fullName', data.fullName);
            formData.append('vehicleType', data.vehicleType);
            formData.append('patente', data.patente || '');
            formData.append('address', data.address);
            formData.append('lat', data.lat.toString());
            formData.append('lng', data.lng.toString());
            formData.append('phone', data.phone);

            const res = await fetch('/api/rider/onboarding-kyc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const resData = await res.json();

            if (!res.ok) {
                // If KYC fails (e.g., name mismatch), throw with the specific server message
                throw new Error(resData.error || 'Error en la verificación de identidad');
            }

            // 3. Success -> Direct Redirection (No scales)
            haptic.vibrateSuccess();
            toast({ title: "¡Verificado!", description: "Tu identidad ha sido confirmada con éxito." });
            window.location.href = '/rider';

        } catch (error: any) {
            console.error('KYC_SUBMISSION_ERROR:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Error de Validación', 
                description: error.message || 'No se pudo procesar tu inscripción.' 
            });
            haptic.vibrateError();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-10">
                <div className="h-24 w-24 bg-primary/10 mx-auto rounded-full flex items-center justify-center animate-bounce-slow border border-primary/20 shadow-2xl">
                    <Bike className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white font-montserrat">¡Postulación Enviada!</h2>
                    <p className="text-sm text-foreground font-bold opacity-70 italic max-w-xs mx-auto uppercase tracking-widest leading-relaxed">Analizaremos tus datos para activarte como Rider oficial de Alem.</p>
                </div>
                <Button onClick={() => window.location.href = '/'} className="w-full h-16 bg-background border border-white/5 text-foreground font-black uppercase tracking-widest rounded-3xl">
                    VOLVER AL INICIO
                </Button>
            </motion.div>
        );
    }

    return (
        <div className="space-y-8">
            <AnimatePresence>
                {activeCamera && (
                    <CameraCapture 
                        title={activeCamera.label} 
                        onClose={() => setActiveCamera(null)} 
                        onCapture={(f) => setFiles(prev => ({ ...prev, [activeCamera.id]: f }))} 
                    />
                )}
            </AnimatePresence>

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
                    <motion.div key="v" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'bici', icon: Bike, label: 'Bici' },
                                { id: 'moto', icon: Truck, label: 'Moto' },
                                { id: 'auto', icon: Car, label: 'Auto' }
                            ].map(v => (
                                <button 
                                    key={v.id}
                                    onClick={() => form.setValue('vehicleType', v.id as any)}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-3 h-24 rounded-2xl border transition-all",
                                        form.watch('vehicleType') === v.id ? "bg-primary border-primary text-white shadow-lg" : "bg-white/5 border-white/10 text-foreground"
                                    )}
                                >
                                    <v.icon className={cn("h-6 w-6", form.watch('vehicleType') === v.id ? "text-white" : "text-foreground")} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">{v.label}</span>
                                </button>
                            ))}
                        </div>
                        {form.watch('vehicleType') !== 'bici' && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Patente del Vehículo</Label>
                                <Input {...form.register('patente')} placeholder="Ej: AA 123 BB" className="h-14 bg-white/5 border-white/10 rounded-2xl text-white" />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Tu Base de Operación</Label>
                            <MapLocationPicker 
                                onLocationSelect={(loc) => {
                                    form.setValue('lat', loc.lat);
                                    form.setValue('lng', loc.lng);
                                    form.setValue('address', loc.address);
                                }}
                                className="h-[240px] rounded-3xl border-white/5"
                            />
                        </div>
                        <Button onClick={nextStep} className="w-full h-16 bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl">
                            DATOS PERSONALES <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div key="p" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Nombre Completo</Label>
                                <Input {...form.register('fullName')} placeholder="Pedro G." className="h-14 bg-white/5 border-white/10 rounded-2xl text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">WhatsApp</Label>
                                <Input {...form.register('phone')} placeholder="3755.." className="h-14 bg-white/5 border-white/10 rounded-2xl text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Email</Label>
                                <Input {...form.register('email')} type="email" placeholder="rider@email.com" className="h-14 bg-white/5 border-white/10 rounded-2xl text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Password</Label>
                                <Input {...form.register('password')} type="password" placeholder="••••••••" className="h-14 bg-white/5 border-white/10 rounded-2xl text-white" />
                            </div>
                        </div>

                        {/* Camera Sections */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'selfie', label: 'Selfie' },
                                { id: 'dni', label: 'DNI Frente' }
                            ].map(doc => (
                                <button 
                                    key={doc.id}
                                    onClick={() => setActiveCamera({ id: doc.id, label: doc.label })}
                                    className={cn(
                                        "h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all",
                                        files[doc.id as keyof typeof files] ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10"
                                    )}
                                >
                                    {files[doc.id as keyof typeof files] ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Camera className="h-5 w-5 text-foreground" />}
                                    <span className="text-[8px] font-black uppercase tracking-widest text-foreground mt-1">{doc.label}</span>
                                </button>
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
                                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'enviar postulación'}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

