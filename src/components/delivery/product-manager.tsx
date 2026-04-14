'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Trash2, Package, Search, MoreVertical, Check, X, ImageIcon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/hooks/use-products';
import { Product, Category, SupplierProfile } from '@/types/data';
import { useFirestore, useUser, useCollectionOnce, useDoc } from '@/firebase';
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
    DialogDescription,
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
import { OptimizedImage } from '../common/OptimizedImage';
import { saveProductOperation, deleteProductAction, toggleProductStatusAction } from '@/lib/actions/product-actions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductManagerProps {
    supplierId: string;
}

export function ProductManager({ supplierId: initialSupplierId }: ProductManagerProps) {
    const { userData, user, roles } = useUser();
    
    // Force reactive ID capture: Prop -> User Context -> Nothing
    const supplierId = initialSupplierId || userData?.uid || user?.uid;
    
    const { data: products, isLoading } = useProducts(supplierId || '', false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Partial<Product> | null>(null);
    const [uploadMethod, setUploadMethod] = useState<'upload' | 'link'>('link');
    const [isUploading, setIsUploading] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const firestore = useFirestore();
    const router = useRouter();
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
        
        if (!supplierId) {
            toast({ title: "Error", description: "No se encontró el ID del proveedor.", variant: "destructive" });
            return;
        }

        startTransition(async () => {
            const productData = {
                ...selectedProduct,
                supplierId: supplierId,
                category: selectedProduct?.category || '',
                menuSection: selectedProduct?.menuSection || '',
                imageUrl: selectedProduct?.imageUrl || '',
                isActive: selectedProduct?.isActive ?? true,
                stockAvailable: selectedProduct?.stockAvailable ?? true,
            };

            const result = await saveProductOperation(productData);

            if (result.success) {
                toast({ title: selectedProduct?.id ? "Producto actualizado" : "Producto creado" });
                setIsEditing(false);
                setSelectedProduct(null);
                router.refresh();
            } else {
                toast({ title: "Error al guardar", description: result.error, variant: "destructive" });
            }
        });
    };

    const handleDeleteProduct = () => {
        if (!productToDelete) return;
        startTransition(async () => {
             const result = await deleteProductAction(productToDelete);
             if (result.success) {
                 toast({ title: "✅ PRODUCTO ELIMINADO" });
                 router.refresh();
             } else {
                 toast({ title: "Error", description: result.error, variant: "destructive" });
             }
             setProductToDelete(null);
        });
    };

    const toggleStatus = (product: Product, field: 'isActive' | 'stockAvailable') => {
        const newValue = !product[field];
        startTransition(async () => {
            const result = await toggleProductStatusAction(product.id, field, newValue);
            if (result.success) {
                toast({ 
                    title: newValue ? "Activado" : "Desactivado", 
                    description: `${product.name} actualizado.` 
                });
                router.refresh();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    };

    return (
        <Tabs defaultValue="inventory" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mx-auto max-w-sm mb-8 h-12 p-1.5 bg-black/5 rounded-2xl border border-black/5 shadow-sm">
                <TabsTrigger value="inventory" className="font-black rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg text-[10px] uppercase tracking-widest">
                    Inventario
                </TabsTrigger>
                <TabsTrigger value="menu" className="font-black rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg text-[10px] uppercase tracking-widest">
                    Organizar Menú
                </TabsTrigger>
            </TabsList>
            
            <TabsContent value="inventory" className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
                    <Input 
                        placeholder="Buscar productos..." 
                        className="pl-9 h-11 rounded-2xl bg-white border border-black/5 shadow-sm focus-visible:ring-primary/20"
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
                    <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-black/5 bg-white shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black tracking-tighter">
                                {selectedProduct?.id ? 'Editar Producto' : 'Añadir Producto'}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Formulario para gestionar productos del menú de delivery.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSaveProduct} className="space-y-4 pt-4">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Imagen del Producto</Label>
                                
                                <Tabs value={uploadMethod} onValueChange={(v: any) => setUploadMethod(v)} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-black/5 rounded-xl border border-black/5">
                                        <TabsTrigger value="link" className="text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Enlace Externo</TabsTrigger>
                                        <TabsTrigger value="upload" className="text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Subir Archivo</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="link" className="pt-4 space-y-4">
                                        <div className="flex gap-3 items-center">
                                            <div className="h-16 w-16 rounded-2xl bg-black/5 flex-shrink-0 border border-black/5 overflow-hidden relative shadow-inner">
                                                {selectedProduct?.imageUrl ? (
                                                    <OptimizedImage src={selectedProduct.imageUrl} alt="Preview" fill />
                                                ) : (
                                                    <ImageIcon className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                                                )}
                                            </div>
                                            <Input 
                                                id="imageUrl" 
                                                type="url" 
                                                placeholder="https://ejemplo.com/foto.jpg"
                                                className="rounded-xl bg-white border border-black/5 shadow-sm"
                                                value={selectedProduct?.imageUrl || ''} 
                                                onChange={e => setSelectedProduct({...selectedProduct, imageUrl: e.target.value})}
                                            />
                                        </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="upload" className="pt-4">
                                        <div 
                                            className={cn(
                                                "relative group h-32 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer bg-black/[0.02] overflow-hidden",
                                                isUploading ? "border-primary animate-pulse" : "border-black/10 hover:border-primary/50"
                                            )}
                                            onClick={() => document.getElementById('product-file-upload')?.click()}
                                        >
                                            {isUploading ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-primary">Subiendo a la nube...</span>
                                                </div>
                                            ) : selectedProduct?.imageUrl ? (
                                                <div className="absolute inset-0">
                                                    <OptimizedImage src={selectedProduct.imageUrl} alt="Uploaded" fill className="opacity-40" />
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                                                        <Check className="h-6 w-6 text-green-500 mb-1" />
                                                        <span className="text-[8px] font-black uppercase tracking-widest">Imagen Capturada</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,0,127,0.1)]">
                                                        <Plus className="h-5 w-5" />
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-black/40">Seleccionar Archivo</span>
                                                    <div className="absolute inset-0 border-2 border-primary/10 animate-pulse rounded-2xl pointer-events-none" />
                                                </>
                                            )}
                                            <input 
                                                id="product-file-upload" 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    
                                                    setIsUploading(true);
                                                    const formData = new FormData();
                                                    formData.append('file', file);
                                                    formData.append('folder', 'cluber');
                                                    formData.append('subfolder', 'productos');

                                                    try {
                                                        const idToken = await user?.getIdToken();
                                                        const res = await fetch('/api/upload-drive', {
                                                            method: 'POST',
                                                            headers: { 'Authorization': `Bearer ${idToken}` },
                                                            body: formData
                                                        });
                                                        
                                                        const result = await res.json();
                                                        if (result.success && result.contentLink) {
                                                            setSelectedProduct({ ...selectedProduct, imageUrl: result.contentLink });
                                                            toast({ title: "✅ IMAGEN SUBIDA", description: "El archivo se guardó en Google Drive." });
                                                        } else {
                                                            throw new Error(result.error || 'Fallo en la subida');
                                                        }
                                                    } catch (err: any) {
                                                        console.error(err);
                                                        toast({ title: "Error de subida", description: err.message, variant: "destructive" });
                                                    } finally {
                                                        setIsUploading(false);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest opacity-70">Nombre</Label>
                                <Input 
                                    id="name" 
                                    required 
                                    className="rounded-xl bg-white border border-black/5 shadow-sm"
                                    value={selectedProduct?.name || ''} 
                                    onChange={e => setSelectedProduct({...selectedProduct, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest opacity-70">Descripción</Label>
                                <Textarea 
                                    id="description" 
                                    className="rounded-xl bg-white border border-black/5 shadow-sm min-h-[80px]"
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
                                        className="rounded-xl bg-white border border-black/5 shadow-sm font-black text-primary"
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
                                        className="rounded-xl bg-white border border-black/5 shadow-sm text-black/40"
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
                                        <SelectTrigger id="category" className="rounded-xl bg-white border border-black/5 shadow-sm h-11">
                                            <SelectValue placeholder="Categoría global" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-black/5">
                                            {deliveryCategories.map(cat => (
                                                <SelectItem key={cat} value={cat} className="rounded-xl font-bold py-2.5">{cat}</SelectItem>
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
                                        <SelectTrigger id="menuSection" className="rounded-xl bg-white border border-black/5 shadow-sm h-11">
                                            <SelectValue placeholder="Ninguna" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-black/5">
                                            {menuSections.map(section => (
                                                <SelectItem key={section} value={section} className="rounded-xl font-bold py-2.5">{section}</SelectItem>
                                            ))}
                                            <SelectItem value="none" className="rounded-xl font-bold py-2.5 italic">Sin asignación (Otros)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 flex flex-col justify-end">
                                    <div className="flex items-center justify-between p-3.5 bg-black/[0.02] rounded-2xl border border-black/5 shadow-inner">
                                        <Label htmlFor="isActive" className="text-[10px] font-black uppercase tracking-widest opacity-60">Producto Visible</Label>
                                        <Switch 
                                            id="isActive" 
                                            checked={selectedProduct?.isActive} 
                                            onCheckedChange={v => setSelectedProduct({...selectedProduct, isActive: v})}
                                            className="data-[state=checked]:bg-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="pt-4">
                                <Button 
                                    type="submit" 
                                    disabled={isUploading || isPending}
                                    className="w-full rounded-2xl h-12 font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(255,0,127,0.3)]"
                                >
                                    {(isUploading || isPending) ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Procesando...
                                        </>
                                    ) : 'Guardar Producto'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-64 w-full rounded-[2.5rem]" />)}
                </div>
            ) : filteredProducts?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center text-black/20 border-2 border-dashed border-black/5 rounded-[3rem] bg-black/[0.02] shadow-inner">
                    <Package className="h-16 w-16 mb-6 opacity-20" />
                    <p className="font-black uppercase tracking-widest text-[11px] italic">No hay productos que coincidan</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProducts?.map(product => (
                        <div 
                            key={product.id} 
                            className="group relative bg-white border border-black/5 rounded-[3rem] p-7 transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-2 flex flex-col h-full shadow-lg"
                        >
                            <div className="flex gap-5 items-start mb-6">
                                <div className="h-24 w-24 rounded-[2rem] bg-black/5 flex-shrink-0 border border-black/5 overflow-hidden relative shadow-inner">
                                    {product.imageUrl ? (
                                        <OptimizedImage src={product.imageUrl} alt={product.name} fill className="transition-transform group-hover:scale-110 duration-700" />
                                    ) : (
                                        <ImageIcon className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col flex-1 min-w-0">
                                            {product.menuSection && product.menuSection !== 'none' && (
                                                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-primary/60 mb-1 truncate bg-primary/5 w-fit px-2 py-0.5 rounded-lg">{product.menuSection}</span>
                                            )}
                                            <h4 className="font-black text-xl leading-tight tracking-tighter text-black group-hover:text-primary transition-colors line-clamp-2">{product.name}</h4>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 -mt-1 -mr-2 rounded-2xl border border-black/5 hover:bg-black/5">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-2xl border-black/5 bg-white shadow-2xl p-2 w-40">
                                                <DropdownMenuItem 
                                                    className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3 focus:bg-primary/10 focus:text-primary cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setIsEditing(true);
                                                    }}
                                                >
                                                    <Edit2 className="h-4 w-4 mr-2" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="rounded-xl font-black text-[10px] uppercase tracking-widest py-3 text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                                    onClick={() => setProductToDelete(product.id)}
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

                                    {/* Phantom / Ghost Product Logic */}
                                    {(() => {
                                        const views = product.viewsCount || 0;
                                        const sales = product.salesCount || 0;
                                        const conversion = views > 0 ? (sales / views) : 0;
                                        
                                        if (views >= 10 && conversion < 0.05) {
                                            return (
                                                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/30 animate-pulse">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">⚠️ Optimizar Conversión</span>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>
                            
                            <p className="text-sm text-black/50 font-bold italic line-clamp-2 mb-8 px-1">{product.description || 'Sin descripción'}</p>
                            
                            <div className="mt-auto flex items-end justify-between px-1">
                                <div className="space-y-1">
                                    {product.originalPrice && product.originalPrice > product.price && (
                                        <p className="text-[11px] text-black/30 line-through decoration-primary/40 font-bold tracking-widest italic">$ {product.originalPrice.toLocaleString()}</p>
                                    )}
                                    <p className="text-3xl font-black text-black tracking-tighter italic">$ {product.price.toLocaleString()}</p>
                                </div>
                                <div className="flex gap-2.5">
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className={cn(
                                            "h-12 w-12 rounded-[1.2rem] border-black/5 transition-all shadow-md hover:scale-110",
                                            product.isActive ? "bg-emerald-50 text-emerald-500 border-emerald-200" : "bg-black/5 text-black/20 opacity-50"
                                        )}
                                        disabled={isPending}
                                        onClick={() => toggleStatus(product, 'isActive')}
                                        title={product.isActive ? "Visible" : "Oculto"}
                                    >
                                        {product.isActive ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        disabled={isPending}
                                        className={cn(
                                            "h-12 w-12 rounded-[1.2rem] border-black/5 transition-all shadow-md hover:scale-110",
                                            product.stockAvailable ? "bg-primary/5 text-primary border-primary/20" : "bg-red-50 text-red-500 border-red-200"
                                        )}
                                        onClick={() => toggleStatus(product, 'stockAvailable')}
                                        title={product.stockAvailable ? "En stock" : "Sin stock"}
                                    >
                                        <Package className="h-5 w-5" />
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

            <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black tracking-tighter uppercase italic">¿Confirmar Eliminación?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-bold text-black/60">
                            Esta acción es irreversible. El producto desaparecerá del menú de los clientes inmediatamente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] border-black/5 bg-black/5 hover:bg-black/10 transition-all">Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteProduct}
                            className="rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                        >
                            Eliminar Producto
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Tabs>
    );
}

