
'use client';

import { Card } from '@/components/ui/card';
import { History, QrCode } from 'lucide-react';
import { SerializableBenefitRedemption } from '@/lib/data';
import RedemptionQRCodeDialog from './redemption-qr-code-dialog';

interface MyRedemptionsListProps {
    redemptions: SerializableBenefitRedemption[];
}

export default function MyRedemptionsList({ redemptions }: MyRedemptionsListProps) {

    if (!redemptions || redemptions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
                <History className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No has canjeado beneficios</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Explora los beneficios disponibles y canjea uno para empezar a sumar puntos.
                </p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {redemptions.map(redemption => {
                 const redeemedDate = new Date(redemption.redeemedAt);

                return (
                <Card key={redemption.id} className="p-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div className="md:col-span-2">
                             <p className="font-semibold text-foreground text-lg">{redemption.benefitTitle}</p>
                             <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span>Canjeado el {redeemedDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} a las {redeemedDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs</span>
                            </div>
                        </div>
                        
                        <div className="md:col-span-1 flex justify-start md:justify-end">
                            <RedemptionQRCodeDialog redemption={redemption}>
                                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                    <QrCode className="mr-2 h-4 w-4" />
                                    Ver QR
                                </button>
                            </RedemptionQRCodeDialog>
                        </div>
                     </div>
                </Card>
            )})}
        </div>
    )
}
