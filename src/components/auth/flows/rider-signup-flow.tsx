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

const FormError = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
        <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] text-primary font-bold mt-1.5 ml-1 uppercase tracking-widest"
        >
            {message}
        </motion.p>
    );
};

// --- Internal Camera Component ---
function CameraCapture({ onCapture, onClose, title, action, onValidated }: { 
    onCapture: (file: File) => void, 
    onClose: () => void, 
    title: string,
    action: 'validate-dni' | 'validate-selfie' | 'none',
    onValidated?: (data: any) => void 
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>(action === 'validate-selfie' ? 'user' : 'environment');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
    const auth = useAuthService();

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } } 
            });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: "No se pudo acceder a la cámara." });
        }
    }, [facingMode]);

    React.useEffect(() => {
        startCamera();
        return () => {
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(t => t.stop());
        };
    }, [startCamera]);

    const captureAndValidate = async () => {
        const video = videoRef.current;
        if (!video || isAnalyzing) return;
        
        setIsAnalyzing(true);
        setStatus({ type: 'idle', message: 'Analizando...' });
        haptic.vibrateSubtle();

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        
        canvas.toBlob(async (blob) => {
            if (!blob) {
                setIsAnalyzing(false);
                return;
            }

            const file = new File([blob], `${action}_${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            if (action === 'none') {
                onCapture(file);
                onClose();
                return;
            }

            try {
                const user = auth.currentUser;
                const token = await user?.getIdToken();
                const formData = new FormData();
                formData.append(action === 'validate-dni' ? 'dni' : 'selfie', file);
                formData.append('action', action);

                const headers: Record<string, string> = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch('/api/rider/onboarding-kyc', {
                    method: 'POST',
                    headers,
                    body: formData
                });

                const data = await res.json();

                if (res.ok) {
                    setStatus({ type: 'success', message: action === 'validate-dni' ? 'DNI Detectado' : 'Rostro Validado' });
                    haptic.vibrateSuccess();
                    setTimeout(() => {
                        onCapture(file);
                        onValidated?.(data);
                        onClose();
                    }, 1000);
                } else {
                    throw new Error(data.error);
                }
            } catch (err: any) {
                setStatus({ type: 'error', message: err.message || 'Error al validar' });
                haptic.vibrateError();
                setIsAnalyzing(false);
            }
        }, 'image/jpeg', 0.90);
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-4">
            <div className="absolute top-8 left-8 right-8 flex justify-between items-center text-white z-50">
                <div className="space-y-1 text-center md:text-left">
                    <h3 className="font-black uppercase tracking-widest text-[10px] text-primary">{title}</h3>
                    <p className="text-[8px] opacity-50 uppercase tracking-widest">
                        {action === 'validate-selfie' ? 'Ubica tu rostro dentro del marco' : 'Ubica el documento dentro del marco'}
                    </p>
                </div>
                <Button variant="ghost" onClick={onClose} className="h-12 w-12 rounded-full bg-white/5"><X /></Button>
            </div>

            <div className="relative w-full max-w-md aspect-[3/4] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                
                {/* Visual Guides */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                    <div className={cn(
                        "transition-all duration-500 border-2",
                        action === 'validate-selfie' 
                            ? "w-[260px] h-[260px] rounded-full" // Face scan: Circle/Square
                            : "w-full aspect-[1.6/1] rounded-3xl", // DNI scan: Horizontal card
                        status.type === 'success' ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] bg-emerald-500/5" :
                        status.type === 'error' ? "border-primary shadow-[0_0_30px_rgba(203,70,90,0.3)] bg-primary/5" :
                        "border-white/20"
                    )}>
                        {/* Scanning Line */}
                        {isAnalyzing && (
                            <motion.div 
                                initial={{ top: '0%' }}
                                animate={{ top: '100%' }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_15px_rgba(203,70,90,1)] z-10"
                            />
                        )}
                    </div>
                </div>

                {/* Status Overlay */}
                {status.message && (
                    <div className="absolute bottom-10 left-0 right-0 flex justify-center px-4">
                         <div className={cn(
                             "px-6 py-3 rounded-2xl backdrop-blur-xl border font-black uppercase tracking-widest text-[9px] shadow-2xl animate-in fade-in slide-in-from-bottom-2",
                             status.type === 'success' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                             status.type === 'error' ? "bg-primary/20 border-primary/30 text-primary" :
                             "bg-white/10 border-white/20 text-white"
                         )}>
                             {status.message}
                         </div>
                    </div>
                )}
            </div>

            <div className="mt-10 flex gap-10 items-center">
                <Button variant="ghost" className="h-14 w-14 rounded-full bg-white/5 border border-white/10" onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')}><FlipHorizontal className="text-white" /></Button>
                <button 
                    onClick={captureAndValidate} 
                    disabled={isAnalyzing}
                    className="h-24 w-24 rounded-full border-4 border-white/20 flex items-center justify-center cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                >
                    <div className={cn("h-20 w-20 rounded-full transition-all flex items-center justify-center", isAnalyzing ? "bg-white/20" : "bg-white")}>
                        {isAnalyzing && <Loader2 className="h-8 w-8 text-white animate-spin" />}
                    </div>
                </button>
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
    const [isNameVerified, setIsNameVerified] = useState(false);
    
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

    const { register, handleSubmit, trigger, formState: { errors } } = form;

    const nextStep = async () => {
        const fields = ['vehicleType', 'address', 'lat', 'lng'];
        const isValid = await trigger(fields as any);
        if (isValid) {
            haptic.vibrateSubtle();
            setStep(2);
        } else {
            haptic.vibrateError();
            // Optional: toast if map isn't selected
            if (!form.getValues('lat')) {
                toast({ variant: 'destructive', title: 'Ubicación requerida', description: 'Por favor, selecciona tu base de operación en el mapa.' });
            }
        }
    };

    const onSubmit = async (data: RiderFormData) => {
        if (!files.dni || !files.selfie) {
            toast({ variant: 'destructive', title: 'Faltan documentos', description: 'Por favor, captura tu DNI y Selfie.' });
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Create Account (Only now that we verified everything)
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: data.fullName });

            const token = await user.getIdToken();

            // 2. Final Submit (Upload to Drive)
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
            formData.append('action', 'submit-onboarding');

            const res = await fetch('/api/rider/onboarding-kyc', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) throw new Error('Error al finalizar el registro');

            haptic.vibrateSuccess();
            toast({ title: "¡Bienvenido Rider!", description: "Has completado tu registro con éxito." });
            window.location.href = '/rider';

        } catch (error: any) {
            console.error('KYC_SUBMISSION_ERROR:', error);
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo procesar tu inscripción.' });
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
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground font-montserrat">¡Postulación Enviada!</h2>
                    <p className="text-sm text-foreground/60 font-bold italic max-w-xs mx-auto uppercase tracking-widest leading-relaxed">Analizaremos tus datos para activarte como Rider oficial de Alem.</p>
                </div>
                <Button onClick={() => window.location.href = '/'} className="w-full h-16 bg-white border border-black/10 text-foreground font-black uppercase tracking-widest rounded-3xl shadow-sm hover:bg-black/[0.02]">
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
                        action={activeCamera.id === 'dni' ? 'validate-dni' : 'validate-selfie'}
                        onClose={() => setActiveCamera(null)} 
                        onCapture={(f) => setFiles(prev => ({ ...prev, [activeCamera.id]: f }))} 
                        onValidated={(data) => {
                            if (activeCamera.id === 'dni' && data.fullName) {
                                form.setValue('fullName', data.fullName);
                                setIsNameVerified(true);
                                toast({ title: "Nombre Autocompletado", description: `Detectamos: ${data.fullName}` });
                            }
                        }}
                    />
                )}
            </AnimatePresence>

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
                                        form.watch('vehicleType') === v.id ? "bg-primary border-primary text-white shadow-lg" : "bg-black/[0.03] border-black/10 text-foreground"
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
                                <Input 
                                    {...register('patente')} 
                                    placeholder="Ej: AA 123 BB" 
                                    className="h-14 bg-muted/50 border-white/10 rounded-2xl text-foreground placeholder:text-foreground/40" 
                                />
                                <FormError message={errors.patente?.message} />
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
                                className="h-[240px] rounded-3xl border border-black/5"
                            />
                            <FormError message={errors.address?.message} />
                        </div>
                        <Button onClick={nextStep} className="w-full h-16 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90">
                            SIGUIENTE SECCIÓN <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div key="p" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70">Nombre Completo</Label>
                                    {isNameVerified && (
                                        <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1">
                                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">DNI Verificado</span>
                                        </motion.div>
                                    )}
                                </div>
                                <Input 
                                    {...register('fullName')} 
                                    placeholder="Pedro G." 
                                    disabled={isNameVerified}
                                    className={cn(
                                        "h-14 border-white/10 rounded-2xl placeholder:text-foreground/40 transition-all",
                                        isNameVerified ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted/50 text-foreground"
                                    )} 
                                />
                                <FormError message={errors.fullName?.message} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">WhatsApp</Label>
                                <Input 
                                    {...register('phone')} 
                                    placeholder="3755.." 
                                    className="h-14 bg-muted/50 border-white/10 rounded-2xl text-foreground placeholder:text-foreground/40" 
                                />
                                <FormError message={errors.phone?.message} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Email</Label>
                                <Input 
                                    {...register('email')} 
                                    type="email" 
                                    placeholder="rider@email.com" 
                                    className="h-14 bg-muted/50 border-white/10 rounded-2xl text-foreground placeholder:text-foreground/40" 
                                />
                                <FormError message={errors.email?.message} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Password</Label>
                                <Input 
                                    {...register('password')} 
                                    type="password" 
                                    placeholder="••••••••" 
                                    className="h-14 bg-muted/50 border-white/10 rounded-2xl text-foreground placeholder:text-foreground/40" 
                                />
                                <FormError message={errors.password?.message} />
                            </div>
                        </div>

                        {/* Camera Sections */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'dni', label: 'Escanear DNI' },
                                { id: 'selfie', label: 'Validar Rostro' }
                            ].map(doc => (
                                <button 
                                    key={doc.id}
                                    type="button"
                                    onClick={() => setActiveCamera({ id: doc.id, label: doc.label })}
                                    className={cn(
                                        "h-24 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all",
                                        files[doc.id as keyof typeof files] ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-black/[0.03] border-black/10 text-foreground"
                                    )}
                                >
                                    {files[doc.id as keyof typeof files] ? <CheckCircle2 className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
                                    <span className="text-[9px] font-black uppercase tracking-widest mt-2">{doc.label}</span>
                                    {doc.id === 'dni' && files.dni && <p className="text-[7px] uppercase mt-1 opacity-50">DNI LEÍDO</p>}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <Button variant="ghost" onClick={() => setStep(1)} className="h-16 w-16 bg-black/[0.03] rounded-2xl border border-black/5 text-foreground">
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

