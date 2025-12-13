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

interface UserQRCodeDialogProps {
  userId: string;
  username: string;
  children: React.ReactNode;
}

export default function UserQRCodeDialog({ userId, username, children }: UserQRCodeDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // We need to check for window to ensure this code only runs on the client
    if (typeof window !== 'undefined') {
        const verificationUrl = `${window.location.origin}/verify?userId=${userId}`;
        QRCode.toDataURL(verificationUrl, {
            errorCorrectionLevel: 'H',
            width: 256,
        })
        .then(url => {
            setQrCodeUrl(url);
            setIsLoading(false);
        })
        .catch(err => {
            console.error(err);
            setIsLoading(false);
        });
    }
  }, [userId]);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>ID Card de @{username}</DialogTitle>
          <DialogDescription>
            Este es tu código QR personal. Los proveedores pueden escanearlo para verificar tu identidad.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 flex justify-center">
          {isLoading && <Skeleton className="h-64 w-64" />}
          {!isLoading && qrCodeUrl && (
            <img src={qrCodeUrl} alt={`Código QR de ${username}`} className="mx-auto" />
          )}
          {!isLoading && !qrCodeUrl && (
            <p className="text-destructive">No se pudo generar el código QR.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
