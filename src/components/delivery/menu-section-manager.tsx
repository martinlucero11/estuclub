'use client';

import React, { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUp, ArrowDown, Trash2, Plus, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/data';
import { ProductCard } from '@/components/delivery/product-card';
import { Badge } from '@/components/ui/badge';

interface MenuSectionManagerProps {
    supplierId: string;
    sections: string[];
    products: Product[];
}

export function MenuSectionManager({ supplierId, sections, products }: MenuSectionManagerProps) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [newSection, setNewSection] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveSections = async (updatedSections: string[]) => {
        if (!firestore) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(firestore, 'roles_supplier', supplierId), {
                menuSections: updatedSections
            });
            toast({ title: 'Secciones actualizadas' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error al actualizar', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddSection = () => {
        if (!newSection.trim() || sections.includes(newSection.trim())) return;
        handleSaveSections([...sections, newSection.trim()]);
        setNewSection('');
    };

    const handleRemoveSection = (sectionToRemove: string) => {
        if (!confirm(`¿Estás seguro de eliminar la sección "${sectionToRemove}"? Los productos volverán a quedar sin sección.`)) {
            return;
        }
        // Wait, we also need to wipe out the menuSection from products that use it.
        // For simplicity, if a product refers to a section that doesn't exist, it falls back to "Sueltos",
        // so we only need to remove it from the array!
        handleSaveSections(sections.filter(s => s !== sectionToRemove));
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newArr = [...sections];
        [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
        handleSaveSections(newArr);
    };

    const handleMoveDown = (index: number) => {
        if (index === sections.length - 1) return;
        const newArr = [...sections];
        [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
        handleSaveSections(newArr);
    };

    const unassignedProducts = products.filter(p => !p.menuSection || !sections.includes(p.menuSection));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="p-6 rounded-[2rem] bg-card border border-white/5 space-y-6">
                <div className="space-y-2">
                    <h2 className="text-xl font-black tracking-tighter">Gestionar Secciones del Menú</h2>
                    <p className="text-sm text-muted-foreground font-medium">
                        Crea categorías personalizadas para agrupar tus productos (ej. Hamburguesas, Bebidas).
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <Input 
                        placeholder="Ej: Plato Principal" 
                        value={newSection} 
                        onChange={(e) => setNewSection(e.target.value)}
                        className="rounded-xl h-12 bg-background/50 border-white/10"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                    />
                    <Button 
                        onClick={handleAddSection} 
                        disabled={isSaving || !newSection.trim()}
                        className="h-12 rounded-xl px-6 font-black uppercase tracking-widest text-[10px]"
                    >
                        <Plus className="h-4 w-4 mr-2" /> Añadir
                    </Button>
                </div>

                <div className="space-y-3 pt-4">
                    {sections.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground italic text-sm">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            Aún no has creado ninguna sección personalizada.
                        </div>
                    ) : (
                        sections.map((section, index) => {
                            const sectionProducts = products.filter(p => p.menuSection === section);
                            return (
                                <div key={section} className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <h3 className="font-bold">{section}</h3>
                                        <Badge variant="secondary" className="rounded-full text-[10px] uppercase font-black tracking-widest">
                                            {sectionProducts.length} productos
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled={index === 0} onClick={() => handleMoveUp(index)}>
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled={index === sections.length - 1} onClick={() => handleMoveDown(index)}>
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleRemoveSection(section)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="pt-8 space-y-12">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">Vista Previa del Menú</h2>
                    <Badge className="bg-primary/20 text-primary border-primary/30">Cómo lo ve el cliente</Badge>
                </div>

                {sections.map(section => {
                    const sectionProducts = products.filter(p => p.menuSection === section);
                    if (sectionProducts.length === 0) return null;
                    
                    return (
                        <div key={section} className="space-y-6">
                            <h3 className="text-xl font-black uppercase tracking-[0.2em] text-primary/80 border-b border-white/5 pb-2">
                                {section}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {sectionProducts.map(product => (
                                    <ProductCard key={product.id} product={product} onAdd={() => {}} previewMode />
                                ))}
                            </div>
                        </div>
                    );
                })}

                {unassignedProducts.length > 0 && (
                    <div className="space-y-6">
                        <h3 className="text-xl font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-white/5 pb-2">
                            {sections.length > 0 ? "Más Productos" : "Productos"}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {unassignedProducts.map(product => (
                                <ProductCard key={product.id} product={product} onAdd={() => {}} previewMode />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
