'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore } from '@/firebase';
import { AlertTriangle, RotateCcw, Shield, Loader2, Search, UserCheck, UserX, GraduationCap, CheckCircle2 } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { HomeSectionDialog } from '@/components/admin/home-builder/home-section-dialog';
import { UserProfile } from '@/types/data';
import type { HomeSection } from '@/types/data';

export default function AdminToolsPanelPage() {
    const { roles, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [status, setStatus] = useState<string | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [confirmStep, setConfirmStep] = useState(0);

    // User Search State
    const [searchEmail, setSearchEmail] = useState('');
    const [searching, setSearching] = useState(false);
    const [foundUser, setFoundUser] = useState<any>(null);
    const [updating, setUpdating] = useState(false);

    // Delivery Sections State
    const [deliverySections, setDeliverySections] = useState<HomeSection[]>([]);
    const [loadingSections, setLoadingSections] = useState(false);
    const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const isAdmin = roles.includes('admin');

    const handleSearchUser = async () => {
        if (!searchEmail.trim()) return;
        setSearching(true);
        setFoundUser(null);
        try {
            const q = query(collection(firestore, 'users'), where('email', '==', searchEmail.trim().toLowerCase()));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                setFoundUser({ ...userData, id: querySnapshot.docs[0].id });
            } else {
                toast({
                    variant: "destructive",
                    title: "Usuario no encontrado",
                    description: "No existe un usuario con ese correo electrónico."
                });
            }
        } catch (error) {
            console.error("Error searching user:", error);
        } finally {
            setSearching(false);
        }
    };

    const handleToggleStudent = async () => {
        if (!foundUser) return;
        setUpdating(true);
        try {
            const userRef = doc(firestore, 'users', foundUser.id);
            const newStatus = !foundUser.isStudent;
            await updateDoc(userRef, { isStudent: newStatus });
            setFoundUser({ ...foundUser, isStudent: newStatus });
            toast({
                title: "Usuario actualizado",
                description: `Estado de estudiante cambiado a: ${newStatus ? 'SÍ' : 'NO'}`
            });
        } catch (error) {
            console.error("Error updating student status:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado." });
        } finally {
            setUpdating(false);
        }
    };

    const handleVerifyStudent = async () => {
        if (!foundUser) return;
        setUpdating(true);
        try {
            const userRef = doc(firestore, 'users', foundUser.id);
            await updateDoc(userRef, { 
                studentStatus: 'verified',
                isStudent: true 
            });
            setFoundUser({ ...foundUser, studentStatus: 'verified', isStudent: true });
            toast({ title: "Usuario Verificado", description: "El estudiante ha sido verificado correctamente." });
        } catch (error) {
            console.error("Error verifying student:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo verificar." });
        } finally {
            setUpdating(false);
        }
    };

    const fetchDeliverySections = async () => {
        setLoadingSections(true);
        try {
            const sectionsRef = collection(firestore, 'home_sections');
            const q = query(sectionsRef, orderBy('order', 'asc'));
            const querySnapshot = await getDocs(q);
            const sections = querySnapshot.docs
                .map(doc => ({ ...doc.data(), id: doc.id } as HomeSection))
                .filter(s => s.targetBoard === 'delivery');
            setDeliverySections(sections);
        } catch (error) {
            console.error("Error fetching delivery sections:", error);
        } finally {
            setLoadingSections(false);
        }
    };

    useEffect(() => {
        if (isAdmin) fetchDeliverySections();
    }, [isAdmin]);

    const handleResetRanking = async () => {
        if (confirmStep < 2) {
            setConfirmStep(confirmStep + 1);
            return;
        }

        setIsResetting(true);
        setStatus(null);
        try {
            const res = await fetch('/api/admin/reset-ranking', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setStatus(`✅ ${data.message}`);
            } else {
                setStatus(`❌ ${data.error || 'Error desconocido'}`);
            }
        } catch (error) {
            setStatus('❌ Error de conexión.');
        } finally {
            setIsResetting(false);
            setConfirmStep(0);
        }
    };

    const buttonLabels = [
        'Resetear Ranking',
        '¿Estás seguro?',
        '¡CONFIRMAR RESET!'
    ];

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Shield className="h-16 w-16 text-foreground/30" />
                <h1 className="text-2xl font-bold">Acceso denegado</h1>
                <p className="text-foreground">Solo administradores pueden acceder a esta página.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight leading-none">Herramientas del Sistema</h1>
                <p className="text-foreground text-sm font-medium opacity-70 italic">Acciones administrativas avanzadas para la gestión de la plataforma.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* GESTIÓN DE ESTUDIANTES */}
                <Card className="glass glass-dark shadow-premium border-primary/10 rounded-[2rem] overflow-hidden">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                            <GraduationCap className="h-6 w-6 text-primary" />
                            Gestión de Estudiantes
                        </CardTitle>
                        <CardDescription className="font-bold italic">
                            Busca un usuario por email para verificar su certificado o cambiar su estado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-2">
                            <Input 
                                placeholder="usuario@email.com" 
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                                className="h-12 rounded-xl bg-primary/5 border-primary/10 font-bold"
                            />
                            <Button size="icon" onClick={handleSearchUser} disabled={searching} className="h-12 w-12 rounded-xl shrink-0">
                                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>

                        {foundUser && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-black text-2xl tracking-tighter uppercase">{foundUser.firstName} {foundUser.lastName}</p>
                                            <p className="text-sm font-bold text-foreground italic mb-2">{foundUser.email}</p>
                                            <div className="flex gap-2">
                                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${foundUser.isStudent ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {foundUser.isStudent ? 'Estudiante' : 'No Estudiante'}
                                                </div>
                                                {foundUser.studentStatus && (
                                                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${foundUser.studentStatus === 'verified' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                        {foundUser.studentStatus}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Shield className="h-8 w-8 text-primary/20" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-primary/5">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground">Institución</p>
                                            <p className="text-xs font-bold truncate">{foundUser.institution || 'No especificada'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground">Carrera</p>
                                            <p className="text-xs font-bold truncate">{foundUser.career || 'No especificada'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground">DNI</p>
                                            <p className="text-xs font-bold">{foundUser.dni || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-foreground">Certificado</p>
                                            {foundUser.studentCertificateUrl ? (
                                                <a href={foundUser.studentCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline">Ver Archivo 🔗</a>
                                            ) : (
                                                <p className="text-xs font-bold text-foreground/50 italic">No subido</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button 
                                            onClick={handleToggleStudent} 
                                            disabled={updating}
                                            variant={foundUser.isStudent ? "outline" : "default"}
                                            className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] h-11"
                                        >
                                            {updating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : foundUser.isStudent ? <UserX className="h-3 w-3 mr-2" /> : <UserCheck className="h-3 w-3 mr-2" />}
                                            {foundUser.isStudent ? 'Quitar Estado' : 'Hacer Estudiante'}
                                        </Button>
                                        {foundUser.isStudent && foundUser.studentStatus !== 'verified' && (
                                            <Button 
                                                onClick={handleVerifyStudent} 
                                                disabled={updating}
                                                className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] h-11 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 text-white"
                                            >
                                                {updating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle2 className="h-3 w-3 mr-2" />}
                                                Verificar Certificado
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* GESTIÓN DE HOME DELIVERY */}
                <Card className="glass glass-dark shadow-premium border-primary/10 rounded-[2rem] overflow-hidden">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                                <Shield className="h-6 w-6 text-primary" />
                                Home Delivery
                            </CardTitle>
                            <Button size="sm" onClick={() => {
                                setEditingSection(null);
                                setIsDialogOpen(true);
                            }} className="rounded-xl font-black uppercase tracking-widest text-[10px] h-8">
                                Nuevo Bloque
                            </Button>
                        </div>
                        <CardDescription className="font-bold italic">Edita los bloques, banners y carruseles del mundo Delivery.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingSections ? (
                            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary/40" /></div>
                        ) : (
                            <div className="space-y-3">
                                {deliverySections.map(section => (
                                    <div key={section.id} className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between hover:bg-primary/10 transition-colors group">
                                        <div className="space-y-0.5">
                                            <p className="font-black text-sm uppercase tracking-tight">{section.title}</p>
                                            <p className="text-[10px] font-bold text-foreground uppercase opacity-60">Tipo: {section.block.kind}</p>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-8 w-8 rounded-lg p-0"
                                            onClick={() => {
                                                setEditingSection(section);
                                                setIsDialogOpen(true);
                                            }}
                                        >
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {deliverySections.length === 0 && (
                                    <p className="text-center py-6 text-xs font-bold text-foreground/50 uppercase tracking-widest leading-loose italic">No hay secciones configuradas para Delivery.</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="glass glass-dark shadow-premium border-destructive/20 rounded-[2rem] overflow-hidden max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-destructive">
                        <AlertTriangle className="h-6 w-6" />
                        Resetear Ranking
                    </CardTitle>
                    <CardDescription className="font-bold italic text-destructive/70">
                        Esto pondrá los puntos de <strong>todos los usuarios</strong> en 0. Acción irreversible.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-8">
                    <Button 
                        variant={confirmStep >= 1 ? 'destructive' : 'outline'}
                        className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all"
                        onClick={handleResetRanking}
                        disabled={isResetting}
                    >
                        {isResetting ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                            <RotateCcw className="h-4 w-4 mr-2" />
                        )}
                        {isResetting ? 'Reseteando...' : buttonLabels[confirmStep]}
                    </Button>

                    {confirmStep > 0 && !isResetting && (
                        <Button 
                            variant="ghost" 
                            className="w-full font-black uppercase tracking-widest text-[10px] text-foreground"
                            onClick={() => setConfirmStep(0)}
                        >
                            Cancelar
                        </Button>
                    )}

                    {status && (
                        <p className={`text-sm font-bold text-center p-4 rounded-2xl animate-in zoom-in-95 duration-300 ${status.startsWith('✅') ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                            {status}
                        </p>
                    )}
                </CardContent>
            </Card>

            <HomeSectionDialog 
                isOpen={isDialogOpen} 
                onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) fetchDeliverySections(); // Refresh on close
                }}
                section={editingSection}
                defaultBoard="delivery"
            />
        </div>
    );
}


