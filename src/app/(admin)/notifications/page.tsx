'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bell, Send, Link as LinkIcon, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Admin Broadcast Center (Misión 3: Control Total)
 * Interfaz para envío masivo de notificaciones push con Deep Linking.
 */
export default function AdminNotificationsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [urlType, setUrlType] = useState('custom');
    const [customUrl, setCustomUrl] = useState('/');

    const handleSend = async () => {
        if (!title || !body) {
            toast({ variant: 'destructive', title: 'Faltan campos' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/notifications/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, body, url: customUrl })
            });

            const data = await res.json();
            if (data.success) {
                toast({ title: '¡Enviado!', description: `Multicast exitoso: ${data.sent} dispositivos.` });
                setTitle('');
                setBody('');
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="space-y-1">
                <h1 className="text-4xl font-black italic tracking-tighter text-black uppercase">Broadcast Center</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic">Control Maestro de Notificaciones Push</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* FORM */}
                <Card className="border-black/5 shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-black/60">Título de Notificación</Label>
                            <Input 
                                placeholder="¡Nueva Promo!" 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-12 border-black/5 rounded-xl font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-black/60">Mensaje (Cuerpo)</Label>
                            <Textarea 
                                placeholder="Aprovechá 50% OFF en Estuclub Barber..." 
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="min-h-[100px] border-black/5 rounded-xl font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-black/60">Deep Link (URL de Destino)</Label>
                            <div className="flex gap-2">
                                <Select onValueChange={(val) => {
                                    setUrlType(val);
                                    if (val === 'home') setCustomUrl('/');
                                    if (val === 'benefits') setCustomUrl('/benefits');
                                    if (val === 'profile') setCustomUrl('/profile');
                                }}>
                                    <SelectTrigger className="w-[140px] border-black/5 rounded-xl">
                                        <SelectValue placeholder="Destino" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="home">Home</SelectItem>
                                        <SelectItem value="benefits">Beneficios</SelectItem>
                                        <SelectItem value="profile">Perfil</SelectItem>
                                        <SelectItem value="custom">URL Manual</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input 
                                    placeholder="/ruta/especifica" 
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value)}
                                    className="flex-1 h-12 border-black/5 rounded-xl font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <Button 
                        onClick={handleSend}
                        disabled={loading}
                        className="w-full h-16 bg-[#cb465a] text-white font-black text-lg uppercase tracking-widest italic rounded-2xl shadow-[0_20px_40px_rgba(203, 70, 90,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Send className="mr-3 h-5 w-5" /> LANZAR PUSH</>}
                    </Button>
                </Card>

                {/* PREVIEW */}
                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-black/60 px-4">Vista Previa Mobile</Label>
                    <div className="bg-slate-100 rounded-[3rem] p-6 border-[8px] border-black h-[400px] relative shadow-inner flex flex-col justify-center">
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full" />
                        
                        <div className="bg-white/80 backdrop-blur-xl border border-black/5 p-4 rounded-2xl shadow-xl w-full animate-bounce">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-6 w-6 rounded-lg bg-[#cb465a] flex items-center justify-center">
                                    <Bell className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-[10px] font-black text-black/40 uppercase">Estuclub</span>
                            </div>
                            <h3 className="text-sm font-black text-black leading-tight">{title || 'Título de ejemplo'}</h3>
                            <p className="text-xs font-bold text-black/60 line-clamp-2">{body || 'Este es el cuerpo de la notificación que llegará al usuario...'}</p>
                        </div>

                        <div className="mt-8 text-center text-black/20 font-black italic uppercase tracking-widest text-xs">
                            Simulación de Bloqueo
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4 items-start">
                <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
                <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600">Protocolo de Emergencia</h4>
                    <p className="text-[10px] font-bold text-amber-600/80 leading-relaxed uppercase">El envío masivo es irreversible. Asegurate de que el Deeplink sea correcto para evitar redirecciones 404 a nivel masivo.</p>
                </div>
            </div>
        </div>
    );
}
