'use client';

import * as React from 'react';
import { useFirestore, useCollectionOnce, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import { SupplierProfile } from '@/types/data';
import { Check, ChevronsUpDown, Store, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAdmin } from '@/context/admin-context';
import { motion, AnimatePresence } from 'framer-motion';

export function CommerceSelector() {
    const [open, setOpen] = React.useState(false);
    const firestore = useFirestore();
    const { impersonatedSupplierId, setImpersonatedSupplierId, impersonatedSupplierData } = useAdmin();

    const { data: suppliers } = useCollectionOnce<SupplierProfile>(
        query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()))
    );

    const selectedLabel = impersonatedSupplierData?.name || "Seleccionar Comercio";

    return (
        <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "group h-9 rounded-xl border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all duration-300 gap-2 px-3",
                            impersonatedSupplierId ? "border-primary bg-primary/10 text-primary" : "text-foreground"
                        )}
                    >
                        <Store className={cn("h-4 w-4 transition-transform group-hover:scale-110", impersonatedSupplierId ? "text-primary" : "opacity-40")} />
                        <span className="max-w-[120px] truncate font-black uppercase text-[10px] tracking-widest leading-none">
                            {selectedLabel}
                        </span>
                        <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 glass glass-dark border-primary/20 rounded-2xl overflow-hidden shadow-2xl" align="start">
                    <Command className="bg-transparent">
                        <div className="flex items-center border-b border-white/10 px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <CommandInput placeholder="Buscar comercio..." className="h-12 bg-transparent text-xs font-bold" />
                        </div>
                        <CommandList className="max-h-[300px] scrollbar-premium">
                            <CommandEmpty className="py-6 text-center text-xs font-medium text-foreground italic">
                                No se encontraron comercios.
                            </CommandEmpty>
                            <CommandGroup heading="Comercios Disponibles" className="p-2">
                                <CommandItem
                                    className="rounded-lg text-xs font-bold gap-2 cursor-pointer mb-1"
                                    onSelect={() => {
                                        setImpersonatedSupplierId(null);
                                        setOpen(false);
                                    }}
                                >
                                    <div className="p-1 rounded-md bg-destructive/10 text-destructive">
                                        <X className="h-3 w-3" />
                                    </div>
                                    <span>Limpiar Selección (Ver Propio)</span>
                                    {impersonatedSupplierId === null && <Check className="ml-auto h-3 w-3 text-primary" />}
                                </CommandItem>
                                
                                {suppliers?.map((supplier) => (
                                    <CommandItem
                                        key={supplier.id}
                                        value={supplier.name}
                                        className="rounded-lg text-xs font-bold gap-2 cursor-pointer mb-1"
                                        onSelect={() => {
                                            setImpersonatedSupplierId(supplier.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="w-6 h-6 rounded-md overflow-hidden bg-background flex items-center justify-center border border-white/10">
                                            {supplier.logoUrl ? (
                                                <img src={supplier.logoUrl} alt={supplier.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Store className="h-3 w-3 opacity-20" />
                                            )}
                                        </div>
                                        <span className="truncate">{supplier.name}</span>
                                        {impersonatedSupplierId === supplier.id && (
                                            <Check className="ml-auto h-4 w-4 text-primary" />
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <AnimatePresence>
                {impersonatedSupplierId && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="px-3 py-1 bg-primary text-white rounded-full text-[8px] font-black uppercase tracking-tighter animate-pulse shadow-lg shadow-primary/20"
                    >
                        Auditoría Activa
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

