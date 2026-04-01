'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
    Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import MainLayout from '@/components/layout/main-layout';

// ─── TYPES ────────────────────────────────────────────────
type RiderStep = 'info' | 'vehicle' | 'docs' | 'payment' | 'success';

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

import { useSearchParams } from 'next/navigation';

// ─── MAIN COMPONENT ───────────────────────────────────────
export default function BeRiderPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const searchParams = useSearchParams();

    const [step, setStep] = useState<RiderStep>((searchParams.get('step') as RiderStep) || 'info');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeCamera, setActiveCamera] = useState<{ id: string, label: string } | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        displayName: '',
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

    const validateInfo = () => formData.displayName.length > 3 && formData.phone.length > 7;
    const validateVehicle = () => formData.vehicleType === 'bici' || formData.patente.length > 4;
    const validateDocs = () => files.dni && files.selfie && (formData.vehicleType === 'bici' || files.license);

    const handleSubmit = async () => {
        if (!validateDocs() || !user || !firestore) return;
        setIsSubmitting(true);

        try {
            // 1. Get Auth Token for API
            const token = await user.getIdToken();

            // 2. Upload Files to Drive API
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

                if (!res.ok) throw new Error('Error al subir archivo a Drive');
                const data = await res.json();
                return { key, url: data.url };
            });

            const results = await Promise.all(uploadPromises);
            const imageUrls = results.reduce((acc, curr) => {
                if (curr) acc[curr.key] = curr.url;
                return acc;
            }, {} as Record<string, string>);

            // 3. Save Application in Firestore (with Drive links and 7-day grace period)
            const gracePeriodEnd = new Date();
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

            await addDoc(collection(firestore, 'rider_applications'), {
                userId: user.uid,
                ...formData,
                ...imageUrls,
                status: 'pending',
                appliedAt: serverTimestamp(),
                mp_grace_period_end: gracePeriodEnd
            });

            setStep('success');
        } catch (error) {
            console.error('Error submitting application (Drive):', error);
            alert('Error al enviar la postulación. Por favor reintenta.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isUserLoading) return null;

    if (!user) {
        return (
            <MainLayout>
                <div className="min-h-screen bg-black flex items-center justify-center p-6">
                    <Card className="bg-zinc-900 border-zinc-800 rounded-[2.5rem] p-10 max-w-sm text-center space-y-6 shadow-2xl">
                        <div className="h-20 w-20 bg-[#d93b64]/20 rounded-3xl flex items-center justify-center mx-auto border border-[#d93b64]/30">
                            <User className="h-10 w-10 text-[#d93b64]" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Iniciá Sesión</h2>
                            <p className="text-zinc-500 font-medium text-xs leading-relaxed">Necesitás estar logueado para postularte como Rider en Estuclub.</p>
                        </div>
                        <Button asChild className="w-full h-14 bg-[#d93b64] text-white font-black uppercase tracking-widest rounded-2xl">
                            <Link href="/login">INGRESAR AHORA</Link>
                        </Button>
                    </Card>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="min-h-screen bg-[#050505] text-white font-inter relative overflow-hidden selection:bg-[#d93b64]/30">
                {/* Camera Overlay */}
                <AnimatePresence>
                    {activeCamera && (
                        <CameraCapture 
                            title={activeCamera.label} 
                            onClose={() => setActiveCamera(null)} 
                            onCapture={handleCameraCapture} 
                        />
                    )}
                </AnimatePresence>

                {/* Background Accents */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#d93b64]/5 blur-[120px] rounded-full -z-10" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#d93b64]/30 blur-[100px] rounded-full opacity-10 -z-10" />

                <div className="max-w-xl mx-auto px-6 pt-32 pb-32">
                    {/* Header */}
                    <header className="mb-12 space-y-4">
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-[#d93b64]/10 rounded-full border border-[#d93b64]/20">
                            <ShieldCheck className="h-4 w-4 text-[#d93b64]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d93b64]">Rider Onboarding</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter italic uppercase leading-[0.85] font-montserrat">
                            Sé un <br/><span className="text-[#d93b64]">Rider</span>
                        </h1>
                        <p className="text-zinc-500 font-medium text-sm leading-relaxed max-w-xs">Sumate a la logística de beneficios más grande del país.</p>
                    </header>

                    {/* Main Action Area */}
                    <AnimatePresence mode="wait">
                        {step === 'info' && (
                            <motion.div 
                                key="info" 
                                initial={{ opacity: 0, x: 20 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <Card className="bg-zinc-900/50 backdrop-blur-3xl border-white/5 rounded-[2.5rem] p-10">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#d93b64] ml-1">Nombre Completo</Label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                                <Input 
                                                    value={formData.displayName}
                                                    onChange={e => setFormData({...formData, displayName: e.target.value})}
                                                    placeholder="Ej: Juan Pérez" 
                                                    className="h-14 pl-12 bg-black/40 border-white/5 rounded-2xl focus:border-[#d93b64] transition-all" 
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-[#d93b64] ml-1">Teléfono Whatsapp</Label>
                                            <div className="relative">
                                                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                                <Input 
                                                    value={formData.phone}
                                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                                    placeholder="+54 11 1234 5678" 
                                                    className="h-14 pl-12 bg-black/40 border-white/5 rounded-2xl focus:border-[#d93b64] transition-all" 
                                                />
                                            </div>
                                        </div>
                                        <Button 
                                            disabled={!validateInfo()} 
                                            onClick={() => setStep('vehicle')}
                                            className="w-full h-14 bg-white text-black hover:bg-neutral-200 font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl"
                                        >
                                            CONTINUAR <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        )}

                        {step === 'vehicle' && (
                            <motion.div 
                                key="vehicle" 
                                initial={{ opacity: 0, x: 20 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
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
                                                formData.vehicleType === v.id ? "bg-[#d93b64] border-[#d93b64] text-white shadow-lg" : "bg-zinc-900 border-white/5 text-zinc-500"
                                            )}
                                        >
                                            <v.icon className={cn("h-8 w-8", formData.vehicleType === v.id ? "text-white" : "text-zinc-600")} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{v.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {formData.vehicleType !== 'bici' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#d93b64] ml-1">Patente del Vehículo</Label>
                                        <Input 
                                            value={formData.patente}
                                            onChange={e => setFormData({...formData, patente: e.target.value})}
                                            placeholder="AA 123 BB" 
                                            className="h-14 bg-zinc-900 border-white/5 rounded-2xl focus:border-[#d93b64]" 
                                        />
                                    </motion.div>
                                )}

                                <div className="flex gap-4">
                                    <Button variant="ghost" onClick={() => setStep('info')} className="h-14 w-20 rounded-2xl border border-white/5 text-zinc-500">
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <Button 
                                        disabled={!validateVehicle()} 
                                        onClick={() => setStep('docs')}
                                        className="flex-1 h-14 bg-white text-black font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-neutral-200"
                                    >
                                        FOTOS <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'docs' && (
                            <motion.div 
                                key="docs" 
                                initial={{ opacity: 0, x: 20 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="grid gap-6">
                                    {[
                                        { id: 'dni', label: 'Foto del DNI' },
                                        { id: 'selfie', label: 'Selfie del rostro' },
                                        { id: 'license', label: 'Licencia de conducir' }
                                    ].map(doc => (
                                        (doc.id !== 'license' || formData.vehicleType !== 'bici') && (
                                            <div key={doc.id} className="relative group">
                                                <div className={cn(
                                                    "h-24 rounded-2xl border-2 border-dashed flex items-center justify-between px-6 transition-all",
                                                    files[doc.id as keyof typeof files] ? "bg-green-500/10 border-green-500/30" : "bg-zinc-900/50 border-white/10 group-hover:border-[#d93b64]/40"
                                                )}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", files[doc.id as keyof typeof files] ? "bg-green-500/20" : "bg-zinc-800")}>
                                                            {files[doc.id as keyof typeof files] ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <Camera className="h-6 w-6 text-zinc-500" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-white">{doc.label}</p>
                                                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter truncate max-w-[150px]">
                                                                {files[doc.id as keyof typeof files] ? files[doc.id as keyof typeof files]?.name : 'Pendiente de captura'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => setActiveCamera({ id: doc.id, label: doc.label })}
                                                            className="bg-[#d93b64] text-white font-black text-[9px] uppercase tracking-widest rounded-xl px-4"
                                                        >
                                                            CÁMARA
                                                        </Button>
                                                        <div className="relative">
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                onChange={e => handleFileChange(e, doc.id as any)}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            />
                                                            <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white font-black text-[9px] uppercase tracking-widest rounded-xl px-4 pointer-events-none">
                                                                SUBIR
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <Button variant="ghost" onClick={() => setStep('vehicle')} className="h-14 w-20 rounded-2xl border border-white/5 text-zinc-500">
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <Button 
                                        disabled={!validateDocs() || isSubmitting} 
                                        onClick={() => setStep('payment')}
                                        className="flex-1 h-14 bg-[#d93b64] text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(217,59,100,0.3)] hover:scale-[1.02] transition-all"
                                    >
                                        VINCULAR PAGOS <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'payment' && (
                            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                                <Card className="bg-zinc-900/50 backdrop-blur-3xl border-white/5 rounded-[2.5rem] p-10 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                                        <Wallet className="h-48 w-48 text-[#d93b64]" />
                                    </div>
                                    <div className="space-y-8 relative z-10">
                                        <div className="space-y-3">
                                            <div className="h-14 w-14 bg-[#d93b64]/10 rounded-2xl flex items-center justify-center border border-[#d93b64]/20">
                                                <Wallet className="h-7 w-7 text-[#d93b64]" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black uppercase tracking-tight italic">Vincular Mercado Pago</h3>
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Necesario para cobrar tus comisiones al instante.</p>
                                            </div>
                                        </div>

                                        <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 text-center space-y-6">
                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-loose">
                                                Conectá tu cuenta ahora para recibir los pagos de tus entregas automáticamente.
                                            </p>
                                            <Button 
                                                asChild
                                                className="w-full h-16 bg-[#d93b64] hover:bg-[#d93b64]/90 text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_0_40px_rgba(217,59,100,0.3)] transition-all"
                                            >
                                                <a href={`https://auth.mercadopago.com.ar/authorization?client_id=YOUR_CLIENT_ID&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/mercadopago/callback?role=rider&uid=' + user.uid)}`}>
                                                    VINCULAR MI CUENTA
                                                </a>
                                            </Button>
                                        </div>

                                        <div className="flex gap-4">
                                            <Button variant="ghost" onClick={() => setStep('docs')} className="h-14 w-20 rounded-2xl border border-white/5 text-zinc-500">
                                                <ArrowLeft className="h-5 w-5" />
                                            </Button>
                                            <Button 
                                                onClick={handleSubmit}
                                                className="flex-1 h-14 bg-white/5 text-zinc-500 font-black uppercase tracking-widest rounded-2xl"
                                            >
                                                SALTEAR
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                                <p className="text-[10px] text-center font-bold text-zinc-600 italic px-10">Al vincular tu cuenta, aceptás que Estuclub realice los pagos de tus comisiones y bonos vía Mercado Pago.</p>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div 
                                key="success" 
                                initial={{ scale: 0.9, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }} 
                                className="fixed inset-0 bg-black z-[250] flex items-center justify-center p-10"
                            >
                                <div className="text-center space-y-10 max-w-sm">
                                    <div className="relative mx-auto">
                                        <div className="h-32 w-32 bg-[#d93b64] rounded-full flex items-center justify-center animate-bounce-slow">
                                            <CheckCircle2 className="h-16 w-16 text-white" />
                                        </div>
                                        <div className="absolute inset-x-0 -bottom-6 h-12 w-full bg-[#d93b64]/20 blur-3xl rounded-full" />
                                    </div>
                                    <div className="space-y-4">
                                        <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-[0.8] font-montserrat">Postulación <br/><span className="text-[#d93b64]">Enviada</span></h2>
                                        <p className="text-zinc-500 font-medium text-sm leading-relaxed px-4">¡Listo! Nuestro equipo analizará tus datos y te contactará vía Whatsapp en menos de 24hs.</p>
                                    </div>
                                    <Button asChild className="w-full h-14 bg-white text-black font-black uppercase tracking-widest rounded-3xl shadow-2xl">
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
