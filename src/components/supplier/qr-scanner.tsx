'use client';

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeResult } from 'html5-qrcode';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CheckCircle, Fingerprint, Loader2, University, XCircle, Award, Building, Tag, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import type { BenefitRedemption } from '@/types/data';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';

// User profile structure
interface UserProfile {
    id: string;
    username: string;
    photoURL?: string;
    university: string;
    points: number;
    firstName: string;
    lastName: string;
    dni: string;
    level?: number;
}

// Validation data structure
interface ValidationData {
    type: 'redemption' | 'appointment' | 'profile';
    redemption?: BenefitRedemption;
    appointment?: any;
    profile: UserProfile;
}

const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number): any => {
    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
    const qrboxSize = Math.floor(minEdge * 0.8);
    return { width: qrboxSize, height: qrboxSize };
};

// Validation Result Component
function ValidationResult({ data, onScanAgain, alreadyUsed }: { data: ValidationData, onScanAgain: () => void, alreadyUsed: boolean }) {
    const { type, redemption, appointment, profile } = data;

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center bg-background/90 p-4">
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Error de Datos</AlertTitle>
                    <AlertDescription>No se pudieron cargar los detalles. Por favor, intenta de nuevo.</AlertDescription>
                </Alert>
                <Button className="w-full mt-4" onClick={onScanAgain}>Escanear de Nuevo</Button>
            </div>
        );
    }

    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    const userInitial = profile.firstName ? profile.firstName.charAt(0).toUpperCase() : 'U';

    return (
        <Card className="w-full max-w-md mx-auto overflow-hidden border-2 border-primary/20">
            <CardHeader className="text-center pb-6 bg-muted/30">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4 shadow-inner">
                    {type === 'redemption' ? <Tag className="h-8 w-8 text-primary" /> : 
                     type === 'appointment' ? <CheckCircle className="h-8 w-8 text-primary" /> : 
                     <Fingerprint className="h-8 w-8 text-primary" />}
                </div>
                <CardTitle className="text-2xl font-black">
                    {type === 'redemption' ? (alreadyUsed ? 'Canje Ya Usado' : 'Canje Validado') :
                     type === 'appointment' ? 'Turno Verificado' : 'Identidad Verificada'}
                </CardTitle>
                <CardDescription className="font-medium text-muted-foreground/80">
                    {type === 'redemption' ? (alreadyUsed ? 'Este beneficio ya fue utilizado.' : 'El beneficio se marcó como usado.') :
                     type === 'appointment' ? 'El turno del estudiante es válido.' : 'Estudiante verificado en el sistema.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 flex flex-col items-center space-y-8">
                <div className="flex w-full flex-col items-center gap-6">
                    <div className="relative group">
                        <div className="absolute -inset-1 blur-lg opacity-20 bg-primary rounded-full group-hover:opacity-40 transition-opacity" />
                        <Avatar className="h-28 w-28 rounded-full border-4 border-background shadow-2xl relative">
                            <AvatarImage src={profile.photoURL} alt={profile.username} className="object-cover" />
                            <AvatarFallback className="text-3xl font-black bg-primary/5 text-primary">{userInitial}</AvatarFallback>
                        </Avatar>
                    </div>
                    
                    <div className="text-center space-y-1">
                        <p className="text-xl font-black tracking-tight">{fullName}</p>
                        <p className="text-sm font-bold text-primary tracking-widest uppercase">@{profile.username}</p>
                    </div>

                    <div className="grid grid-cols-1 w-full gap-3 pt-4">
                        <div className="flex items-center gap-4 p-3 rounded-2xl bg-muted/50 border border-border/50">
                            <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center shadow-sm">
                                <University className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Institución</p>
                                <p className="text-sm font-bold">{profile.university || 'No especificada'}</p>
                            </div>
                        </div>

                        {type === 'profile' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shadow-sm">
                                        <Fingerprint className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 leading-none mb-1">DNI</p>
                                        <p className="text-sm font-bold">{profile.dni || '---'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shadow-sm">
                                        <Award className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 leading-none mb-1">Nivel</p>
                                        <p className="text-sm font-bold">{profile.level || 1}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {type === 'redemption' && redemption && (
                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shadow-sm">
                                    <Tag className="h-4 w-4 text-primary" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 leading-none mb-1">Beneficio</p>
                                    <p className="text-sm font-bold truncate max-w-[200px]">{redemption.benefitTitle}</p>
                                </div>
                            </div>
                        )}

                        {type === 'appointment' && appointment && (
                            <div className="flex items-center gap-4 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shadow-sm">
                                    <Building className="h-4 w-4 text-primary" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 leading-none mb-1">Servicio</p>
                                    <p className="text-sm font-bold">{appointment.serviceName}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="pt-4 pb-8">
                <Button className="w-full h-12 rounded-2xl font-black text-sm tracking-widest uppercase shadow-lg shadow-primary/20" onClick={onScanAgain}>
                    Listo
                </Button>
            </CardFooter>
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
    const [manualId, setManualId] = useState('');

    const handleScanSuccess = async (decodedText: string, result: Html5QrcodeResult) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setScanError(null);
        setWasAlreadyUsed(false);

        try {
            if (scannerRef.current?.isScanning) {
                await scannerRef.current.stop();
            }
            
            let type: 'redemption' | 'appointment' | 'profile' = 'redemption';
            let id = '';
            
            // 1. Detect QR Type
            try {
                // Check if it's a verification URL (ID Card)
                const url = new URL(decodedText);
                if (url.pathname.includes('/verify') && url.searchParams.get('userId')) {
                    type = 'profile';
                    id = url.searchParams.get('userId')!;
                }
            } catch (e) {
                // Not a URL, try JSON
                try {
                    const jsonData = JSON.parse(decodedText);
                    if (jsonData.redemptionId) {
                        type = 'redemption';
                        id = jsonData.redemptionId;
                    } else if (jsonData.appointmentId) {
                        type = 'appointment';
                        id = jsonData.appointmentId;
                    } else {
                        throw new Error("Formato de código QR no reconocido.");
                    }
                } catch (jsonError) {
                    throw new Error("El formato del código QR o ID es incorrecto.");
                }
            }

            if (!user) throw new Error("Debes iniciar sesión para realizar validaciones.");

            let finalValidationData: ValidationData;

            if (type === 'redemption') {
                const redemptionRef = doc(firestore, "benefitRedemptions", id);
                const redemptionSnap = await getDoc(redemptionRef);
                if (!redemptionSnap.exists()) throw new Error("Canje no encontrado.");

                const redemptionData = redemptionSnap.data() as BenefitRedemption;
                if (redemptionData.supplierId !== user.uid && !userIsAdmin) throw new Error("No tienes permiso para validar este canje.");
                
                const userProfileRef = doc(firestore, "users", redemptionData.userId);
                const userProfileSnap = await getDoc(userProfileRef);
                if (!userProfileSnap.exists()) throw new Error("Perfil del estudiante no encontrado.");

                const userProfileData = userProfileSnap.data() as UserProfile;
                finalValidationData = { type, redemption: { ...redemptionData, id }, profile: userProfileData };
                
                if (redemptionData.status === "pending") {
                    const batch = writeBatch(firestore);
                    const updateData = { status: 'used' as const, usedAt: serverTimestamp() };
                    batch.set(redemptionRef, updateData, { merge: true });
                    
                    const userRedemptionRef = doc(firestore, 'users', redemptionData.userId, 'redeemed_benefits', id);
                    batch.set(userRedemptionRef, updateData, { merge: true });

                    if (redemptionData.pointsGranted && redemptionData.pointsGranted > 0) {
                        const userRef = doc(firestore, 'users', redemptionData.userId);
                        batch.set(userRef, { points: increment(redemptionData.pointsGranted) }, { merge: true });
                    }
                    await batch.commit();
                    toast({ title: "¡Canje exitoso!" });
                } else {
                    setWasAlreadyUsed(true);
                }
            } else if (type === 'appointment') {
                const appointmentRef = doc(firestore, "appointments", id);
                const appointmentSnap = await getDoc(appointmentRef);
                if (!appointmentSnap.exists()) throw new Error("Turno no encontrado.");

                const appointmentData = appointmentSnap.data() as any;
                if (appointmentData.supplierId !== user.uid && !userIsAdmin) throw new Error("No tienes permiso para validar este turno.");

                const userProfileRef = doc(firestore, "users", appointmentData.userId);
                const userProfileSnap = await getDoc(userProfileRef);
                if (!userProfileSnap.exists()) throw new Error("Perfil del estudiante no encontrado.");

                finalValidationData = { type, appointment: appointmentData, profile: userProfileSnap.data() as UserProfile };
                toast({ title: "Turno verificado" });
            } else {
                // Profile type
                const userProfileRef = doc(firestore, "users", id);
                const userProfileSnap = await getDoc(userProfileRef);
                if (!userProfileSnap.exists()) throw new Error("Perfil de usuario no encontrado.");
                
                finalValidationData = { type, profile: userProfileSnap.data() as UserProfile };
                toast({ title: "Usuario verificado" });
            }

            setValidationData(finalValidationData);

        } catch (e: any) {
            console.error("[VALIDATION ERROR]:", e);
            const errorMessage = e instanceof Error ? e.message : "Error desconocido.";
            setScanError(errorMessage);
            toast({ variant: 'destructive', title: "Error", description: errorMessage });
            setIsProcessing(false);
        }
    };
    
    const handleManualValidation = async () => {
        if (!manualId.trim()) {
            toast({
                variant: 'destructive',
                title: 'ID Inválido',
                description: 'Por favor, ingresa un ID.',
            });
            return;
        }
        
        // Try multiple formats for manual entry
        // First try as redemptionId
        const redemptionJson = JSON.stringify({ redemptionId: manualId.trim() });
        await handleScanSuccess(redemptionJson, {} as Html5QrcodeResult);
    };

    const handleScanError = (errorMessage: string) => {
        const isNormalScanningError = errorMessage.includes("NotFoundException") || errorMessage.includes("No MultiFormat Readers were able to detect the code");
        if (isNormalScanningError || isProcessing) return; // Silently ignore normal scan misses

        if (!scanError) {
            setScanError("Ocurrió un error con el escáner. Intenta recargar la página.");
            console.error(`[QR SCANNER UNHANDLED ERROR]: ${errorMessage}`);
        }
    };

    useEffect(() => {
        if (validationData || scanError || isProcessing) return;

        const qrCodeElementId = 'qr-reader';
        const existingElement = document.getElementById(qrCodeElementId);
        if (!existingElement) return;

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
            } catch (err) {
                console.error("[QR START ERROR]:", err);
                let message = "No se pudo iniciar la cámara.";
                if (err instanceof Error) {
                     if (err.name === 'NotAllowedError') message = 'Permiso de cámara denegado. Habilítalo en tu navegador.';
                     else if (err.name === 'NotFoundError') message = 'No se encontró una cámara trasera. Conecta una para continuar.';
                     else if (err.name === 'NotReadableError') message = 'La cámara ya está en uso por otra aplicación.';
                }
                setScanError(message);
            }
        };

        startScanner();

        return () => {
            isCancelled = true;
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(e => console.error("[QR STOP ERROR]:", e));
            }
        };
    }, [validationData, scanError, isProcessing]);

    const handleReset = () => {
        setValidationData(null);
        setIsProcessing(false);
        setScanError(null);
        setWasAlreadyUsed(false);
        setManualId('');
    };

    if (validationData) {
        return <ValidationResult data={validationData} onScanAgain={handleReset} alreadyUsed={wasAlreadyUsed} />;
    }

    return (
        <div className="space-y-6 w-full max-w-md mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Escanear Código QR</CardTitle>
                    <CardDescription>Apunta la cámara al código del estudiante para validarlo.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 relative aspect-square flex items-center justify-center">
                    <div id="qr-reader" className="w-full h-full rounded-lg overflow-hidden bg-muted" />
                    {scanError ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 p-4 text-center">
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{scanError}</AlertDescription>
                            </Alert>
                            <Button className="w-full mt-4" onClick={handleReset}>Volver a Intentar</Button>
                        </div>
                    ) : isProcessing ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            <p className="mt-4 text-lg font-semibold text-foreground">Validando...</p>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-white">
                           <div className="p-3 bg-black/[.56] rounded-lg backdrop-blur-sm">
                               <p className="text-5xl">📷</p>
                           </div>
                           <p className="mt-4 font-bold text-shadow" style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>Buscando código QR...</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Validación Manual</CardTitle>
                    <CardDescription>Si el escáner no funciona, ingresa el ID del comprobante aquí.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex w-full items-center space-x-2">
                        <Input
                            id="manual-id"
                            value={manualId}
                            onChange={(e) => setManualId(e.target.value)}
                            placeholder="ID de la transacción..."
                            disabled={isProcessing}
                            onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleManualValidation()}
                        />
                        <Button onClick={handleManualValidation} disabled={isProcessing || !manualId}>
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validar"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
