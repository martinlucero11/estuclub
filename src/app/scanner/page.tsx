
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldAlert, QrCode, CameraOff } from 'lucide-react';
import { useAdmin } from '@/firebase/auth/use-admin';
import { useSupplier } from '@/firebase/auth/use-supplier';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';

function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center pt-16">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Acceso Denegado</CardTitle>
                    <CardDescription>
                        No tienes permisos para acceder a esta función.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-center text-muted-foreground">
                        Esta herramienta es solo para administradores y proveedores.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

function ScannerLoadingSkeleton() {
    return (
        <div className="space-y-8">
            <header className="space-y-2">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </header>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="aspect-square w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

export default function ScannerPage() {
    const { isAdmin, isLoading: isAdminLoading } = useAdmin();
    const { isSupplier, isLoading: isSupplierLoading } = useSupplier();
    const { toast } = useToast();
    const router = useRouter();

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const requestRef = useRef<number>();

    const isLoading = isAdminLoading || isSupplierLoading;
    const canAccess = isAdmin || isSupplier;

    const tick = useCallback(() => {
        if (isScanning && videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (context) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });

                if (code) {
                    const url = code.data;
                     if (url.includes('/redeem/') || url.includes('/verify/')) {
                        setIsScanning(false);
                        toast({
                            title: 'Código QR Detectado',
                            description: 'Redirigiendo a la página de validación...',
                        });
                        router.push(url);
                        return; // Stop the loop
                    }
                }
            }
        }
        requestRef.current = requestAnimationFrame(tick);
    }, [isScanning, router, toast]);

    useEffect(() => {
        if (!isLoading && canAccess) {
            const getCameraPermission = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.onloadedmetadata = () => {
                            setHasCameraPermission(true);
                            setIsScanning(true);
                        };
                    }
                } catch (error) {
                    console.error('Error accessing camera:', error);
                    setHasCameraPermission(false);
                    toast({
                        variant: 'destructive',
                        title: 'Acceso a la cámara denegado',
                        description: 'Por favor, habilita los permisos de la cámara en tu navegador.',
                    });
                }
            };
            getCameraPermission();
        }

        return () => {
             if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isLoading, canAccess, toast]);

    useEffect(() => {
        if (isScanning) {
            requestRef.current = requestAnimationFrame(tick);
        }
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isScanning, tick]);

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex-1 space-y-8 p-4 md:p-8">
                    <ScannerLoadingSkeleton />
                </div>
            </MainLayout>
        );
    }

    if (!canAccess) {
        return (
            <MainLayout>
                <AccessDenied />
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex-1 space-y-8 p-4 md:p-8">
                <header className="space-y-2">
                    <div className="flex items-center gap-3">
                        <QrCode className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                            Escanear QR
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Apunta la cámara al código QR para validar un beneficio o verificar un usuario.
                    </p>
                </header>

                <Card>
                    <CardContent className="p-6">
                        {hasCameraPermission === false && (
                            <Alert variant="destructive">
                                <CameraOff className="h-4 w-4" />
                                <AlertTitle>Cámara no disponible</AlertTitle>
                                <AlertDescription>
                                    No se pudo acceder a la cámara. Por favor, revisa los permisos de tu navegador.
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="relative mx-auto max-w-sm aspect-square w-full overflow-hidden rounded-md bg-muted">
                            <video
                                ref={videoRef}
                                className="h-full w-full object-cover"
                                autoPlay
                                playsInline
                                muted
                            />
                            {hasCameraPermission && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="absolute h-2/3 w-2/3 border-4 border-white/50" />
                                    <p className="z-10 mt-48 rounded-md bg-black/50 px-2 py-1 text-white">
                                        Buscando código QR...
                                    </p>
                                </div>
                            )}
                             <canvas ref={canvasRef} className="hidden" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}

