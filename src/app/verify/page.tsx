'use client';

import { useFirestore, useMemoFirebase } from '@/firebase';
import { useDocOnce } from '@/firebase/firestore/use-doc-once';
import { doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, ShieldX, User, Fingerprint } from 'lucide-react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface UserProfile {
    id: string;
    username: string;
    photoURL?: string;
    firstName: string;
    lastName: string;
    dni: string;
    university: string;
}

function VerificationSkeleton() {
    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <Skeleton className="mx-auto h-8 w-48" />
                <Skeleton className="mx-auto mt-2 h-4 w-64" />
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
                 <Skeleton className="h-32 w-32 rounded-full" />
                <div className="w-full space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-6 w-2/3" />
                </div>
            </CardContent>
        </Card>
    );
}

function VerificationContent() {
    const searchParams = useSearchParams();
    const userId = searchParams.get('userId');
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(
        () => (userId ? doc(firestore, 'users', userId) : null),
        [firestore, userId]
    );
    const { data: userProfile, isLoading, error } = useDocOnce<UserProfile>(userProfileRef);

    if (!userId) {
         return (
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <ShieldX className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">URL Inválida</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertTitle>Falta el ID de Usuario</AlertTitle>
                        <AlertDescription>
                            El enlace de verificación es incorrecto o está incompleto.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return <VerificationSkeleton />;
    }

    if (error || !userProfile) {
        return (
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <ShieldX className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Usuario Inválido</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertTitle>Error de Verificación</AlertTitle>
                        <AlertDescription>
                            No se pudo encontrar el perfil del usuario. El código QR puede ser incorrecto o los permisos son insuficientes.
                            {error && <p className='mt-2 text-xs'>{error.message}</p>}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }
    
    const userInitial = userProfile.username ? userProfile.username.charAt(0).toUpperCase() : 'U';

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center pb-4">
                 <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Usuario Verificado</CardTitle>
                <CardDescription>
                    La identidad del estudiante ha sido confirmada.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
                <Avatar className="h-32 w-32 rounded-full border-4 border-primary">
                    <AvatarImage src={userProfile.photoURL} alt={userProfile.username} />
                    <AvatarFallback className="text-4xl">{userInitial}</AvatarFallback>
                </Avatar>
                <div className="space-y-3 text-left w-full">
                   <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <p className="text-lg font-semibold text-foreground">{`${userProfile.firstName} ${userProfile.lastName}`}</p>
                   </div>
                   <div className="flex items-center gap-3">
                        <span className="text-muted-foreground font-mono text-lg">@</span>
                        <p className="text-md text-muted-foreground">{userProfile.username}</p>
                   </div>
                   <div className="flex items-center gap-3">
                        <Fingerprint className="h-5 w-5 text-muted-foreground" />
                        <p className="text-md text-muted-foreground">{userProfile.dni}</p>
                   </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function VerificationPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted p-4">
            <Suspense fallback={<VerificationSkeleton />}>
                <VerificationContent />
            </Suspense>
        </div>
    );
}
