'use client';

import { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Image as ImageIcon, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SupplierProfile } from '@/types/data';

interface AdminSupplierImageModalProps {
    supplier: SupplierProfile;
    children?: React.ReactNode;
}

export function AdminSupplierImageModal({ supplier, children }: AdminSupplierImageModalProps) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const [logoUrl, setLogoUrl] = useState(supplier.logoUrl || '');
    const [coverUrl, setCoverUrl] = useState(supplier.coverUrl || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSave = async () => {
        if (!firestore) return;
        setIsSaving(true);
        try {
            const supplierRef = doc(firestore, 'roles_supplier', supplier.id);
            await updateDoc(supplierRef, { logoUrl, coverUrl });
            toast({ title: 'Imágenes actualizadas', description: 'Las URLs han sido guardadas correctamente.' });
            setIsOpen(false);
        } catch (error) {
            console.error("Error updating images:", error);
            toast({ variant: 'destructive', title: 'Error al actualizar', description: 'Ocurrió un error al guardar las URLs.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span className="text-xs font-semibold">Editar Imágenes</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-primary/20 p-6 rounded-[2rem] gap-8">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-xl font-black">Imágenes: {supplier.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-2">
                    {/* Logo Section */}
                    <div className="space-y-3">
                        <Label className="font-bold text-xs tracking-widest uppercase text-muted-foreground">URL del Logotipo</Label>
                        <div className="flex gap-4 items-center">
                            <Avatar className="h-16 w-16 ring-2 ring-background shadow-md">
                                <AvatarImage src={logoUrl} className="object-cover" />
                                <AvatarFallback className="text-lg font-black">{supplier.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Input 
                                value={logoUrl} 
                                onChange={(e) => setLogoUrl(e.target.value)} 
                                placeholder="https://ejemplo.com/logo.png" 
                                className="flex-1"
                            />
                        </div>
                    </div>

                    {/* Cover Section */}
                    <div className="space-y-3 pt-4 border-t border-border/50">
                        <Label className="font-bold text-xs tracking-widest uppercase text-muted-foreground">URL de la Portada</Label>
                        <div className="space-y-3">
                            <Input 
                                value={coverUrl} 
                                onChange={(e) => setCoverUrl(e.target.value)} 
                                placeholder="https://ejemplo.com/portada.jpg" 
                            />
                            <div className="w-full aspect-[16/10] overflow-hidden rounded-xl border border-primary/10 bg-muted/30 flex items-center justify-center">
                                {coverUrl ? (
                                    <img 
                                        src={coverUrl} 
                                        alt="Vista previa de portada" 
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="text-muted-foreground/50 flex flex-col items-center">
                                        <ImageIcon className="h-6 w-6 mb-1" />
                                        <span className="text-[10px] uppercase font-bold tracking-widest">Sin Portada</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Cambios
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
