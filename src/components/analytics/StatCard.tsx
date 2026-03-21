'use client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import type { LucideIcon } from 'lucide-react';
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    href?: string;
    description?: string;
}

export function StatCard({ title, value, icon: Icon, href, description }: StatCardProps) {
    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b/5 transition-colors">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="p-2 rounded-xl bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent className="flex-grow pt-4">
                <div className="text-3xl font-black tracking-tight text-foreground">
                    {value}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1 font-medium italic">
                        {description}
                    </p>
                )}
            </CardContent>
            {href && (
                <CardFooter>
                    <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={href}>
                            Ver detalle
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}