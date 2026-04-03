
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { useAuthService } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export function ZombieCleanup() {
  const [isScanning, setIsScanning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [report, setReport] = useState<any>(null);
  const { toast } = useToast();

  const auth = useAuthService();
  const runCleanup = async (confirm: boolean = false) => {
    const user = auth.currentUser;
    if (!user) return;

    if (confirm) setIsDeleting(true);
    else setIsScanning(true);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/admin/cleanup-zombies?confirm=${confirm}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error en el servidor');

      setReport(data);
      
      if (confirm) {
        toast({
          title: "Limpieza completada",
          description: `Se eliminaron ${data.summary.deleted} cuentas sin perfil.`,
        });
      } else {
        toast({
          title: "Escaneo completado",
          description: `Se encontraron ${data.summary.zombiesFound} cuentas sin perfil.`,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message
      });
    } finally {
      setIsScanning(false);
      setIsDeleting(false);
    }
  };

  return (
    <Card className="rounded-3xl border-red-500/10 bg-red-500/5 overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/10 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <CardTitle className="text-xl font-black uppercase tracking-tighter">Limpieza de Cuentas Zombie</CardTitle>
        </div>
        <CardDescription className="text-sm font-medium">
          Busca y elimina usuarios de Auth que no tienen un perfil de usuario en Firestore (creados por errores de registro anteriores).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Button 
            onClick={() => runCleanup(false)} 
            disabled={isScanning || isDeleting}
            variant="outline"
            className="flex-1 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]"
          >
            {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Escanear
          </Button>
          
          <Button 
            onClick={() => {
                if(confirm('¿Estás seguro de que deseas eliminar permanentemente estas cuentas? Esta acción no se puede deshacer.')) {
                    runCleanup(true);
                }
            }} 
            disabled={isScanning || isDeleting || (report?.summary.zombiesFound === 0 && !isDeleting)}
            variant="destructive"
            className="flex-1 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20"
          >
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Eliminar Zombies
          </Button>
        </div>

        {report && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Reporte de Mantenimiento</span>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <p className="text-2xl font-black">{report.summary.totalAuthUsers}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">Total Auth</p>
                </div>
                <div className="text-center text-red-400">
                    <p className="text-2xl font-black">{report.summary.zombiesFound}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">Zombies</p>
                </div>
                <div className="text-center text-green-400">
                    <p className="text-2xl font-black">{report.summary.deleted}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">Borrados</p>
                </div>
            </div>

            {report.zombies.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 px-1">Cuentas Identificadas:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                        {report.zombies.map((z: string, i: number) => (
                            <div key={i} className="text-[10px] font-medium p-2 bg-black/20 rounded-lg border border-white/5 truncate">
                                {z}
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

