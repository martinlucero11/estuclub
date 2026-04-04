'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, Plus, Check, Loader2 } from 'lucide-react';

interface DualImageFieldProps {
    label?: string;
    value: string;
    onChange: (url: string) => void;
    folder?: string;
}

export function DualImageField({ label, value, onChange, folder = 'general' }: DualImageFieldProps) {
    const { user } = useUser();
    const { toast } = useToast();
    const [uploadMethod, setUploadMethod] = useState<'upload' | 'link'>('link');
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        try {
            const idToken = await user?.getIdToken();
            const res = await fetch('/api/upload-drive', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${idToken}` },
                body: formData
            });

            const result = await res.json();
            if (result.success && result.contentLink) {
                onChange(result.contentLink);
                toast({ title: "✅ IMAGEN SUBIDA", description: "El archivo se guardó correctamente." });
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (err: any) {
            console.error(err);
            toast({ title: "Error de subida", description: err.message, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {label && <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</Label>}
            
            <Tabs value={uploadMethod} onValueChange={(v: any) => setUploadMethod(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-white/5 rounded-xl border border-white/5">
                    <TabsTrigger value="link" className="text-[9px] font-black uppercase tracking-widest">Enlace Externo</TabsTrigger>
                    <TabsTrigger value="upload" className="text-[9px] font-black uppercase tracking-widest">Subir Archivo</TabsTrigger>
                </TabsList>
                
                <TabsContent value="link" className="pt-4 space-y-4">
                    <div className="flex gap-3 items-center">
                        <div className="h-16 w-16 rounded-2xl bg-background flex-shrink-0 border border-white/10 overflow-hidden relative glass shadow-inner">
                            {value ? (
                                <img src={value} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <ImageIcon className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                            )}
                        </div>
                        <Input 
                            type="url" 
                            placeholder="https://ejemplo.com/foto.jpg"
                            className="rounded-xl bg-background/50 border-white/10 h-12"
                            value={value} 
                            onChange={e => onChange(e.target.value)}
                        />
                    </div>
                </TabsContent>
                
                <TabsContent value="upload" className="pt-4">
                    <div 
                        className={cn(
                            "relative group h-32 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer glass-2 overflow-hidden",
                            isUploading ? "border-primary animate-pulse" : "border-white/10 hover:border-primary/50"
                        )}
                        onClick={() => document.getElementById(`file-upload-${label?.replace(/\s+/g, '-').toLowerCase()}`)?.click()}
                    >
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-primary">Sincronizando con la nube...</span>
                            </div>
                        ) : value ? (
                            <div className="absolute inset-0">
                                <img src={value} alt="Uploaded" className="w-full h-full object-cover opacity-40" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                                    <Check className="h-6 w-6 text-green-500 mb-1" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Imagen Capturada</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,0,127,0.2)]">
                                    <Plus className="h-5 w-5" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Seleccionar Archivo</span>
                                <div className="absolute inset-0 border-2 border-primary/20 animate-pulse rounded-2xl pointer-events-none" />
                            </>
                        )}
                        <input 
                            id={`file-upload-${label?.replace(/\s+/g, '-').toLowerCase()}`}
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
