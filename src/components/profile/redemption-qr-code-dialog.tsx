
'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '../ui/skeleton';
import type { SerializableBenefitRedemption } from '@/lib/data';
import { useUser } from '@/firebase';

interface RedemptionQRCodeDialogProps {
  redemption: SerializableBenefitRedemption;
  children: React.ReactNode;
}

export default function RedemptionQRCodeDialog({ redemption, children }: RedemptionQRCodeDialogProps) {
  const { user } = useUser();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // We need to check for window to ensure this code only runs on the client
    if (typeof window !== 'undefined' && user) {
        // Construct the URL for the merchant to validate the redemption
        const validationUrl = `${window.location.origin}/redeem?redemptionId=${redemption.id}&userId=${user.uid}`;
        
        setIsLoading(true);
        QRCode.toDataURL(validationUrl, {
            errorCorrectionLevel: 'H',
            width: 256,
        })
        .then(url => {
            setQrCodeUrl(url);
        })
        .catch(err => {
            console.error("QR Code Generation Error:", err);
        })
        .finally(() => {
            setIsLoading(false);
        });
    }
  }, [redemption.id, user]);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Canje: {redemption.benefitTitle}</DialogTitle>
          <DialogDescription>
            Muestra este código QR al proveedor para validar tu beneficio.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 flex justify-center">
          {isLoading && <Skeleton className="h-64 w-64 rounded-lg" />}
          {!isLoading && qrCodeUrl && (
            <img src={qrCodeUrl} alt={`Código QR para ${redemption.benefitTitle}`} className="mx-auto" />
          )}
          {!isLoading && !qrCodeUrl && (
            <p className="text-destructive">No se pudo generar el código QR.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

