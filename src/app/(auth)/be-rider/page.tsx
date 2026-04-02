'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useUser, useFirestore, useAuthService } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bike, 
    Truck, 
    Car, 
    Camera, 
    CheckCircle2, 
    ChevronRight, 
    Smartphone, 
    User, 
    Loader2,
    ArrowLeft,
    ShieldCheck,
    X,
    FlipHorizontal,
    Camera as CaptureIcon,
    Wallet,
    AtSign,
    Lock,
    Mail
} from 'lucide-react';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import MainLayout from '@/components/layout/main-layout';
import { useRouter, useSearchParams } from 'next/navigation';
import { haptic } from '@/lib/haptics';

// ─── TYPES ────────────────────────────────────────────────
type RiderStep = 'account' | 'info' | 'vehicle' | 'docs' | 'payment' | 'success';

// ─── CAMERA COMPONENT ──────────────────────────────────────
function CameraCapture({ onCapture, onClose, title }: { onCapture: (file: File) => void, onClose: () => void, title: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreamActive, setIsStreamActive] = useState(false);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreamActive(true);
            }
        } catch (err) {
            console.error("Camera Error:", err);
            alert("No se pudo acceder a la cámara. Verifica los permisos.");
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

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                
                canvasRef.current.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                        onCapture(file);
                        onClose();
                    }
                }, 'image/jpeg', 0.85);
            }
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-4"
        >
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#d93b64]">Capturando Documento</p>
                    <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">{title}</h3>
                </div>
                <Button variant="ghost" onClick={onClose} className="rounded-full h-12 w-12 bg-white/10 text-white">
                    <X className="h-6 w-6" />
                </Button>
            </div>

            <div className="relative w-full max-w-md aspect-[3/4] rounded-[2rem] overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className={cn("w-full h-full object-cover", facingMode === 'user' && "scale-x-[-1]")} 
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Guide Overlay */}
                <div className="absolute inset-8 border-2 border-dashed border-white/20 rounded-2xl pointer-events-none flex items-center justify-center">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Encuadra el documento aquí</p>
                </div>
            </div>

            <div className="mt-12 flex items-center gap-10">
                <Button 
                    variant="ghost" 
                    onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} 
                    className="h-16 w-16 rounded-full bg-white/5 text-white border border-white/10"
                >
                    <FlipHorizontal className="h-6 w-6" />
                </Button>
                
                <button 
                    onClick={capturePhoto}
                    className="h-24 w-24 rounded-full bg-white flex items-center justify-center group active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)]"
                >
                    <div className="h-20 w-20 rounded-full border-4 border-black/5 flex items-center justify-center">
                        <div className="h-16 w-16 bg-[#d93b64] rounded-full group-hover:scale-110 transition-transform" />
                    </div>
                </button>

                <div className="h-16 w-16" /> {/* Spacer */}
            </div>
        </motion.div>
    );
}

// ─── MAIN COMPONENT ───────────────────────────────────────
export default function BeRiderPage() {
    const { user: currentUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuthService();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [step, setStep] = useState<RiderStep>(() => {
        if (searchParams.get('step')) return searchParams.get('step') as RiderStep;
        return currentUser ? 'info' : 'account';
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeCamera, setActiveCamera] = useState<{ id: string, label: string } | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        vehicleType: 'bici' as 'bici' | 'moto' | 'auto',
        patente: '',
    });

    // File State
    const [files, setFiles] = useState<{
        dni: File | null;
        selfie: File | null;
        license: File | null;
    }>({
        dni: null,
        selfie: null,
        license: null
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof files) => {
        if (e.target.files?.[0]) {
            setFiles(prev => ({ ...prev, [key]: e.target.files![0] }));
        }
    };

    const handleCameraCapture = (file: File) => {
        if (activeCamera) {
            setFiles(prev => ({ ...prev, [activeCamera.id]: file }));
        }
    };

    const validateAccount = () => formData.email.includes('@') && formData.password.length >= 6 && formData.fullName.length >= 3;
    const validateInfo = () => formData.fullName.length > 3 && formData.phone.length > 7;
    const validateVehicle = () => formData.vehicleType === 'bici' || formData.patente.length > 4;
    const validateDocs = () => files.dni && files.selfie && (formData.vehicleType === 'bici' || files.license);

    const handleAccountCreation = async () => {
        if (!validateAccount() || !auth || !firestore) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: formData.fullName });
            
            await setDoc(doc(firestore, 'users', user.uid), {
                uid: user.uid,
                email: formData.email,
                firstName: formData.fullName.split(' ')[0],
                lastName: formData.fullName.split(' ').slice(1).join(' ') || '',
                role: 'rider_pending',
                createdAt: serverTimestamp(),
            });

            haptic.vibrateSuccess();
            setStep('info');
        } catch (err: any) {
            console.error(err);
            setError('Error al crear la cuenta. Verificá los datos.');
            haptic.vibrateError();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        const user = currentUser || auth?.currentUser;
        if (!validateDocs() || !user || !firestore) return;
        setIsSubmitting(true);

        try {
            const batch = writeBatch(firestore);
            const token = await user.getIdToken();

            // Upload Files
            const uploadPromises = Object.entries(files).map(async ([key, file]) => {
                if (!file) return null;
                const formDataUpload = new FormData();
                formDataUpload.append('file', file);
                formDataUpload.append('folder', 'rider');

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

            await setDoc(doc(collection(firestore, 'rider_applications')), {
                userId: user.uid,
                displayName: formData.fullName,
                phone: formData.phone,
                vehicleType: formData.vehicleType,
                patente: formData.patente,
                ...imageUrls,
                status: 'pending',
                appliedAt: serverTimestamp(),
                mp_grace_period_end: gracePeriodEnd
            });

            batch.update(doc(firestore, 'users', user.uid), { role: 'rider_pending' });
            await batch.commit();
            setStep('success');
        } catch (error) {
            console.error(error);
            alert('Error al enviar la postulación.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isUserLoading) return null;

    return (
        <MainLayout>
            <div className="min-h-screen bg-[#FDFDFD] text-slate-900 relative overflow-hidden font-inter selection:bg-[#d93b64]/10">
                <AnimatePresence>
                    {activeCamera && (
                        <CameraCapture 
                            title={activeCamera.label} 
                            onClose={() => setActiveCamera(null)} 
                            onCapture={handleCameraCapture} 
                        />
                    )}
                </AnimatePresence>

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
                            <Bike className="h-4 w-4 text-[#d93b64]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d93b64] italic">Inscripción Rider</span>
                        </div>
                    </header>

                    <AnimatePresence mode="wait">
                        {step === 'account' && (
                            <motion.div key="account" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <div className="text-center space-y-2 mb-8">
                                    <h1 className="text-4xl font-black tracking-tighter italic uppercase leading-[0.8] font-montserrat text-slate-950">
                                        Creá tu <br/><span className="text-[#d93b64]">Perfil Rider</span>
                                    </h1>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] italic max-w-xs mx-auto">Empezá con tus datos de acceso.</p>
                                </div>
                                <Card className="bg-white border-slate-100 rounded-[2.5rem] p-10 shadow-premium border-0">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#d93b64] ml-1">Nombre Completo</Label>
                                            <div className="relative group/input">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within/input:text-[#d93b64]" />
                                                <Input 
                                                    value={formData.fullName}
                                                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                                                    placeholder="Ej: Pedro González" 
                                                    className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl focus:border-[#d93b64]" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#d93b64] ml-1">Email</Label>
                                            <div className="relative group/input">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within/input:text-[#d93b64]" />
                                                <Input 
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                                    placeholder="rider@email.com" 
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

                        {step === 'info' && (
                            <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <Card className="bg-white border-slate-100 rounded-[2.5rem] p-10 shadow-premium border-0">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#d93b64] ml-1">Nombre Completo</Label>
                                            <div className="relative group/input">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                                <Input value={formData.fullName} disabled className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#d93b64] ml-1">WhatsApp</Label>
                                            <div className="relative group/input">
                                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within/input:text-[#d93b64]" />
                                                <Input 
                                                    value={formData.phone}
                                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                                    placeholder="+54 11 1234 5678" 
                                                    className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl focus:border-[#d93b64]" 
                                                />
                                            </div>
                                        </div>
                                        <Button disabled={!validateInfo()} onClick={() => setStep('vehicle')} className="w-full h-16 bg-[#d93b64] text-white font-black uppercase tracking-widest rounded-[1.5rem] shadow-xl shadow-[#d93b64]/20">
                                            CONTINUAR <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {step === 'vehicle' && (
                            <motion.div key="vehicle" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'bici', icon: Bike, label: 'Bici' },
                                        { id: 'moto', icon: Truck, label: 'Moto' },
                                        { id: 'auto', icon: Car, label: 'Auto' }
                                    ].map(v => (
                                        <button 
                                            key={v.id}
                                            onClick={() => setFormData({...formData, vehicleType: v.id as any})}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-3 h-32 rounded-3xl border-2 transition-all",
                                                formData.vehicleType === v.id ? "bg-[#d93b64] border-[#d93b64] text-white shadow-lg" : "bg-white border-slate-100 text-slate-400"
                                            )}
                                        >
                                            <v.icon className={cn("h-8 w-8", formData.vehicleType === v.id ? "text-white" : "text-slate-300")} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{v.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {formData.vehicleType !== 'bici' && (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#d93b64] ml-1">Patente</Label>
                                        <Input 
                                            value={formData.patente}
                                            onChange={e => setFormData({...formData, patente: e.target.value})}
                                            placeholder="AA 123 BB" 
                                            className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:border-[#d93b64]" 
                                        />
                                    </div>
                                )}
                                <div className="flex gap-4">
                                    <Button variant="ghost" onClick={() => setStep('info')} className="h-14 w-20 rounded-2xl border border-slate-100 text-slate-300">
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <Button disabled={!validateVehicle()} onClick={() => setStep('docs')} className="flex-1 h-14 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl">
                                        FOTOS <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'docs' && (
                            <motion.div key="docs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <div className="grid gap-4">
                                    {[
                                        { id: 'dni', label: 'DNI (Frente)' },
                                        { id: 'selfie', label: 'Selfie con fondo blanco' },
                                        { id: 'license', label: 'Licencia de Conducir' }
                                    ].map(doc => (
                                        (doc.id !== 'license' || formData.vehicleType !== 'bici') && (
                                            <div key={doc.id} className={cn(
                                                "h-24 rounded-2xl border-2 border-dashed flex items-center justify-between px-6 transition-all",
                                                files[doc.id as keyof typeof files] ? "bg-green-50/10 border-green-500/30" : "bg-slate-50/50 border-slate-100"
                                            )}>
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", files[doc.id as keyof typeof files] ? "bg-green-500/20" : "bg-slate-100 text-slate-300")}>
                                                        {files[doc.id as keyof typeof files] ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <Camera className="h-6 w-6" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">{doc.label}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[120px]">
                                                            {files[doc.id as keyof typeof files] ? files[doc.id as keyof typeof files]?.name : 'Pendiente'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button size="sm" onClick={() => setActiveCamera({ id: doc.id, label: doc.label })} className="bg-[#d93b64] text-white font-black text-[9px] uppercase tracking-widest rounded-xl">CÁMARA</Button>
                                            </div>
                                        )
                                    ))}
                                </div>
                                <div className="flex gap-4">
                                    <Button variant="ghost" onClick={() => setStep('vehicle')} className="h-14 w-20 rounded-2xl border border-slate-100 text-slate-300">
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <Button disabled={!validateDocs() || isSubmitting} onClick={() => setStep('payment')} className="flex-1 h-14 bg-[#d93b64] text-white font-black uppercase tracking-widest rounded-2xl shadow-xl">
                                        PAGOS <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'payment' && (
                            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <Card className="bg-white border-slate-100 rounded-[2.5rem] p-10 shadow-premium border-0 relative">
                                    <div className="space-y-8 relative z-10">
                                        <div className="space-y-3">
                                            <div className="h-14 w-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                                                <Wallet className="h-7 w-7 text-blue-600" />
                                            </div>
                                            <h3 className="text-xl font-black uppercase tracking-tight italic">Cobrá vía Mercado Pago</h3>
                                        </div>
                                        <div className="p-8 rounded-[2rem] bg-blue-50/50 border border-blue-100 text-center space-y-6">
                                            <p className="text-xs font-bold text-slate-600 uppercase tracking-widest leading-loose">Necesitamos tu cuenta de Mercado Pago para depositarte el pago de tus entregas.</p>
                                            <Button asChild className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl">
                                                <a href={`https://auth.mercadopago.com.ar/authorization?client_id=${process.env.NEXT_PUBLIC_MP_APP_ID}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(window.location.origin + '/api/mp/callback')}&state=${currentUser?.uid || auth?.currentUser?.uid}`}>VINCULAR CUENTA</a>
                                            </Button>
                                        </div>
                                        <div className="flex gap-4">
                                            <Button variant="ghost" onClick={() => setStep('docs')} className="h-14 w-20 rounded-2xl border border-slate-100 text-slate-300">
                                                <ArrowLeft className="h-5 w-5" />
                                            </Button>
                                            <Button onClick={handleSubmit} className="flex-1 h-14 bg-slate-900/10 text-slate-400 font-black uppercase tracking-widest rounded-2xl">SALTEAR</Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="fixed inset-0 bg-[#FDFDFD] z-[250] flex items-center justify-center p-10">
                                <div className="text-center space-y-10 max-w-sm">
                                    <div className="h-32 w-32 bg-[#d93b64] mx-auto rounded-full flex items-center justify-center animate-bounce-slow shadow-2xl">
                                        <CheckCircle2 className="h-16 w-16 text-white" />
                                    </div>
                                    <div className="space-y-4">
                                        <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-[0.8] font-montserrat">Postulación <br/><span className="text-[#d93b64]">Enviada</span></h2>
                                        <p className="text-slate-400 font-bold text-sm italic opacity-80">Nuestro equipo analizará tus datos y te contactará en menos de 24hs.</p>
                                    </div>
                                    <Button asChild className="w-full h-14 bg-slate-900 text-white font-black uppercase tracking-widest rounded-3xl shadow-2xl">
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
