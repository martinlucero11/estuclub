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
        <div className="space-y-12 animate-in fade-in duration-700">
            <div className="p-8 rounded-[3rem] bg-white border border-black/5 space-y-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                    <Plus className="h-24 w-24" />
                </div>
                <div className="space-y-3 relative">
                    <h2 className="text-2xl font-black tracking-tighter text-black italic">Gestionar Menú</h2>
                    <p className="text-[11px] text-black/40 font-bold uppercase tracking-widest leading-relaxed max-w-sm">
                        Crea categorías personalizadas para agrupar tus productos y mejorar la experiencia de tus clientes.
                    </p>
                </div>
                
                <div className="flex gap-4 relative">
                    <Input 
                        placeholder="Ej: Hamburguesas Especiales" 
                        value={newSection} 
                        onChange={(e) => setNewSection(e.target.value)}
                        className="rounded-2xl h-14 bg-black/[0.02] border-black/5 focus-visible:ring-primary/20 font-bold text-black placeholder:text-black/20 px-6"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                    />
                    <Button 
                        onClick={handleAddSection} 
                        disabled={isSaving || !newSection.trim()}
                        className="h-14 rounded-2xl px-10 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20"
                    >
                        {isSaving ? 'Guardando...' : 'Añadir'}
                    </Button>
                </div>

                <div className="space-y-4 pt-4 relative">
                    {sections.length === 0 ? (
                        <div className="text-center py-12 text-black/20 italic text-sm bg-black/[0.01] rounded-3xl border border-dashed border-black/5">
                            <AlertCircle className="h-10 w-10 mx-auto mb-4 opacity-10" />
                            Aún no has creado secciones personalizadas.
                        </div>
                    ) : (
                        sections.map((section, index) => {
                            const sectionProducts = products.filter(p => p.menuSection === section);
                            return (
                                <div key={section} className="flex items-center justify-between p-5 rounded-[2rem] bg-white border border-black/5 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-5">
                                        <div className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center font-black text-black/20 text-xs">
                                            0{index + 1}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-black tracking-tight">{section}</h3>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">{sectionProducts.length} Productos Asignados</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 translate-x-2 opacity-30 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-black/5" disabled={index === 0} onClick={() => handleMoveUp(index)}>
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-black/5" disabled={index === sections.length - 1} onClick={() => handleMoveDown(index)}>
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                        <div className="w-px h-6 bg-black/5 mx-1" />
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-50" onClick={() => handleRemoveSection(section)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="pt-12 space-y-16">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-black italic italic-border">Vista Previa</h2>
                        <Badge className="bg-primary text-white border-0 font-black px-4 py-1 rounded-full text-[10px] uppercase tracking-widest shadow-lg shadow-primary/30">Cliente en Vivo</Badge>
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/30">Así es como tus clientes verán el menú en la App Estuclub</p>
                </div>

                {sections.map(section => {
                    const sectionProducts = products.filter(p => p.menuSection === section);
                    if (sectionProducts.length === 0) return null;
                    
                    return (
                        <div key={section} className="space-y-8">
                            <h3 className="text-2xl font-black uppercase tracking-[0.1em] text-black border-b-4 border-primary w-fit pb-2 pr-12">
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
                    <div className="space-y-8">
                        <h3 className="text-2xl font-black uppercase tracking-[0.1em] text-black/40 border-b-4 border-black/5 w-fit pb-2 pr-12">
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

