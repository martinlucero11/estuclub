'use client';
export const dynamic = 'force-dynamic';

import { useAdmin } from '@/firebase/auth/use-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryTable } from './components/category-table';
import BackButton from '@/components/layout/back-button';

function AdminAccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center pt-16">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Acceso Denegado</CardTitle>
                    <CardDescription>
                        Solo los administradores pueden gestionar las categorías.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        </div>
    );
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from 'react';

export default function CategoriesPage() {
    const { isAdmin, isLoading } = useAdmin();
    const [activeTab, setActiveTab] = useState<'perks' | 'delivery'>('perks');

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!isAdmin) {
        return <AdminAccessDenied />;
    }

    return (
        <div className="space-y-6">
            <BackButton />
            
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight">Gestión de Categorías</h1>
                <p className="text-foreground font-medium italic opacity-80">
                    Organiza las etiquetas y filtros que aparecen en cada sección de la plataforma.
                </p>
            </div>

            <Tabs defaultValue="perks" onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-background/60 backdrop-blur-md border border-white/10 p-1 h-12 rounded-2xl shadow-inner">
                        <TabsTrigger 
                            value="perks" 
                            className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                        >
                            Beneficios
                        </TabsTrigger>
                        <TabsTrigger 
                            value="delivery" 
                            className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                        >
                            Delivery
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="perks" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <CategoryTable type="perks" />
                </TabsContent>
                
                <TabsContent value="delivery" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <CategoryTable type="delivery" />
                </TabsContent>
            </Tabs>
        </div>
    );
}


