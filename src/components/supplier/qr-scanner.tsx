
'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeResult, Html5QrcodeError } from 'html5-qrcode';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Camera, CameraOff, CheckCircle, Fingerprint, Loader2, University, User as UserIcon, XCircle, Award, Building, Tag } from 'lucide-react';
import { Button } from '../ui/button';
import type { BenefitRedemption } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

// This is the user profile we expect to fetch.
interface UserProfile {
    id: string;
    username: string;
    photoURL?: string;
    university: string;
    points: number;
    firstName: string;
    lastName: string;
}

// Data to show on successful validation
interface ValidationData {
    redemption: BenefitRedemption;
    profile: UserProfile;
}

const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
    const qrboxSize = Math.floor(minEdge * 0.8);
    return {
        width: qrboxSize,
        height: qrboxSize,
    };
};

// Component to display the successful scan result
function ValidationResult({ data, onScanAgain }: { data: ValidationData, onScanAgain: () => void }) {
    const { redemption, profile } = data;
    const userInitial = profile.firstName ? profile.firstName.charAt(0).toUpperCase() : 'U';

    return (
        <Card className="w-full">
            <CardHeader className="text-center pb-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Canje Validado</CardTitle>
                <CardDescription>
                    Se ha verificado la identidad del estudiante y el beneficio ha sido marcado como usado.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
                <div className="flex w-full flex-col sm:flex-row items-center gap-6">
                    <Avatar className="h-32 w-32 rounded-full border-4 border-primary">
                        <AvatarImage src={profile.photoURL} alt={profile.username} />
                        <AvatarFallback className="text-4xl">{userInitial}</AvatarFallback>
                    </Avatar>
                     <div className="space-y-3 text-left w-full">
                        <p className="text-lg font-semibold text-foreground">{profile.firstName} {profile.lastName}</p>
                        <div className="flex items-center gap-3">
                            <Fingerprint className="h-5 w-5 text-muted-foreground" />
                            <p className="text-md text-muted-foreground">{redemption.userDni}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <University className="h-5 w-5 text-muted-foreground" />
                            <p className="text-md text-muted-foreground">{profile.university || 'No especificada'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Award className="h-5 w-5 text-muted-foreground" />
                            <p className="text-md text-muted-foreground">{profile.points} Puntos</p>
                        </div>
                    </div>
                </div>
                <div className='w-full border-t pt-4 space-y-2'>
                    <div className='flex items-center gap-2 text-sm'>
                        <Tag className='h-4 w-4 text-primary'/>
                        <span className="font-medium text-foreground">{redemption.benefitTitle}</span>
                    </div>
                     <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                        <Building className='h-4 w-4'/>
                        <span>Canjeado en: {redemption.supplierName}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={onScanAgain}>Escanear Otro Código</Button>
            </CardFooter>
        </Card>
    );
}

interface QrScannerProps {
    userIsAdmin?: boolean;
}

// Main component
export default function QrScanner({ userIsAdmin = false }: QrScannerProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationData, setValidationData] = useState<ValidationData | null>(null);

    const stopScanner = () => {
        if (scannerRef.current?.isScanning) {
            scannerRef.current.stop().then(() => {
                setIsScanning(false);
            }).catch(err => {
                console.error("Failed to stop scanner", err);
            });
        }
    };

    const handleScanSuccess = async (decodedText: string, result: Html5QrcodeResult) => {
        if (isProcessing) return;

        setIsProcessing(true);
        setScanError(null);
        stopScanner();

        try {
            const { redemptionId } = JSON.parse(decodedText);
            if (!redemptionId) throw new Error("Código QR inválido. No contiene un ID de canje.");
            if (!user) throw new Error("Debes estar autenticado para validar un canje.");

            const redemptionRef = doc(firestore, "benefitRedemptions", redemptionId);
            const redemptionSnap = await getDoc(redemptionRef);

            if (!redemptionSnap.exists()) {
                throw new Error("Canje no encontrado. El código QR es inválido o ha expirado.");
            }

            const redemptionData = redemptionSnap.data() as BenefitRedemption;
            const supplierId = redemptionData.supplierId;

            // Admin can validate any redemption. Supplier can only validate their own.
            if (supplierId !== user.uid && !userIsAdmin) {
                 throw new Error("Este canje no pertenece a tu comercio. No puedes validarlo.");
            }

            if (redemptionData.status !== "pending") {
                throw new Error(`Este canje ya ha sido utilizado el ${redemptionData.usedAt ? (redemptionData.usedAt as any).toDate().toLocaleString('es-ES') : 'N/A'}.`);
            }
            
            // Fetch user profile to display
            const userProfileRef = doc(firestore, "users", redemptionData.userId);
            const userProfileSnap = await getDoc(userProfileRef);
            if (!userProfileSnap.exists()) {
                throw new Error("No se encontró el perfil del usuario asociado a este canje.");
            }
            const userProfileData = userProfileSnap.data() as UserProfile;

            // Perform write operations
            const batch = writeBatch(firestore);
            const userRedemptionRef = doc(firestore, 'users', redemptionData.userId, 'redeemed_benefits', redemptionId);

            const updateData = { status: 'used' as const, usedAt: serverTimestamp() };
            batch.update(redemptionRef, updateData);
            batch.update(userRedemptionRef, updateData); // Also update the user's private copy

            await batch.commit();

            // Set data for result view
            setValidationData({ redemption: redemptionData, profile: userProfileData });
            
            toast({ title: "¡Canje exitoso!", description: "El beneficio ha sido marcado como usado." });

        } catch (e: any) {
             console.error("Scan validation error:", e);
             setScanError(e.message || "Ocurrió un error al validar el canje.");
             toast({ variant: 'destructive', title: "Error de validación", description: e.message });
             // Allow user to try again after error
             setIsProcessing(false);
        }
    };

    const handleScanError = (errorMessage: string, error: Html5QrcodeError) => {
       if (!errorMessage.includes("NotFoundException")) {
           setScanError("Hubo un problema con la cámara. Intenta recargar la página.");
           console.error(`QR Scan Error: ${errorMessage}`, error);
           stopScanner();
       }
    };

    // Effect to initialize and start the scanner
    useEffect(() => {
        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode('qr-reader', { verbose: false });
        }

        const start = async () => {
            if (scannerRef.current && !scannerRef.current.isScanning && !validationData) {
                setScanError(null);
                try {
                    await scannerRef.current.start(
                        { facingMode: "environment" },
                        { fps: 10, qrbox: qrboxFunction, aspectRatio: 1.0 },
                        handleScanSuccess,
                        handleScanError
                    );
                    setIsScanning(true);
                } catch (err: any) {
                    setScanError("No se pudo iniciar la cámara. Revisa los permisos en tu navegador.");
                    console.error("Camera start error:", err);
                }
            }
        };

        start();

        // Cleanup on component unmount
        return () => {
            stopScanner();
        };
    }, [validationData]); // Restart scanner when validationData is cleared

    const handleReset = () => {
        setValidationData(null);
        setIsProcessing(false);
        setScanError(null);
    };

    if (validationData) {
        return <ValidationResult data={validationData} onScanAgain={handleReset} />;
    }

    return (
         <Card>
            <CardContent className="p-4 relative aspect-square flex items-center justify-center">
                <div id="qr-reader" className="w-full h-full rounded-lg overflow-hidden" />
                
                {!isScanning && !scanError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 rounded-lg">
                        <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                        <p className="mt-4 text-muted-foreground">Iniciando cámara...</p>
                    </div>
                )}
                
                 {scanError && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 p-4">
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                {scanError}
                            </AlertDescription>
                        </Alert>
                         <Button className="w-full mt-4" onClick={handleReset}>Intentar de Nuevo</Button>
                     </div>
                )}
            </CardContent>
        </Card>
    );
}
