'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeResult } from 'html5-qrcode';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CheckCircle, Fingerprint, Loader2, University, XCircle, Award, Building, Tag, AlertTriangle } from 'lucide-react';
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
function ValidationResult({ data, onScanAgain, alreadyUsed }: { data: ValidationData, onScanAgain: () => void, alreadyUsed: boolean }) {
    const { redemption, profile } = data;

    if (!redemption || !profile) {
        return (
            <div className="flex flex-col items-center justify-center bg-background/90 p-4">
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Error de Datos</AlertTitle>
                    <AlertDescription>No se pudieron cargar los detalles del canje. Por favor, intenta de nuevo.</AlertDescription>
                </Alert>
                <Button className="w-full mt-4" onClick={onScanAgain}>Escanear de Nuevo</Button>
            </div>
        );
    }

    const userInitial = profile.firstName ? profile.firstName.charAt(0).toUpperCase() : 'U';

    return (
        <Card className="w-full">
            <CardHeader className="text-center pb-4">
                {alreadyUsed ? (
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50 mb-4">
                        <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                ) : (
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 mb-4">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                )}
                <CardTitle>{alreadyUsed ? 'Canje Ya Validado' : 'Canje Validado'}</CardTitle>
                <CardDescription>
                    {alreadyUsed
                        ? 'Este beneficio ya fue marcado como usado anteriormente.'
                        : 'El beneficio ha sido marcado como usado exitosamente.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
                <div className="flex w-full flex-col sm:flex-row items-center gap-6">
                    <Avatar className="h-32 w-32 rounded-full border-4 border-primary">
                        <AvatarImage src={profile.photoURL} alt={profile.username} />
                        <AvatarFallback className="text-4xl">{userInitial}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-3 text-left w-full">
                        <p className="text-lg font-semibold text-foreground">{`${profile.firstName || ''} ${profile.lastName || ''}`.trim()}</p>
                        <div className="flex items-center gap-3"><Fingerprint className="h-5 w-5 text-muted-foreground" /><p className="text-md text-muted-foreground">{redemption.userDni || 'N/A'}</p></div>
                        <div className="flex items-center gap-3"><University className="h-5 w-5 text-muted-foreground" /><p className="text-md text-muted-foreground">{profile.university || 'No especificada'}</p></div>
                        <div className="flex items-center gap-3"><Award className="h-5 w-5 text-muted-foreground" /><p className="text-md text-muted-foreground">{`${profile.points || 0} Puntos`}</p></div>
                    </div>
                </div>
                <div className='w-full border-t pt-4 space-y-2'>
                    <div className='flex items-center gap-2 text-sm'><Tag className='h-4 w-4 text-primary'/><span className="font-medium text-foreground">{redemption.benefitTitle || 'Beneficio sin título'}</span></div>
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'><Building className='h-4 w-4'/><span>{`Canjeado en: ${redemption.supplierName || 'Comercio no especificado'}`}</span></div>
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
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationData, setValidationData] = useState<ValidationData | null>(null);
    const [wasAlreadyUsed, setWasAlreadyUsed] = useState(false);

    const handleScanSuccess = async (decodedText: string, result: Html5QrcodeResult) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setScanError(null);
        setWasAlreadyUsed(false);

        try {
            if (scannerRef.current?.isScanning) {
                await scannerRef.current.stop();
            }
            
            let redemptionId: string;
            try {
                 const jsonData = JSON.parse(decodedText);
                 redemptionId = jsonData.redemptionId;
                 if (!redemptionId) throw new Error();
            } catch (error) {
                throw new Error("El código QR no es válido o tiene un formato incorrecto.");
            }

            if (!user) throw new Error("Debes estar autenticado para validar un canje.");

            const redemptionRef = doc(firestore, "benefitRedemptions", redemptionId);
            const redemptionSnap = await getDoc(redemptionRef);
            if (!redemptionSnap.exists()) throw new Error("Canje no encontrado en la base de datos. El código puede ser antiguo o inválido.");

            const redemptionData = redemptionSnap.data() as BenefitRedemption;
            if (!redemptionData) throw new Error("No se pudieron leer los datos del canje.");

            if (redemptionData.supplierId !== user.uid && !userIsAdmin) throw new Error("Este canje no pertenece a tu comercio.");
            
            const userProfileRef = doc(firestore, "users", redemptionData.userId);
            const userProfileSnap = await getDoc(userProfileRef);
            if (!userProfileSnap.exists()) throw new Error("El perfil del estudiante asociado a este canje no fue encontrado.");
            const userProfileData = userProfileSnap.data() as UserProfile;
             if (!userProfileData) throw new Error("No se pudieron leer los datos del perfil del estudiante.");
            
            if (redemptionData.status === "pending") {
                const batch = writeBatch(firestore);
                const userRedemptionRef = doc(firestore, 'users', redemptionData.userId, 'redeemed_benefits', redemptionId);
                const updateData = { status: 'used' as const, usedAt: serverTimestamp() };
                batch.update(redemptionRef, updateData);
                batch.update(userRedemptionRef, updateData);
                await batch.commit();
                toast({ title: "¡Canje exitoso!", description: "El beneficio ha sido marcado como usado." });
            } else {
                setWasAlreadyUsed(true);
                toast({ variant: 'default', title: "Canje Ya Verificado", description: "Este canje ya había sido marcado como usado." });
            }

            const finalValidationData = { 
                redemption: { ...redemptionData, id: redemptionId }, 
                profile: userProfileData 
            };

            if (!finalValidationData.redemption || !finalValidationData.profile) {
                 throw new Error("Ocurrió un error al ensamblar los datos de validación finales.");
            }

            setValidationData(finalValidationData);

        } catch (e: any) {
            console.error("[SCAN VALIDATION ERROR]:", e);
            const errorMessage = e instanceof Error ? e.message : "Ocurrió un error desconocido durante la validación.";
            setScanError(errorMessage);
            toast({ variant: 'destructive', title: "Error de Validación", description: errorMessage });
        }
    };
    
    const handleScanError = (errorMessage: string) => {
        // This error happens every frame where a QR code is not detected. We can safely ignore it.
        const isNormalScanningError = errorMessage.includes("NotFoundException") || 
                                    errorMessage.includes("No MultiFormat Readers were able to detect the code");
        if (isNormalScanningError) {
            return; // Silently ignore
        }

        // Only set a real error if one isn't already being displayed from the validation flow
        if (!scanError && !isProcessing) {
            setScanError("Ocurrió un error inesperado con el escáner.");
            console.error(`[QR SCANNER UNHANDLED ERROR]: ${errorMessage}`);
        }
    };

    useEffect(() => {
        const qrCodeElementId = 'qr-reader';
        const html5Qrcode = new Html5Qrcode(qrCodeElementId, { verbose: false });
        scannerRef.current = html5Qrcode;
        let isCancelled = false;

        const startScanner = async () => {
            if (isCancelled || document.getElementById(qrCodeElementId) === null) return;
            try {
                await html5Qrcode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: qrboxFunction, aspectRatio: 1.0 },
                    handleScanSuccess,
                    handleScanError
                );
                 if (isCancelled && html5Qrcode.isScanning) {
                    await html5Qrcode.stop();
                }
            } catch (err) {
                console.error("[QR START ERROR]:", err);
                let message = "No se pudo iniciar la cámara.";
                if (err instanceof Error) {
                     if (err.name === 'NotAllowedError') message = 'Permiso de cámara denegado. Habilítalo en tu navegador.';
                     else if (err.name === 'NotFoundError') message = 'No se encontró una cámara. Conecta una para continuar.';
                     else if (err.name === 'NotReadableError') message = 'La cámara ya está en uso por otra aplicación.';
                }
                setScanError(message);
            }
        };

        if (!validationData && !scanError) {
            startScanner();
        }

        return () => {
            isCancelled = true;
            if (html5Qrcode?.isScanning) {
                html5Qrcode.stop().catch(e => console.error("[QR STOP ERROR]:", e));
            }
        };
    }, [validationData, scanError]);

    const handleReset = () => {
        setValidationData(null);
        setIsProcessing(false);
        setScanError(null);
        setWasAlreadyUsed(false);
    };

    if (validationData) {
        return <ValidationResult data={validationData} onScanAgain={handleReset} alreadyUsed={wasAlreadyUsed} />;
    }

    return (
        <Card>
            <CardContent className="p-4 relative aspect-square flex items-center justify-center">
                <div id="qr-reader" className="w-full h-full rounded-lg overflow-hidden bg-muted" />
                {scanError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 p-4">
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Error de Escaneo</AlertTitle>
                            <AlertDescription>{scanError}</AlertDescription>
                        </Alert>
                        <Button className="w-full mt-4" onClick={handleReset}>Volver a Intentar</Button>
                    </div>
                ) : !isProcessing && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <div className="p-4 bg-background/50 rounded-lg backdrop-blur-sm">
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                         </div>
                        <p className="mt-4 text-white font-bold text-shadow-lg">Buscando código QR...</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
