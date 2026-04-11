'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, User, Phone, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthService, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { haptic } from '@/lib/haptics';
import { motion } from 'framer-motion';

const userSchema = z.object({
    fullName: z.string().min(3, 'Nombre completo requerido (mín. 3 letras)'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(8, 'Teléfono inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

type UserFormData = z.infer<typeof userSchema>;

export function UserSignupFlow() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const auth = useAuthService();
    const firestore = useFirestore();
    const { toast } = useToast();

    const { register, handleSubmit, formState: { errors } } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            fullName: '',
            email: '',
            phone: '',
            password: ''
        }
    });

    const onSubmit = async (data: UserFormData) => {
        setIsSubmitting(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: data.fullName });

            await setDoc(doc(firestore, 'users', user.uid), {
                uid: user.uid,
                email: data.email,
                firstName: data.fullName.split(' ')[0],
                lastName: data.fullName.split(' ').slice(1).join(' ') || '',
                phone: data.phone,
                role: 'user',
                isStudent: false,
                createdAt: serverTimestamp(),
            });

            await sendEmailVerification(user);
            
            haptic.vibrateSuccess();
            setIsSuccess(true);
        } catch (error: any) {
            console.error(error);
            toast({ 
                variant: 'destructive', 
                title: 'Error', 
                description: error.code === 'auth/email-already-in-use' ? 'El email ya está registrado.' : 'No se pudo crear la cuenta.' 
            });
            haptic.vibrateError();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-10">
                <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-foreground">¡Bienvenido al Club!</h2>
                    <p className="text-sm text-foreground/60 font-medium italic">Te enviamos un email de verificación. Revisa tu bandeja de entrada.</p>
                </div>
                <Button onClick={() => window.location.href = '/login'} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-2xl">
                    INICIAR SESIÓN
                </Button>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Nombre y Apellido</Label>
                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        {...register('fullName')}
                        placeholder="Ej: Juan Pérez" 
                        className="h-14 pl-12 bg-black/[0.03] border-black/10 rounded-2xl focus:border-primary/50 focus:ring-0 text-foreground placeholder:text-foreground/40" 
                    />
                </div>
                {errors.fullName && <p className="text-[10px] font-bold text-red-500 uppercase ml-1">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Email</Label>
                <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        {...register('email')}
                        type="email"
                        placeholder="tu@email.com" 
                        className="h-14 pl-12 bg-black/[0.03] border-black/10 rounded-2xl focus:border-primary/50 focus:ring-0 text-foreground placeholder:text-foreground/40" 
                    />
                </div>
                {errors.email && <p className="text-[10px] font-bold text-red-500 uppercase ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Teléfono</Label>
                <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        {...register('phone')}
                        placeholder="Ej: 3755 123456" 
                        className="h-14 pl-12 bg-black/[0.03] border-black/10 rounded-2xl focus:border-primary/50 focus:ring-0 text-foreground placeholder:text-foreground/40" 
                    />
                </div>
                {errors.phone && <p className="text-[10px] font-bold text-red-500 uppercase ml-1">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70 ml-1">Contraseña</Label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        {...register('password')}
                        type="password"
                        placeholder="••••••••" 
                        className="h-14 pl-12 bg-black/[0.03] border-black/10 rounded-2xl focus:border-primary/50 focus:ring-0 text-foreground placeholder:text-foreground/40" 
                    />
                </div>
                {errors.password && <p className="text-[10px] font-bold text-red-500 uppercase ml-1">{errors.password.message}</p>}
            </div>

            <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-16 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'unirme al club'}
            </Button>
        </form>
    );
}

