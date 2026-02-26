
'use client';

import QrScanner from '@/components/supplier/qr-scanner';
import { useAdmin } from '@/firebase/auth/use-admin';
import { PageHeader } from '@/components/ui/page-header';

export default function ScannerPage() {
    const { isAdmin } = useAdmin();
    
    return (
        <div className="space-y-4 p-4 md:p-8">
            <PageHeader title="Escanear QR" />
             <p className="text-muted-foreground -mt-8 mb-8 text-center">
                Valida un canje o ingresa el ID manualmente.
            </p>
            <div className="flex justify-center pt-4">
                <QrScanner userIsAdmin={isAdmin} />
            </div>
        </div>
    );
}
