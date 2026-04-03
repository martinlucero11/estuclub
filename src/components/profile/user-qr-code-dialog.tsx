
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
  const [open, setOpen] = useState(false);

  const firestore = useFirestore();
  const userProfileRef = doc(firestore, 'users', userId);
  const { data: userProfile, isLoading: isProfileLoading } = useDocOnce<UserProfile>(userProfileRef);

  useEffect(() => {
    // We need to check for window to ensure this code only runs on the client
    if (typeof window !== 'undefined' && userProfile) {
        // Enrich QR with more info as requested
        const params = new URLSearchParams({
          userId: userId,
          dni: userProfile.dni || '',
          level: (userProfile.level || 1).toString(),
          name: `${userProfile.firstName} ${userProfile.lastName}`,
          username: userProfile.username
        });
        
        const verificationUrl = `${window.location.origin}/verify?${params.toString()}`;
        
        import('qrcode').then(QRCode => {
            QRCode.toDataURL(verificationUrl, {
                errorCorrectionLevel: 'H',
                width: 512,
                margin: 2,
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
  }, [userId, userProfile]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden overflow-visible">
        <DialogTitle className="sr-only">ID Card de {userProfile?.username}</DialogTitle>
        <div className="flex justify-center w-full overflow-visible py-12">
          {isProfileLoading ? (
            <Skeleton className="h-[520px] w-[330px] rounded-[2.5rem] bg-white/5" />
          ) : userProfile ? (
            <IDCard 
              userProfile={userProfile} 
              qrCodeUrl={qrCodeUrl} 
              isLoading={isLoading} 
              onClose={() => setOpen(false)}
            />
          ) : (
            <p className="text-destructive">No se pudo cargar el perfil.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

