'use client';

import Link from "next/link";
import type { Product, Banner, SupplierProfile, Announcement, CluberCategory, SerializableBenefit } from "@/types/data";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card } from "../ui/card";
import BenefitCard from '../perks/perk-card';
import AnnouncementCard from '../announcements/announcement-card';
import { Building, Briefcase, Heart, ShoppingBag, Wrench, Users, Package } from 'lucide-react';
import { ProductCard } from "../delivery/product-card";

const categoryIcons: Record<CluberCategory, React.ElementType> = {
    Comercio: ShoppingBag,
    Profesional: Briefcase,
    Empresa: Building,
    Emprendimiento: Users,
    Salud: Heart,
    Estética: Briefcase,
    Servicios: Wrench,
};

const SupplierGridCard = ({ supplier }: { supplier: SupplierProfile }) => {
    const TypeIcon = categoryIcons[supplier.type] || Users;
    const initials = getInitials(supplier.name);

    return (
        <Link key={supplier.id} href={`/proveedores/view?slug=${supplier.slug}`} className="group block h-full active:scale-95 transition-transform duration-200">
            <Card className="bg-card/40 backdrop-blur-sm rounded-3xl shadow-premium border border-border/40 p-4 flex flex-col items-center text-center transition-all duration-500 group-hover:shadow-2xl group-hover:border-primary/20 group-hover:-translate-y-1 h-full">
                <div className="w-16 h-16 rounded-full border-2 border-border/50 group-hover:border-primary/30 mb-3 overflow-hidden transition-colors duration-500 shadow-inner">
                    <Avatar className="h-full w-full">
                        <AvatarImage src={supplier.logoUrl || undefined} alt={supplier.name} className="object-cover transition-transform duration-500 group-hover:scale-110" />
                        <AvatarFallback className="bg-muted text-lg font-bold text-muted-foreground">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1 line-clamp-1">{supplier.name}</h3>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
                    <TypeIcon className="h-3 w-3 mr-1.5" />
                    {supplier.type}
                </div>
            </Card>
        </Link>
    );
};

const createGrid = <T extends {id: string}>(
    CardComponent: React.FC<any>, 
    dataKey: string,
    gridClass: string
) => {
    return function Grid({ items }: { items: T[] }) {
        if (!items || items.length === 0) {
            return <p className="text-muted-foreground italic text-sm">No hay contenido para mostrar.</p>;
        }

        return (
             <div className={gridClass}>
                {
                    items.map(item => <CardComponent key={item.id} {...{ [dataKey]: item }} />)
                }
            </div>
        )
    }
}

export const BenefitsGrid = createGrid<SerializableBenefit & { id: string }>(BenefitCard, 'benefit', "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4");
export const SuppliersGrid = createGrid<SupplierProfile>(SupplierGridCard, 'supplier', "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5");
export const AnnouncementsGrid = createGrid<Announcement>(AnnouncementCard, 'announcement', "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3");
export const ProductsGrid = createGrid<Product>(ProductCard, 'product', "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6");
