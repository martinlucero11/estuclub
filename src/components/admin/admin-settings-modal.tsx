'use client';

import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Moon, 
  Sun, 
  Bell, 
  ShieldCheck, 
  Database, 
  Zap 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSettingsModal({ isOpen, onClose }: AdminSettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = () => {
    toast({
      title: "Configuración Guardada",
      description: "Los ajustes globales del sistema han sido actualizados.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-[2.5rem] bg-card/90 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden p-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-[#00ffff] to-primary animate-pulse" />
        
        <div className="p-8 space-y-8">
          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic font-montserrat">Ajustes de Sistema</DialogTitle>
                <DialogDescription className="text-[10px] font-black uppercase tracking-widest opacity-40">
                  Panel de Control Maestro • Estuclub HQ
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual Section */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                <Zap className="h-4 w-4" /> Interfaz Visual
              </h4>
              <div className="space-y-4 p-5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-black uppercase tracking-tighter">Modo Oscuro</Label>
                    <p className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest">Cambiar tema visual</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="h-10 w-10 rounded-xl bg-white/5"
                  >
                    {theme === 'dark' ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-amber-500" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 flex items-center gap-2">
                <Bell className="h-4 w-4" /> Alertas Globales
              </h4>
              <div className="space-y-4 p-5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-black uppercase tracking-tighter">Notificaciones</Label>
                    <p className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest">Alertas de sistema</p>
                  </div>
                  <Switch 
                    checked={notifEnabled} 
                    onCheckedChange={setNotifEnabled}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4 md:col-span-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Seguridad y Estado
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5">
                  <div className="space-y-1">
                    <Label className="text-sm font-black uppercase tracking-tighter">Modo Mantenimiento</Label>
                    <p className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest">Pausar todas las operaciones</p>
                  </div>
                  <Switch 
                    checked={maintenanceMode} 
                    onCheckedChange={setMaintenanceMode}
                    className="data-[state=checked]:bg-red-500"
                  />
                </div>
                <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5">
                  <div className="space-y-1">
                    <Label className="text-sm font-black uppercase tracking-tighter">Limpieza de Cache</Label>
                    <p className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest">Recargar datos globales</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-10 rounded-xl bg-white/5 px-4 font-black text-[9px] uppercase tracking-widest">
                    <Database className="h-3.5 w-3.5 mr-2" /> Ejecutar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-black/20 p-6 flex items-center justify-between border-t border-white/5">
          <p className="text-[8px] font-bold opacity-20 uppercase tracking-[0.3em]">Hardware ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="rounded-xl font-black text-[10px] uppercase tracking-widest h-11 px-8">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest h-11 px-10 shadow-[0_0_20px_rgba(255,0,127,0.3)]">Guardar Cambios</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
