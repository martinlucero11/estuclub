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
  documentId,
} from "firebase/firestore";
import Link from "next/link";
import type { Benefit, SupplierProfile, Announcement, HomeSection, CluberCategory, SerializableBenefit } from "@/types/data";
import { createConverter } from "@/lib/firestore-converter";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import BenefitCard from '../perks/perk-card';
import AnnouncementCard from '../announcements/announcement-card';
import { Building, Briefcase, Heart, ShoppingBag, Wrench, Users } from 'lucide-react';
import { makeBenefitSerializable } from "@/lib/data";


const buildConstraints = (
  props: HomeSection['block']
): QueryConstraint[] => {
    if (props.kind !== 'grid') {
        return [];
    }

  const { contentType, query: queryConfig } = props;
  const constraints: QueryConstraint[] = [];

  // Default filters
  if (contentType === 'benefits') {
    constraints.push(where('isVisible', '==', true));
  }
  if (contentType === 'announcements') {
      constraints.push(where('status', '==', 'approved'));
  }
  if (contentType === 'suppliers') {
      constraints.push(where('isVisible', '==', true));
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
  } else {
      constraints.push(orderBy('createdAt', 'desc'));
  }
  
  // Apply limit
  constraints.push(limit(queryConfig?.limit || 10));

  return constraints;
};

function useGridData<T extends { id: string }>(
  collectionName: string,
  props: HomeSection['block']
) {
  const firestore = useFirestore();

  if (props.kind !== 'grid') {
    return { items: [], isLoading: false, error: null };
  }

  const { mode, items: itemIds, query: queryConfig, contentType } = props;

  const stringifiedItemIds = JSON.stringify(itemIds);
  const stringifiedQueryConfig = JSON.stringify(queryConfig);

  const dataQuery = useMemo(() => {
    if (!firestore) return null;

    const itemsCollection = collection(firestore, collectionName).withConverter(createConverter<T>());
    
    if (mode === 'manual') {
      const parsedItemIds = JSON.parse(stringifiedItemIds || '[]') as string[];
      if (parsedItemIds.length === 0) return null;
      return query(itemsCollection, where(documentId(), 'in', parsedItemIds.slice(0, 30)));
    }
    
    if (mode === 'auto') {
      const stableProps = { kind: 'grid', mode, query: queryConfig, contentType };
      const constraints = buildConstraints(stableProps as any);
      return query(itemsCollection, ...constraints);
    }

    return null;
  }, [firestore, collectionName, mode, stringifiedItemIds, stringifiedQueryConfig, contentType]);

  const { data: queriedItems, isLoading, error } = useCollectionOnce(dataQuery);
  
  const items = useMemo(() => {
    if (!queriedItems) return [];
    if (mode === 'manual') {
      const parsedItemIds = JSON.parse(stringifiedItemIds || '[]') as string[];
      const orderMap = new Map(parsedItemIds.map((id, index) => [id, index]));
      return [...queriedItems].sort((a, b) => (orderMap.get(a.id) ?? Infinity) - (orderMap.get(b.id) ?? Infinity));
    }
    return queriedItems;
  }, [queriedItems, mode, stringifiedItemIds]);

  return { items, isLoading, error };
}


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
        const { items, isLoading, error } = useGridData<T>(collectionName, props);
        
        const processedItems = useMemo(() => {
            if (!items) return [];
            if (props.kind === 'grid' && props.contentType === 'benefits') {
                 return items.map(b => makeBenefitSerializable(b as unknown as Benefit));
            }
            return items;
        }, [items, props]);

        if (isLoading) {
            return (
                <div className={gridClass}>
                    {[...Array(8)].map((_, i) => (
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

export const BenefitsGrid = createGrid<SerializableBenefit>(BenefitCard, 'benefits', 'benefit', "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5");
export const SuppliersGrid = createGrid<SupplierProfile>(SupplierGridCard, 'roles_supplier', 'supplier', "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5");
export const AnnouncementsGrid = createGrid<Announcement>(AnnouncementCard, 'announcements', 'announcement', "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3");
