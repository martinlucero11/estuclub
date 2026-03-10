'use client';
import { useMemo } from "react";
import { useCollectionOnce, useFirestore } from "@/firebase";
import {
  collection,
  query,
  limit,
  where,
  orderBy,
  QueryConstraint,
} from "firebase/firestore";
import Link from "next/link";
import type { Benefit, SupplierProfile, Announcement, HomeSection, CluberCategory, SerializableBenefit } from "@/types/data";
import { createConverter } from "@/lib/firestore-converter";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import BenefitCard from '../perks/perk-card'; // The one from perks directory
import AnnouncementCard from '../announcements/announcement-card';
import { Building, Briefcase, Heart, ShoppingBag, Wrench, Users } from 'lucide-react';
import { makeBenefitSerializable } from "@/lib/data";


const buildConstraints = (
  props: HomeSection['block']
): QueryConstraint[] => {
    if (props.kind === 'banner' || props.kind === 'categories') {
        return [];
    }

  const { contentType, query: queryConfig } = props;
  const constraints: QueryConstraint[] = [];

  // Default filters
  if (contentType === 'benefits' || contentType === 'suppliers') {
    constraints.push(where('isVisible', '==', true));
  }
  if (contentType === 'announcements') {
      constraints.push(where('status', '==', 'approved'));
  }

  // Apply custom filters from Home Builder
  queryConfig?.filters?.forEach((f) => {
    if (f.field && f.op && f.value !== undefined) {
      constraints.push(where(f.field, f.op, f.value));
    }
  });

  // Apply sorting
  if (queryConfig?.sort?.field) {
    constraints.push(orderBy(queryConfig.sort.field, queryConfig.sort.direction || 'desc'));
  } else if (contentType !== 'suppliers') {
      // Default sort for benefits and announcements if not specified
      constraints.push(orderBy('createdAt', 'desc'));
  }
  
  // Apply limit
  constraints.push(limit(queryConfig?.limit || 10));

  return constraints;
};


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
    collectionName: string, 
    dataKey: string,
    gridClass: string
) => {
    return function Grid(props: HomeSection['block']) {
        const firestore = useFirestore();
        
        const itemsQuery = useMemo(() => {
            if (props.kind !== 'grid') return null;
            const constraints = buildConstraints(props);
            return query(collection(firestore, collectionName).withConverter(createConverter<T>()), ...constraints);
        }, [firestore, props]);

        const { data: items, isLoading, error } = useCollectionOnce(itemsQuery);
        
        const processedItems = useMemo(() => {
            if (!items) return [];
            if (props.kind === 'grid' && props.contentType === 'suppliers' && props.query?.sort?.field === 'name') {
                return [...items].sort((a: any, b: any) => {
                    const direction = props.query?.sort?.direction === 'asc' ? 1 : -1;
                    return a.name.localeCompare(b.name) * direction;
                });
            }
            if (props.kind === 'grid' && props.contentType === 'benefits') {
                 return items.map(b => makeBenefitSerializable(b as any as Benefit));
            }
            return items;
        }, [items, props]);

        if (isLoading) {
            return (
                <div className={gridClass}>
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                    ))}
                </div>
            )
        }
        
        if (error || !processedItems || processedItems.length === 0) {
            return <p className="text-muted-foreground italic text-sm">No hay contenido para mostrar.</p>;
        }

        return (
             <div className={gridClass}>
                {
                    processedItems.map(item => <CardComponent key={item.id} {...{ [dataKey]: item }} />)
                }
            </div>
        )
    }
}

export const BenefitsGrid = createGrid<SerializableBenefit>(BenefitCard, 'benefits', 'benefit', "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4");
export const SuppliersGrid = createGrid<SupplierProfile>(SupplierGridCard, 'roles_supplier', 'supplier', "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5");
export const AnnouncementsGrid = createGrid<Announcement>(AnnouncementCard, 'announcements', 'announcement', "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3");
