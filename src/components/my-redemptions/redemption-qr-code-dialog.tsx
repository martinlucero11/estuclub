
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
import { Button } from '../ui/button';
import { QrCode } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface RedemptionQRCodeDialogProps {
  redemptionId: string;
  qrCodeValue: string;
}

export default function RedemptionQRCodeDialog({ redemptionId, qrCodeValue }: RedemptionQRCodeDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!qrCodeValue) return;

    QRCode.toDataURL(qrCodeValue, {
        errorCorrectionLevel: 'H',
        width: 256,
    })
    .then(url => {
        setQrCodeUrl(url);
    })
    .catch(err => {
        console.error("QR Code Generation Error:", err);
    });
  }, [qrCodeValue]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
            <QrCode className="mr-2 h-4 w-4"/>
            Ver QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Código de Canje</DialogTitle>
          <DialogDescription>
            Muestra este código QR en el comercio para validar tu beneficio.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 flex justify-center">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt={`Código QR para el canje ${redemptionId}`} />
          ) : (
            <Skeleton className="h-64 w-64 rounded-lg" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
