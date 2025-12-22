
'use client';

import { useFirestore, useMemoFirebase } from '@/firebase';
import { useDocOnce } from '@/firebase/firestore/use-doc-once';
import { doc, Timestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, ShieldX, Fingerprint, Award, University } from 'lucide-react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { BenefitRedemption } from '@/lib/data';

export const dynamic = 'force-dynamic';


interface UserProfile {
    id: string;
    username: string;
    photoURL?: string;
    university: string;
    points: number;
}

function ValidationSkeleton() {
    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <Skeleton className="mx-auto h-8 w-48" />
                <Skeleton className="mx-auto mt-2 h-4 w-64" />
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
                <div className="flex w-full items-center gap-6">
                    <Skeleton className="h-32 w-32 rounded-full" />
                    <div className="w-full space-y-4">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-6 w-2/3" />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-8 w-full" />
            </CardFooter>
        </Card>
    );
}

function RedemptionValidationContent() {
    const searchParams = useSearchParams();
    const redemptionId = searchParams.get('redemptionId');

    const firestore = useFirestore();

    const redemptionRef = useMemoFirebase(
        () => (redemptionId ? doc(firestore, 'benefitRedemptions', redemptionId) : null),
        [firestore, redemptionId]
    );

    const { data: redemption, isLoading: isRedemptionLoading, error: redemptionError } = useDocOnce<BenefitRedemption>(redemptionRef);

    const userProfileRef = useMemoFirebase(
        () => (redemption ? doc(firestore, 'users', redemption.userId) : null),
        [firestore, redemption]
    );
    const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useDocOnce<UserProfile>(userProfileRef);

    const isLoading = isRedemptionLoading || isProfileLoading;
    const error = redemptionError || profileError;
    
    if (!redemptionId) {
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
                        <AlertTitle>Faltan Parámetros</AlertTitle>
                        <AlertDescription>
                            El enlace de validación es incorrecto o está incompleto.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return <ValidationSkeleton />;
    }

    if (error || !redemption || !userProfile) {
        return (
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <ShieldX className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Canje Inválido</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertTitle>Error de Validación</AlertTitle>
                        <AlertDescription>
                            No se pudo encontrar el canje o el perfil del usuario. El código QR puede ser incorrecto, haber expirado o no tienes permisos para verlo.
                            {error && <p className='mt-2 text-xs'>{error.message}</p>}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }
    
    const userInitial = redemption.userName ? redemption.userName.charAt(0).toUpperCase() : 'U';

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center pb-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Canje Válido</CardTitle>
                <CardDescription>
                    Se ha verificado la identidad del estudiante.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
                <div className="flex w-full items-center gap-6">
                    <Avatar className="h-32 w-32 rounded-full border-4 border-primary">
                        <AvatarImage src={userProfile.photoURL} alt={userProfile.username} />
                        <AvatarFallback className="text-4xl">{userInitial}</AvatarFallback>
                    </Avatar>
                     <div className="space-y-3 text-left w-full">
                        <p className="text-lg font-semibold text-foreground">{redemption.userName}</p>
                        <div className="flex items-center gap-3">
                            <Fingerprint className="h-5 w-5 text-muted-foreground" />
                            <p className="text-md text-muted-foreground">{redemption.userDni}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <University className="h-5 w-5 text-muted-foreground" />
                            <p className="text-md text-muted-foreground">{userProfile.university || 'No especificada'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Award className="h-5 w-5 text-muted-foreground" />
                            <p className="text-md text-muted-foreground">{userProfile.points} Puntos</p>
                        </div>
                    </div>
                </div>
            </CardContent>
             <CardFooter className='flex flex-col gap-2 text-center'>
                <p className='text-sm font-bold'>Beneficio Canjeado:</p>
                <p className='text-sm text-muted-foreground'>{redemption.benefitTitle}</p>
            </CardFooter>
        </Card>
    );
}


export default function RedemptionValidationPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted p-4">
            <Suspense fallback={<ValidationSkeleton />}>
                <RedemptionValidationContent />
            </Suspense>
        </div>
    );
}
