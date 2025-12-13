
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '../ui/badge';
import type { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Calendar, CheckCircle, Ticket, XCircle } from 'lucide-react';

interface RedeemedBenefit {
    id: string;
    benefitTitle: string;
    redeemedAt: Timestamp;
    points: number;
    status: 'valid' | 'used';
    userId: string;
}

interface RedeemedBenefitDialogProps {
  benefit: RedeemedBenefit;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RedeemedBenefitDialog({ benefit, isOpen, onOpenChange }: RedeemedBenefitDialogProps) {
  const formattedDate = benefit.redeemedAt 
        ? new Date(benefit.redeemedAt.seconds * 1000).toLocaleString('es-ES', {
            dateStyle: 'long',
            timeStyle: 'short'
        })
        : 'Fecha desconocida';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Detalle del Canje
                </DialogTitle>
                <DialogDescription>
                    {benefit.benefitTitle}
                </DialogDescription>
            </DialogHeader>

            <div className='py-4 space-y-4'>
                <p className='text-sm text-muted-foreground'>Aquí puedes ver la información del beneficio que canjeaste.</p>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className='space-y-0.5'>
                        <p className="text-sm font-medium">Estado</p>
                    </div>
                    <Badge variant={benefit.status === 'valid' ? 'default' : 'destructive'} className={cn(
                        benefit.status === 'valid' && 'bg-green-600'
                    )}>
                        {benefit.status === 'valid' ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                        {benefit.status === 'valid' ? 'Válido' : 'Utilizado'}
                    </Badge>
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className='space-y-0.5'>
                        <p className="text-sm font-medium">Fecha de Canje</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formattedDate}</span>
                    </div>
                </div>
            </div>

            <DialogFooter>
                {/* Footer can be used for actions in the future */}
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
