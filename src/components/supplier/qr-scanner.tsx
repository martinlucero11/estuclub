'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeResult } from 'html5-qrcode';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CheckCircle, Fingerprint, Loader2, University, XCircle, Award, Building, Tag, AlertTriangle, Camera } from 'lucide-react';
import { Button } from '../ui/button';
import type { BenefitRedemption } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

// User profile structure
interface UserProfile {
    id: string;
    username: string;
    photoURL?: string;
    university: string;
    points: number;
    firstName: string;
    lastName: string;
}

// Validation data structure
interface ValidationData {
    redemption: BenefitRedemption;
    profile: UserProfile;
}

const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number): any => {
    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
    const qrboxSize = Math.floor(minEdge * 0.8);
    return { width: qrboxSize, height: qrboxSize };
};

// Validation Result Component
function ValidationResult({ data, onScanAgain, wasJustValidated }: { data: ValidationData; onScanAgain: () => void; wasJustValidated: boolean }) {
    const { redemption, profile } = data;
    const userInitial = profile.firstName ? profile.firstName.charAt(0).toUpperCase() : 'U';

    const title = wasJustValidated ? "Canje Validado" : "Canje Ya Validado";
    const description = wasJustValidated
        ? "El beneficio ha sido marcado como usado."
        : "Este beneficio ya fue utilizado anteriormente.";
    const Icon = wasJustValidated ? CheckCircle : AlertTriangle;
    const iconColor = wasJustValidated
        ? "text-green-600 dark:text-green-400"
        : "text-yellow-600 dark:text-yellow-400";
    const bgColor = wasJustValidated
        ? "bg-green-100 dark:bg-green-900/50"
        : "bg-yellow-100 dark:bg-yellow-900/50";


    return (
        <Card className="w-full">
            <CardHeader className="text-center pb-4">
                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${bgColor} mb-4`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
                <div className="flex w-full flex-col sm:flex-row items-center gap-6">
                    <Avatar className="h-32 w-32 rounded-full border-4 border-primary">
                        <AvatarImage src={profile.photoURL} alt={profile.username} />
                        <AvatarFallback className="text-4xl">{userInitial}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-3 text-left w-full">
                        <p className="text-lg font-semibold text-foreground">{`${profile.firstName} ${profile.lastName}`}</p>
                        <div className="flex items-center gap-3"><Fingerprint className="h-5 w-5 text-muted-foreground" /><p className="text-md text-muted-foreground">{redemption.userDni}</p></div>
                        <div className="flex items-center gap-3"><University className="h-5 w-5 text-muted-foreground" /><p className="text-md text-muted-foreground">{profile.university || 'No especificada'}</p></div>
                        <div className="flex items-center gap-3"><Award className="h-5 w-5 text-muted-foreground" /><p className="text-md text-muted-foreground">{`${profile.points} Puntos`}</p></div>
                    </div>
                </div>
                <div className='w-full border-t pt-4 space-y-2'>
                    <div className='flex items-center gap-2 text-sm'><Tag className='h-4 w-4 text-primary'/><span className="font-medium text-foreground">{redemption.benefitTitle}</span></div>
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'><Building className='h-4 w-4'/><span>{`Canjeado en: ${redemption.supplierName}`}</span></div>
                </div>
            </CardContent>
            <CardFooter><Button className="w-full" onClick={onScanAgain}>Escanear Otro Código</Button></CardFooter>
        </Card>
    );
}

// Main QrScanner Component
export default function QrScanner({ userIsAdmin = false }: { userIsAdmin?: boolean }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [scannerState, setScannerState] = useState<'idle' | 'scanning' | 'processing' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [validationData, setValidationData] = useState<ValidationData | null>(null);
    const [wasJustValidated, setWasJustValidated] = useState(false);
    
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const qrReaderElementId = 'qr-reader';

    const stopScanner = () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(err => {
                console.error("Error stopping the scanner.", err);
            });
        }
    };
    
    const startScanner = async () => {
        setScannerState('scanning');
        setErrorMessage(null);

        await new Promise(resolve => setTimeout(resolve, 100));

        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode(qrReaderElementId, { verbose: false });
        }

        try {
            await scannerRef.current.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: qrboxFunction, aspectRatio: 1.0 },
                (decodedText: string, result: Html5QrcodeResult) => {
                    handleScanSuccess(decodedText, result);
                },
                (errorMsg: string, errorObj: any) => { 
                    if (errorMsg.includes("NotFoundException")) return;
                }
            );
        } catch (err: any) {
            stopScanner();
            setScannerState('error');
            let message = "No se pudo iniciar la cámara.";
            if (err.name === 'NotAllowedError') message = 'Permiso de cámara denegado. Por favor, habilita el acceso a la cámara en los ajustes de tu navegador.';
            else if (err.name === 'NotFoundError') message = 'No se encontró una cámara en este dispositivo.';
            else if (err.name === 'NotReadableError') message = 'La cámara ya está en uso por otra aplicación.';
            setErrorMessage(message);
        }
    };
    
    const handleScanSuccess = async (decodedText: string, result: Html5QrcodeResult) => {
        if (scannerState !== 'scanning') return;
        
        setScannerState('processing');
        stopScanner();

        try {
            const { redemptionId } = JSON.parse(decodedText);
            if (!redemptionId) throw new Error("Código QR inválido. No contiene un ID de canje.");
            if (!user) throw new Error("Debes estar autenticado para validar un canje.");

            const redemptionRef = doc(firestore, "benefitRedemptions", redemptionId);
            const redemptionSnap = await getDoc(redemptionRef);
            if (!redemptionSnap.exists()) throw new Error("Canje no encontrado.");

            const redemptionData = { id: redemptionSnap.id, ...redemptionSnap.data() } as BenefitRedemption;
            if (redemptionData.supplierId !== user.uid && !userIsAdmin) throw new Error("Este canje no pertenece a tu comercio.");

            const userProfileRef = doc(firestore, "users", redemptionData.userId);
            const userProfileSnap = await getDoc(userProfileRef);
            if (!userProfileSnap.exists()) throw new Error("Perfil de usuario no encontrado.");
            const profileData = userProfileSnap.data() as UserProfile;

            let finalRedemptionData = { ...redemptionData };

            if (redemptionData.status === 'pending') {
                const batch = writeBatch(firestore);
                const userRedemptionRef = doc(firestore, 'users', redemptionData.userId, 'redeemed_benefits', redemptionId);
                const updateData = { status: 'used' as const, usedAt: serverTimestamp() };
                batch.update(redemptionRef, updateData);
                batch.update(userRedemptionRef, updateData);
                await batch.commit();
                
                finalRedemptionData.status = 'used';
                setWasJustValidated(true);
                toast({ title: "¡Canje exitoso!", description: "El beneficio ha sido marcado como usado." });
            } else {
                setWasJustValidated(false);
                toast({
                    variant: 'default',
                    title: "Canje ya validado",
                    description: "Este código QR fue utilizado anteriormente.",
                });
            }
            
            setValidationData({ redemption: finalRedemptionData, profile: profileData });
            setScannerState('idle');
        } catch (e: any) {
            setScannerState('error');
            setErrorMessage(e.message || "Ocurrió un error al validar el canje.");
            toast({ variant: 'destructive', title: "Error de validación", description: e.message });
        }
    };
    
    const handleReset = () => {
        stopScanner();
        setScannerState('idle');
        setErrorMessage(null);
        setValidationData(null);
        setWasJustValidated(false);
    };
    
    useEffect(() => {
        return () => stopScanner();
    }, []);

    if (validationData) {
        return <ValidationResult data={validationData} onScanAgain={handleReset} wasJustValidated={wasJustValidated} />;
    }

    return (
        <Card>
            <CardContent className="p-4 relative aspect-square flex items-center justify-center overflow-hidden">
                <div id={qrReaderElementId} className={`w-full h-full ${scannerState !== 'scanning' ? 'invisible' : ''}`} />
                
                {scannerState === 'idle' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 p-4 text-center">
                        <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                        <Button onClick={startScanner}>Activar Escáner</Button>
                    </div>
                )}
                
                {scannerState === 'error' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 p-4">
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Error del Escáner</AlertTitle>
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                        <Button className="w-full mt-4" onClick={startScanner}>Volver a Intentar</Button>
                    </div>
                )}

                {(scannerState === 'scanning' || scannerState === 'processing') && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-black/20">
                        <div className="w-2/3 h-2/3 border-4 border-dashed border-white/50 rounded-lg" />
                        {scannerState === 'processing' && (
                            <div className='absolute inset-0 bg-background/80 flex flex-col items-center justify-center'>
                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                <p className="mt-4 font-medium text-foreground">Procesando...</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
