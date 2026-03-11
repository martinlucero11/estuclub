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
}

export function StatCard({ title, value, icon: Icon, href }: StatCardProps) {
    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="text-2xl font-bold">
                    {value}
                </div>
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