import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

interface AdminAccessDeniedProps {
    title?: string;
    description?: string;
}

export default function AdminAccessDenied({ title, description }: AdminAccessDeniedProps) {
    return (
        <div className="flex flex-col items-center justify-center pt-16">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">{title || 'Acceso Denegado'}</CardTitle>
                    <CardDescription>
                        {description || 'No tienes permisos para acceder a esta página.'}
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
