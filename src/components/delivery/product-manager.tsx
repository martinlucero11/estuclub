'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Package, Search, MoreVertical, Check, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/hooks/use-products';
import { Product, Category, SupplierProfile } from '@/types/data';
import { useFirestore, useCollectionOnce, useDoc } from '@/firebase';
import { doc, setDoc, deleteDoc, serverTimestamp, updateDoc, collection, query, where } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MenuSectionManager } from './menu-section-manager';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ProductManagerProps {
    supplierId: string;
}

export function ProductManager({ supplierId }: ProductManagerProps) {
    const { data: products, isLoading } = useProducts(supplierId, false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Partial<Product> | null>(null);
    const firestore = useFirestore();
    const { toast } = useToast();
    const { data: supplierProfile } = useDoc<SupplierProfile>(supplierId ? doc(firestore, 'roles_supplier', supplierId) : null);
    
    const menuSections = useMemo(() => {
        return supplierProfile?.menuSections || [];
    }, [supplierProfile]);

    // Fetch categories from Firestore to match the home carrusel
    const categoriesQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'categories').withConverter(createConverter<Category>()),
            where('type', '==', 'delivery')
        );
    }, [firestore]);
    const { data: dbCategories } = useCollectionOnce(categoriesQuery);
    const deliveryCategories = useMemo(() => {
        if (!dbCategories) return [];
        return dbCategories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(c => c.name);
    }, [dbCategories]);

    const filteredProducts = products?.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Saving product. Supplier ID:", supplierId);
        console.log("Selected Product:", selectedProduct);

        if (!firestore || !selectedProduct?.name || !selectedProduct?.price) {
            console.error("Missing required fields or firestore:", { firestore, name: selectedProduct?.name, price: selectedProduct?.price });
            return;
        }
        
        if (!supplierId || typeof supplierId !== 'string') {
            console.error("Supplier ID is invalid:", supplierId);
            toast({ 
                title: "Error de configuración", 
                description: "No se encontró el ID del proveedor. Reintenta en unos segundos.",
                variant: "destructive" 
            });
            return;
        }

        try {
            const productRef = selectedProduct.id 
                ? doc(firestore, 'products', selectedProduct.id)
                : doc(collection(firestore, 'products'));

            const productData = {
                ...selectedProduct,
                id: productRef.id,
                supplierId: supplierId,
                category: selectedProduct.category || '',
                menuSection: selectedProduct.menuSection || '',
                imageUrl: selectedProduct.imageUrl || '',
                isActive: selectedProduct.isActive ?? true,
                stockAvailable: selectedProduct.stockAvailable ?? true,
                createdAt: selectedProduct.id ? selectedProduct.createdAt : serverTimestamp(),
            };

            await setDoc(productRef, productData, { merge: true });
            setIsEditing(false);
            setSelectedProduct(null);
            toast({ title: selectedProduct.id ? "Producto actualizado" : "Producto creado" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error al guardar el producto", variant: "destructive" });
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!firestore || !confirm('¿Estás seguro de eliminar este producto?')) return;
        try {
            await deleteDoc(doc(firestore, 'products', id));
            toast({ title: "Producto eliminado" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error al eliminar el producto", variant: "destructive" });
        }
    };

    const toggleStatus = async (product: Product, field: 'isActive' | 'stockAvailable') => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'products', product.id), {
                [field]: !product[field]
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Tabs defaultValue="inventory" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mx-auto max-w-md mb-8 h-14 p-1.5 glass glass-dark shadow-premium rounded-2xl">
                <TabsTrigger value="inventory" className="font-extrabold rounded-xl data-[state=active]:shadow-lg">
                    Inventario
                </TabsTrigger>
                <TabsTrigger value="menu" className="font-extrabold rounded-xl data-[state=active]:shadow-lg">
                    Organizar Menú
                </TabsTrigger>
            </TabsList>
            
            <TabsContent value="inventory" className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar productos..." 
                        className="pl-9 h-11 rounded-2xl bg-background/50 border-white/10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogTrigger asChild>
                        <Button 
                            className="rounded-2xl h-11 px-6 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                            onClick={() => setSelectedProduct({ isActive: true, stockAvailable: true, imageUrl: '', category: '', menuSection: '' })}
                        >
                            <Plus className="h-4 w-4 mr-2" /> Nuevo Producto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-white/10 glass glass-dark">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black tracking-tighter">
                                {selectedProduct?.id ? 'Editar Producto' : 'Añadir Producto'}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSaveProduct} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="imageUrl" className="text-[10px] font-black uppercase tracking-widest opacity-70">URL de la Foto</Label>
                                <div className="flex gap-3 items-center">
                                    <div className="h-16 w-16 rounded-2xl bg-muted flex-shrink-0 border border-white/10 overflow-hidden relative">
                                        {selectedProduct?.imageUrl ? (
                                            <img src={selectedProduct.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                                        ) : (
                                            <ImageIcon className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                                        )}
                                    </div>
                                    <Input 
                                        id="imageUrl" 
                                        type="url" 
                                        placeholder="https://ejemplo.com/foto.jpg"
                                        className="rounded-xl bg-background/50 border-white/10"
                                        value={selectedProduct?.imageUrl || ''} 
                                        onChange={e => setSelectedProduct({...selectedProduct, imageUrl: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest opacity-70">Nombre</Label>
                                <Input 
                                    id="name" 
                                    required 
                                    className="rounded-xl bg-background/50 border-white/10"
                                    value={selectedProduct?.name || ''} 
                                    onChange={e => setSelectedProduct({...selectedProduct, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest opacity-70">Descripción</Label>
                                <Textarea 
                                    id="description" 
                                    className="rounded-xl bg-background/50 border-white/10 min-h-[80px]"
                                    value={selectedProduct?.description || ''} 
                                    onChange={e => setSelectedProduct({...selectedProduct, description: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest opacity-70">Precio Oferta</Label>
                                    <Input 
                                        id="price" 
                                        type="number" 
                                        required 
                                        className="rounded-xl bg-background/50 border-white/10 font-bold"
                                        value={selectedProduct?.price || ''} 
                                        onChange={e => setSelectedProduct({...selectedProduct, price: parseFloat(e.target.value)})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="originalPrice" className="text-[10px] font-black uppercase tracking-widest opacity-70">Precio Original</Label>
                                    <Input 
                                        id="originalPrice" 
                                        type="number" 
                                        placeholder="Sin descuento"
                                        className="rounded-xl bg-background/50 border-white/10 text-muted-foreground"
                                        value={selectedProduct?.originalPrice || ''} 
                                        onChange={e => setSelectedProduct({...selectedProduct, originalPrice: e.target.value ? parseFloat(e.target.value) : undefined})}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest opacity-70">Categoría</Label>
                                    <Select 
                                        value={selectedProduct?.category || ''} 
                                        onValueChange={v => setSelectedProduct({...selectedProduct, category: v})}
                                    >
                                        <SelectTrigger id="category" className="rounded-xl bg-background/50 border-white/10 h-10">
                                            <SelectValue placeholder="Seleccionar categoría global" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {deliveryCategories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 flex flex-col justify-end">
                                    <Label htmlFor="menuSection" className="text-[10px] font-black uppercase tracking-widest opacity-70">Sección del Menú</Label>
                                    <Select 
                                        value={selectedProduct?.menuSection || ''} 
                                        onValueChange={v => setSelectedProduct({...selectedProduct, menuSection: v})}
                                    >
                                        <SelectTrigger id="menuSection" className="rounded-xl bg-background/50 border-white/10 h-10">
                                            <SelectValue placeholder="Ninguna" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {menuSections.map(section => (
                                                <SelectItem key={section} value={section}>{section}</SelectItem>
                                            ))}
                                            <SelectItem value="none">Sin asignación (Otros)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 flex flex-col justify-end">
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                        <Label htmlFor="isActive" className="text-[8px] font-black uppercase tracking-widest opacity-70">Visible</Label>
                                        <Switch 
                                            id="isActive" 
                                            checked={selectedProduct?.isActive} 
                                            onCheckedChange={v => setSelectedProduct({...selectedProduct, isActive: v})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="submit" className="w-full rounded-2xl h-12 font-black uppercase tracking-widest text-xs">
                                    Guardar Producto
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-48 w-full rounded-[2rem]" />)}
                </div>
            ) : filteredProducts?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/5">
                    <Package className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">No se encontraron productos</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts?.map(product => (
                        <div 
                            key={product.id} 
                            className="group relative bg-card/40 backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-6 transition-all hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 flex flex-col h-full"
                        >
                            <div className="flex gap-4 items-start mb-6">
                                <div className="h-20 w-20 rounded-[1.5rem] bg-muted flex-shrink-0 border border-white/10 overflow-hidden relative shadow-inner">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                    ) : (
                                        <ImageIcon className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col flex-1 min-w-0">
                                            {product.category && (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1 truncate">{product.category}</span>
                                            )}
                                            <h4 className="font-black text-lg leading-tight tracking-tighter group-hover:text-primary transition-colors line-clamp-2">{product.name}</h4>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 rounded-xl border border-white/5 hover:bg-white/10">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-2xl border-white/10 glass glass-dark">
                                                <DropdownMenuItem 
                                                    className="rounded-xl font-bold"
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setIsEditing(true);
                                                    }}
                                                >
                                                    <Edit2 className="h-4 w-4 mr-2" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="rounded-xl font-bold text-destructive focus:text-destructive focus:bg-destructive/10"
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    {product.originalPrice && product.originalPrice > product.price && (
                                        <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20">
                                            <Check className="h-3 w-3" />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Oferta Activa</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <p className="text-xs text-muted-foreground font-medium italic line-clamp-2 mb-6 opacity-70">{product.description || 'Sin descripción'}</p>
                            
                            <div className="mt-auto flex items-end justify-between">
                                <div className="space-y-1">
                                    {product.originalPrice && product.originalPrice > product.price && (
                                        <p className="text-[10px] text-muted-foreground line-through decoration-primary/40 font-bold tracking-widest">$ {product.originalPrice.toLocaleString()}</p>
                                    )}
                                    <p className="text-2xl font-black text-primary tracking-tighter">$ {product.price.toLocaleString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className={cn(
                                            "h-10 w-10 rounded-2xl border-white/10 transition-all",
                                            product.isActive ? "bg-green-500/10 text-green-500 border-green-500/20" : "opacity-30"
                                        )}
                                        onClick={() => toggleStatus(product, 'isActive')}
                                        title={product.isActive ? "Visible" : "Oculto"}
                                    >
                                        {product.isActive ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className={cn(
                                            "h-10 w-10 rounded-2xl border-white/10 transition-all",
                                            product.stockAvailable ? "bg-primary/10 text-primary border-primary/20" : "bg-destructive/10 text-destructive border-destructive/20"
                                        )}
                                        onClick={() => toggleStatus(product, 'stockAvailable')}
                                        title={product.stockAvailable ? "En stock" : "Sin stock"}
                                    >
                                        <Package className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            </TabsContent>

            <TabsContent value="menu" className="animate-in fade-in duration-500">
                <MenuSectionManager supplierId={supplierId} sections={menuSections} products={products || []} />
            </TabsContent>
        </Tabs>
    );
}
