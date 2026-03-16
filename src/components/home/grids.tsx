'use client';

import Link from "next/link";
import type { Benefit, SupplierProfile, Announcement, CluberCategory, SerializableBenefit } from "@/types/data";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card } from "../ui/card";
import BenefitCard from '../perks/perk-card';
import AnnouncementCard from '../announcements/announcement-card';
import { Building, Briefcase, Heart, ShoppingBag, Wrench, Users } from 'lucide-react';

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
        <Link key={supplier.id} href={`/proveedores/${supplier.slug}`} className="group block h-full">
            <Card className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 flex flex-col items-center text-center transition-all hover:shadow-lg h-full">
                <div className="w-16 h-16 rounded-full border-2 border-border mb-3 overflow-hidden">
                    <Avatar className="h-full w-full">
                        <AvatarImage src={supplier.logoUrl || undefined} alt={supplier.name} className="object-cover" />
                        <AvatarFallback className="bg-muted text-lg font-semibold text-muted-foreground">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <h3 className="text-md font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{supplier.name}</h3>
                <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground capitalize">
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
