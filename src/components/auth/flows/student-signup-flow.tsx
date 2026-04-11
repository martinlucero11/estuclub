'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    Mail, User, Phone, Lock, Loader2, CheckCircle2, 
    Fingerprint, University, GraduationCap, FileText, 
    ChevronRight, ArrowLeft, AlertCircle 
} from 'lucide-react';
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
import { useAuthService, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, deleteUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { haptic } from '@/lib/haptics';
import { motion, AnimatePresence } from 'framer-motion';

const studentSchema = z.object({
    // Step 1: Account
    fullName: z.string().min(3, 'Mín. 3 letras'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(8, 'Teléfono inválido'),
    dni: z.string().min(7, 'DNI inválido'),
    password: z.string().min(8, 'Mín. 8 caracteres'),
    // Step 2: Academic
    institution: z.string().min(3, 'Institución requerida'),
    educationLevel: z.enum(['Secundario', 'Terciario', 'Universitario', 'Academia', 'Cursos', 'Talleres']),
    career: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

export function StudentSignupFlow() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [certificateFile, setCertificateFile] = useState<File | null>(null);
    
    const auth = useAuthService();
    const firestore = useFirestore();
    const { toast } = useToast();

    const form = useForm<StudentFormData>({
        resolver: zodResolver(studentSchema),
        defaultValues: {
            fullName: '',
            email: '',
            phone: '',
            dni: '',
            password: '',
            institution: '',
            educationLevel: 'Universitario',
            career: ''
        }
    });

    const nextStep = async () => {
        const fields = step === 1 
            ? ['fullName', 'email', 'phone', 'dni', 'password'] 
            : ['institution', 'educationLevel', 'career'];
        
        const isValid = await form.trigger(fields as any);
        if (isValid) {
            haptic.vibrateSubtle();
            setStep(s => s + 1);
        } else {
            haptic.vibrateError();
        }
    };

    const onSubmit = async (data: StudentFormData) => {
        setIsSubmitting(true);
        try {
            // 1. Auth 
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;

            // 2. Drive Upload (if file exists)
            let certificateUrl = '';
            if (certificateFile) {
                const formData = new FormData();
                formData.append('file', certificateFile);
                formData.append('userId', user.uid);
                formData.append('firstName', data.fullName.split(' ')[0]);
                formData.append('lastName', data.fullName.split(' ').slice(1).join(' ') || '');
                formData.append('dni', data.dni);

                const uploadRes = await fetch('/api/upload-student-doc', {
                    method: 'POST',
                    body: formData,
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    certificateUrl = uploadData.webViewLink || uploadData.fileId;
                } else {
                    console.error("Fallo la carga del certificado, continuando sin él.");
                }
            }

            // 3. Firestore
            const batch = writeBatch(firestore);
            const userDocRef = doc(firestore, 'users', user.uid);
            
            batch.set(userDocRef, {
                uid: user.uid,
                email: data.email,
                firstName: data.fullName.split(' ')[0],
                lastName: data.fullName.split(' ').slice(1).join(' ') || '',
                phone: data.phone,
                dni: data.dni,
                role: 'user',
                isStudent: true,
                studentStatus: certificateFile ? 'submitted' : 'pending',
                institution: data.institution,
                educationLevel: data.educationLevel,
                career: data.career || '',
                studentCertificateUrl: certificateUrl,
                createdAt: serverTimestamp(),
            });

            await batch.commit();
            await updateProfile(user, { displayName: data.fullName });
            await sendEmailVerification(user);
            
            haptic.vibrateSuccess();
            setIsSuccess(true);
        } catch (error: any) {
            console.error(error);
            toast({ 
                variant: 'destructive', 
                title: 'Error', 
                description: 'No se pudo crear la cuenta estudiantil.' 
            });
            haptic.vibrateError();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-10">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20">
                    <GraduationCap className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground">¡Perfil Académico Creado!</h2>
                    <p className="text-sm text-foreground/60 font-medium italic">Verifica tu email para activar tus beneficios exclusivos de Estuclub.</p>
                </div>
                <Button onClick={() => window.location.href = '/login'} className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20">
                    INICIAR SESIÓN
                </Button>
            </motion.div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Step Indicator */}
            <div className="flex items-center justify-between px-2 mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Paso {step} de 2</p>
                <div className="flex gap-1">
                    <div className={cn("h-1 w-8 rounded-full transition-colors", step >= 1 ? "bg-primary" : "bg-black/10")} />
                    <div className={cn("h-1 w-8 rounded-full transition-colors", step >= 2 ? "bg-primary" : "bg-black/10")} />
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Datos Personales</Label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40 group-focus-within:text-primary" />
                                <Input {...form.register('fullName')} placeholder="Juan Pérez" className="h-14 pl-12 bg-black/[0.03] border-black/10 rounded-2xl text-foreground placeholder:text-foreground/40" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">DNI</Label>
                                <div className="relative group">
                                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                                    <Input {...form.register('dni')} placeholder="12.345.678" className="h-14 pl-12 bg-black/[0.03] border-black/10 rounded-2xl text-foreground placeholder:text-foreground/40" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">WhatsApp</Label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                                    <Input {...form.register('phone')} placeholder="3755 000111" className="h-14 pl-12 bg-black/[0.03] border-black/10 rounded-2xl text-foreground placeholder:text-foreground/40" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Email Universitario / Personal</Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                                <Input {...form.register('email')} type="email" placeholder="alumno@universidad.edu" className="h-14 pl-12 bg-black/[0.03] border-black/10 rounded-2xl text-foreground placeholder:text-foreground/40" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Contraseña</Label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                                <Input {...form.register('password')} type="password" placeholder="••••••••" className="h-14 pl-12 bg-black/[0.03] border-black/10 rounded-2xl text-foreground placeholder:text-foreground/40" />
                            </div>
                        </div>
                        <Button onClick={nextStep} className="w-full h-16 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                            SIGUIENTE <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Institución Educativa</Label>
                            <div className="relative group">
                                <University className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                                <Input {...form.register('institution')} placeholder="Ej: UNaM / Normal 1" className="h-14 pl-12 bg-black/[0.03] border-black/10 rounded-2xl text-foreground placeholder:text-foreground/40" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Nivel / Carrera</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Select onValueChange={(v) => form.setValue('educationLevel', v as any)} defaultValue={form.getValues('educationLevel')}>
                                    <SelectTrigger className="h-14 bg-black/[0.03] border-black/10 rounded-2xl text-foreground uppercase font-black text-[10px] tracking-widest">
                                        <SelectValue placeholder="Nivel" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-black/10 text-foreground">
                                        {['Secundario', 'Terciario', 'Universitario', 'Academia'].map(l => (
                                            <SelectItem key={l} value={l} className="uppercase font-black text-[10px] tracking-widest">{l}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input {...form.register('career')} placeholder="Carrera (En curso)" className="h-14 bg-black/[0.03] border-black/10 rounded-2xl text-foreground placeholder:text-foreground/40" />
                            </div>
                        </div>
                        
                        {/* Certificate Upload */}
                        <div className="space-y-3 p-5 rounded-3xl bg-primary/5 border border-primary/10">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-4 w-4 text-primary" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Validación Académica</h4>
                            </div>
                            <div className="relative h-24 border-2 border-dashed border-black/10 rounded-2xl bg-black/[0.03] flex flex-col items-center justify-center group hover:border-primary/50 transition-all cursor-pointer">
                                <input 
                                    type="file" 
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                />
                                <FileText className={cn("h-6 w-6 mb-2 transition-colors", certificateFile ? "text-primary" : "text-foreground/40")} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">
                                    {certificateFile ? certificateFile.name : "Subir Certificado Regular"}
                                </span>
                            </div>
                            <p className="text-[8px] font-bold text-foreground uppercase tracking-widest text-center italic">Opcional ahora • Requerido para beneficios exclusivos</p>
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
                                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'crear mi perfil'}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Helper for conditional classes
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}

