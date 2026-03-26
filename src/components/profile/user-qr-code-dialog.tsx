
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { IDCard } from './id-card';
import { useFirestore, useDocOnce } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/types/data';

interface UserQRCodeDialogProps {
  userId: string;
  username: string;
  children: React.ReactNode;
}

export default function UserQRCodeDialog({ userId, username, children }: UserQRCodeDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const firestore = useFirestore();
  const userProfileRef = doc(firestore, 'users', userId);
  const { data: userProfile, isLoading: isProfileLoading } = useDocOnce<UserProfile>(userProfileRef);

  useEffect(() => {
    // We need to check for window to ensure this code only runs on the client
    if (typeof window !== 'undefined') {
        const verificationUrl = `${window.location.origin}/verify?userId=${userId}`;
        import('qrcode').then(QRCode => {
            QRCode.toDataURL(verificationUrl, {
                errorCorrectionLevel: 'H',
                width: 256,
                margin: 1,
                color: {
                  dark: '#000000',
                  light: '#ffffff',
                }
            })
            .then(url => {
                setQrCodeUrl(url);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
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
        <div className="my-4 flex justify-center w-full overflow-hidden">
          {isProfileLoading ? (
            <Skeleton className="h-[400px] w-full max-w-[340px] rounded-[2.2rem]" />
          ) : userProfile ? (
            <IDCard 
              userProfile={userProfile} 
              qrCodeUrl={qrCodeUrl} 
              isLoading={isLoading} 
            />
          ) : (
            <p className="text-destructive">No se pudo cargar el perfil para la ID Card.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
