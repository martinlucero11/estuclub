
'use client';

import { useEffect, useState } from 'react';
import { Html5Qrcode, Html5QrcodeResult } from 'html5-qrcode';
import { useFirestore, useUser } from '@/firebase';
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CameraOff, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import type { BenefitRedemption } from '@/lib/data';

const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
    const qrboxSize = Math.floor(minEdge * 0.7);
    return {
        width: qrboxSize,
        height: qrboxSize,
    };
}

export default function QrScanner() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        let html5QrCode: Html5Qrcode | undefined;

        const startScanner = async () => {
             if (isScanning || typeof window === 'undefined') return;
            
            try {
                const cameras = await Html5Qrcode.getCameras();
                if (cameras && cameras.length) {
                    html5QrCode = new Html5Qrcode('qr-reader');
                    setIsScanning(true);
                    setScanResult(null);

                    html5QrCode.start(
                        { facingMode: "environment" },
                        {
                            fps: 10,
                            qrbox: qrboxFunction,
                            aspectRatio: 1.0,
                        },
                        handleScanSuccess,
                        handleScanError
                    );
                } else {
                    setScanResult({ type: 'error', message: 'No se encontraron cámaras en este dispositivo.' });
                }
            } catch (err) {
                 console.error("Camera permission error:", err);
                 setScanResult({ type: 'error', message: 'No se pudo acceder a la cámara. Revisa los permisos en tu navegador.' });
            }
        };

        const stopScanner = () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                    setIsScanning(false);
                }).catch(err => console.error("Error stopping scanner", err));
            }
        };

        startScanner();

        return () => {
           stopScanner();
        };
    }, []); // Run once on mount

    const handleScanSuccess = async (decodedText: string, result: Html5QrcodeResult) => {
        if (isProcessing) return; // Prevent double scanning

        setIsProcessing(true);
        setScanResult({ type: 'info', message: 'Procesando código QR...' });

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
            
            if (redemptionData.supplierId !== user.uid) {
                throw new Error("Este canje no pertenece a tu comercio. No puedes validarlo.");
            }

            if (redemptionData.status !== "pending") {
                throw new Error(`Este canje ya ha sido utilizado el ${redemptionData.usedAt ? new Date(redemptionData.usedAt.toDate()).toLocaleString() : 'N/A'}.`);
            }
            
            const batch = writeBatch(firestore);
            
            const updateData = {
                status: 'used' as const,
                usedAt: serverTimestamp()
            };
            
            batch.update(redemptionRef, updateData);

            await batch.commit();

            setScanResult({ type: 'success', message: `Canje de "${redemptionData.benefitTitle}" para ${redemptionData.userName} validado con éxito.` });
            toast({ title: "¡Canje exitoso!", description: "El beneficio ha sido marcado como usado." });

        } catch (e: any) {
             console.error("Scan validation error:", e);
             setScanResult({ type: 'error', message: e.message || "Ocurrió un error al validar el canje." });
             toast({ variant: 'destructive', title: "Error de validación", description: e.message });
        } finally {
            // Wait a bit before allowing another scan
            setTimeout(() => setIsProcessing(false), 3000);
        }
    };

    const handleScanError = (errorMessage: string, error: any) => {
       // Ignore common errors like "QR code not found"
       if (!errorMessage.includes("NotFoundException")) {
           console.error(`QR Scan Error: ${errorMessage}`);
       }
    };

    return (
        <Card>
            <CardContent className="p-4">
                <div id="qr-reader" className="w-full bg-muted rounded-lg aspect-square" style={{ display: isScanning ? 'block' : 'none' }}></div>
                
                {!isScanning && !scanResult && (
                    <div className="flex flex-col items-center justify-center aspect-square bg-muted rounded-lg">
                        <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                        <p className="mt-4 text-muted-foreground">Iniciando cámara...</p>
                    </div>
                )}
                
                {scanResult && (
                     <div className="mt-4">
                        <Alert variant={scanResult.type === 'error' ? 'destructive' : 'default'}>
                            {scanResult.type === 'success' && <CheckCircle className="h-4 w-4" />}
                            {scanResult.type === 'error' && <XCircle className="h-4 w-4" />}
                            {scanResult.type === 'info' && <Loader2 className="h-4 w-4 animate-spin" />}
                            <AlertTitle>
                                {scanResult.type === 'success' && 'Validación Exitosa'}
                                {scanResult.type === 'error' && 'Error de Validación'}
                                {scanResult.type === 'info' && 'Procesando...'}
                            </AlertTitle>
                            <AlertDescription>
                                {scanResult.message}
                            </AlertDescription>
                        </Alert>
                         <Button className="w-full mt-4" onClick={() => setScanResult(null)} disabled={isProcessing}>
                            Escanear de Nuevo
                        </Button>
                     </div>
                )}
            </CardContent>
        </Card>
    )
}
