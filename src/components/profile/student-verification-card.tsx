'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, FileUp, Loader2, Clock, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface StudentVerificationCardProps {
    userProfile: {
        id: string;
        firstName: string;
        lastName: string;
        dni: string;
        isStudent: boolean;
        studentStatus?: 'pending' | 'submitted' | 'verified';
        studentCertificateUrl?: string;
        certificateDeadline?: any;
    };
    onUploadSuccess?: () => void;
}

export function StudentVerificationCard({ userProfile, onUploadSuccess }: StudentVerificationCardProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // If not a student or already has a certificate, don't show
    if (!userProfile.isStudent || userProfile.studentCertificateUrl) {
        if (userProfile.studentStatus === 'verified') {
            return (
                <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-8">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-black uppercase tracking-widest text-emerald-600">Estudiante Verificado</span>
                </div>
            );
        }
        if (userProfile.studentStatus === 'submitted') {
             return (
                <div className="flex items-center gap-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-8">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-black uppercase tracking-widest text-amber-600">Certificado en Revisión</span>
                </div>
            );
        }
        return null;
    }

    const handleUpload = async () => {
        if (!file || !firestore) return;

        setIsUploading(true);
        haptic.vibrateImpact();
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', userProfile.id);
            formData.append('firstName', userProfile.firstName);
            formData.append('lastName', userProfile.lastName);
            formData.append('dni', userProfile.dni);

            const response = await fetch('/api/upload-student-doc', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                // Determine if it was an auth error from our log in the API
                if (response.status === 401 || data.error?.includes('auth')) {
                    throw new Error('El servidor de archivos está temporalmente inaccesible. Intenta más tarde.');
                }
                throw new Error(data.error || 'Error al procesar el archivo');
            }

            const certificateUrl = data.webViewLink || data.fileId;

            // Update Firestore
            const userRef = doc(firestore, 'users', userProfile.id);
            await updateDoc(userRef, {
                studentCertificateUrl: certificateUrl,
                studentStatus: 'submitted'
            });

            toast({
                title: '¡CERTIFICADO ENVIADO!',
                description: 'Lo revisaremos en las próximas 24-48hs hábiles.',
                variant: 'default',
            });

            setFile(null);
            if (onUploadSuccess) onUploadSuccess();
            
            // Wait a sec before reload to show success
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error: any) {
            console.error('Upload process failed:', error);
            toast({
                variant: 'destructive',
                title: 'ERROR EN EL ENVÍO',
                description: error.message || 'Ocurrió un error inesperado al conectar con el servidor.',
            });
        } finally {
            setIsUploading(false);
        }
    };


    // Calculate remaining time (crude version)
    const deadline = userProfile.certificateDeadline?.toDate?.() || new Date(userProfile.certificateDeadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return (
        <Card className="glass glass-dark shadow-premium border-primary/20 rounded-[2rem] overflow-hidden mb-8 border-2">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
            <CardHeader className="relative z-10 pb-2">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/20 rounded-xl">
                        <ShieldAlert className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-black tracking-tight uppercase tracking-[0.1em]">Verificación Requerida</CardTitle>
                </div>
                <CardDescription className="font-bold text-foreground italic">
                    Para mantener tu acceso al portal de beneficios, necesitamos tu certificado de alumno regular.
                </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 space-y-6 pt-4">
                {daysLeft > 0 ? (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                            <Clock className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-wider text-amber-600">Periodo de Gracia</p>
                            <p className="text-xs font-bold text-amber-600/70">Te quedan <span className="text-amber-600">{daysLeft} días</span> para subir el certificado antes de perder el acceso.</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-wider text-destructive">Periodo Vencido</p>
                            <p className="text-xs font-bold text-destructive/70">Tu acceso a beneficios podría verse limitado hasta que subas el certificado.</p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div 
                        className={cn(
                            "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl transition-all cursor-pointer relative group",
                            file ? "border-primary/40 bg-primary/5" : "border-foreground/40 hover:border-primary/20 hover:bg-primary/5"
                        )}
                    >
                        <input 
                            type="file" 
                            accept=".pdf,image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className={cn(
                                "p-4 rounded-2xl transition-transform duration-500 group-hover:scale-110",
                                file ? "bg-primary text-white" : "bg-primary/10 text-primary"
                            )}>
                                <FileUp className="h-8 w-8" />
                            </div>
                            <div className="max-w-[200px] w-full px-2">
                                <p className="font-black uppercase tracking-widest text-xs truncate text-center">
                                    {file ? file.name : "Seleccionar Archivo"}
                                </p>
                                <p className="text-[10px] font-bold text-foreground/60 mt-1 uppercase tracking-tighter">PDF o Imagen (Máx 5MB)</p>
                            </div>
                        </div>
                    </div>

                    <Button 
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className="w-full h-14 rounded-2xl font-black text-base shadow-xl active:scale-[0.98] transition-all"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                SUBIENDO...
                            </>
                        ) : (
                            <>
                                <FileUp className="mr-2 h-5 w-5" />
                                ENVIAR CERTIFICADO
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

