'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, CheckCircle2, X, AlertCircle, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { useAuthService } from '@/firebase';

interface DeliveryPhotoCaptureProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (url: string) => void;
    orderId: string;
}

export function DeliveryPhotoCapture({ isOpen, onClose, onSuccess, orderId }: DeliveryPhotoCaptureProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const auth = useAuthService();

    const compressImage = async (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error('Failed to get canvas context'));
                    
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) resolve(blob);
                            else reject(new Error('Canvas conversion failed'));
                        },
                        'image/jpeg',
                        0.6 // Quality 0.6 as requested
                    );
                };
            };
            reader.onerror = (e) => reject(e);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setIsUploading(true);
        haptic.vibrateMedium();

        try {
            // 1. Client-Side Compression
            const compressedBlob = await compressImage(file);
            
            // Create preview for UI
            const previewUrl = URL.createObjectURL(compressedBlob);
            setPreview(previewUrl);

            // 2. Get Auth Token
            const user = auth.currentUser;
            if (!user) throw new Error('Usuario no autenticado');
            const token = await user.getIdToken();

            // 3. Upload to Google Drive
            const formData = new FormData();
            formData.append('file', compressedBlob, `delivery_${orderId}.jpg`);
            formData.append('folder', 'deliveries');

            const response = await fetch('/api/upload-drive', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al subir la imagen');
            }

            const data = await response.json();
            
            haptic.vibrateSuccess();
            setTimeout(() => {
                onSuccess(data.url);
                setPreview(null);
                setIsUploading(false);
            }, 800);

        } catch (err: any) {
            console.error('Upload Error:', err);
            setError(err.message || 'Error al procesar la foto');
            setIsUploading(false);
            haptic.vibrateError();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-md p-6"
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="w-full max-w-md bg-white rounded-[3rem] p-8 pb-12 shadow-2xl relative overflow-hidden"
                    >
                        {/* Status Overlay */}
                        {isUploading && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center space-y-4">
                                <Loader2 className="h-12 w-12 text-[#cb465a] animate-spin" />
                                <div className="space-y-1">
                                    <p className="text-lg font-black uppercase italic tracking-tighter text-zinc-900">Procesando Evidencia</p>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Comprimiendo y subiendo a la nube...</p>
                                </div>
                            </div>
                        )}

                        {preview && !isUploading && (
                            <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center p-8 text-center space-y-6">
                                <div className="w-full aspect-[4/3] rounded-[2rem] overflow-hidden border-4 border-[#cb465a]/10">
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-center gap-2 text-emerald-500">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <p className="text-lg font-black uppercase italic tracking-tighter">Imagen Capturada</p>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Evidencia guardada correctamente</p>
                                </div>
                            </div>
                        )}

                        {/* Main UI */}
                        <div className="flex flex-col items-center text-center space-y-6 pb-4">
                            <div className="h-20 w-20 rounded-[2rem] bg-[#cb465a]/10 flex items-center justify-center">
                                <Camera className="h-10 w-10 text-[#cb465a]" />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900 leading-none">Prueba de Entrega</h3>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Capturá una foto del paquete entregado</p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <p className="text-[10px] font-black uppercase">{error}</p>
                                </div>
                            )}

                            <div className="w-full pt-4">
                                <label className="block w-full cursor-pointer group">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        capture="environment" 
                                        className="hidden" 
                                        onChange={handleFileChange}
                                        disabled={isUploading}
                                    />
                                    <div className="w-full h-24 rounded-[2.5rem] bg-[#cb465a] text-white flex flex-col items-center justify-center gap-1 shadow-xl shadow-[#cb465a]/20 group-active:scale-95 transition-all">
                                        <UploadCloud className="h-7 w-7" />
                                        <span className="font-black uppercase tracking-[0.1em] text-sm">Tomar Foto Ahora</span>
                                    </div>
                                </label>
                            </div>

                            <Button 
                                variant="ghost" 
                                onClick={onClose}
                                disabled={isUploading}
                                className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 hover:text-zinc-500"
                            >
                                Cancelar Entrega
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
