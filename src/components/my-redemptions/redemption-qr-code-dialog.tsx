
'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { QrCode, Ticket } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

// --- Ticket Shape Components ---
const TicketCutout = () => (
  <div className="absolute -top-3 -left-3 -right-3 flex justify-between">
    <div className="h-6 w-6 rounded-full bg-background" />
    <div className="h-6 w-6 rounded-full bg-background" />
  </div>
);

const TicketSeparator = () => (
  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex items-center">
      <div className="h-px w-full bg-dashed-line" />
  </div>
);

const Barcode = () => (
    <div className="flex h-8 w-full items-center justify-center gap-px overflow-hidden">
        {[...Array(60)].map((_, i) => {
            const height = Math.random() * 70 + 30; // Random height between 30% and 100%
            return <div key={i} className="w-px bg-slate-400" style={{ height: `${height}%` }} />
        })}
    </div>
);

// --- Main Dialog Component ---
interface RedemptionQRCodeDialogProps {
  redemptionId: string;
  qrCodeValue: string;
  benefitTitle: string;
  supplierName: string;
}

export default function RedemptionQRCodeDialog({ 
  redemptionId, 
  qrCodeValue, 
  benefitTitle,
  supplierName
}: RedemptionQRCodeDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!qrCodeValue) return;

    QRCode.toDataURL(qrCodeValue, {
        errorCorrectionLevel: 'H',
        width: 512, // Higher resolution for clarity
        margin: 2,
        color: {
            dark: '#FFFFFF',
            light: '#1e293b' // bg-slate-800
        }
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
        <Button variant="default" size="sm">
            <Ticket className="mr-2 h-4 w-4"/>
            Ver Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs bg-transparent border-none shadow-none">
        <div className="bg-slate-800 text-slate-50 rounded-2xl overflow-hidden shadow-2xl aspect-[9/16] flex flex-col items-center justify-center relative p-6">
            <TicketCutout />
            
            {/* --- Top Part --- */}
            <div className="z-10 w-full flex-1 flex flex-col items-center justify-center text-center space-y-2 pb-6">
                <p className="text-sm uppercase tracking-widest text-slate-400">Beneficio Exclusivo</p>
                <h2 className="text-2xl font-bold leading-tight">{benefitTitle}</h2>
                <p className="text-amber-400">de {supplierName}</p>
            </div>

            <TicketSeparator />

            {/* --- Bottom Part --- */}
            <div className="z-10 w-full flex-1 flex flex-col items-center justify-center pt-6">
                <div className="bg-white p-2 rounded-lg shadow-md">
                    {qrCodeUrl ? (
                        <Image src={qrCodeUrl} alt={`Código QR para ${benefitTitle}`} width={180} height={180} />
                    ) : (
                        <Skeleton className="h-[180px] w-[180px] rounded-lg" />
                    )}
                </div>
                 <p className="mt-4 text-lg font-semibold uppercase tracking-wider">Escanéame</p>
                 <p className="text-xs text-slate-400 font-mono mt-2">ID: {redemptionId}</p>
                <div className='flex-grow' />
                 <Barcode />
            </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
