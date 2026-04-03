'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, Search, MoreHorizontal, Trash2, MessageCircle, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DeleteConfirmationDialog from '@/components/admin/delete-confirmation-dialog';

interface ComedorApplication {
    id?: string;
    userId: string;
    firstName: string;
    lastName: string;
    institution: string;
    courseYear: string;
    email: string;
    phone: string;
    address: string;
    contactName: string;
    contactPhone: string;
    contactRelationship: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any;
}

export function ApplicationsTable() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [applicationToDelete, setApplicationToDelete] = useState<string | null>(null);

    // WhatsApp Template State
    const [whatsappTemplate, setWhatsappTemplate] = useState('Hola {nombre}, te contactamos desde el comedor universitario Cinco.Dos, una iniciativa completamente gratuita...');
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

    // Hydrate template from localStorage on mount
    useEffect(() => {
        const savedTemplate = localStorage.getItem('cincoDosWaTemplate');
        if (savedTemplate) {
            setWhatsappTemplate(savedTemplate);
        }
    }, []);

    const saveTemplate = (newTemplate: string) => {
        setWhatsappTemplate(newTemplate);
        localStorage.setItem('cincoDosWaTemplate', newTemplate);
    };

    const handleWhatsApp = (app: ComedorApplication) => {
        if (!app.phone) {
            toast({ variant: 'destructive', title: 'Error', description: 'El estudiante no proporcionó número de teléfono.'});
            return;
        }
        let msg = whatsappTemplate.replace('{nombre}', app.firstName).replace('{apellido}', app.lastName);
        const encoded = encodeURIComponent(msg);
        const cleanPhone = app.phone.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    };

    const applicationsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'comedor_applications'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore]);

    const { data: rawApplications, isLoading } = useCollection(applicationsQuery);

    const filteredApplications = useMemo(() => {
        if (!rawApplications) return [];
        let filtered = rawApplications as ComedorApplication[];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(app => app.status === statusFilter);
        }

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(app => 
                `${app.firstName} ${app.lastName}`.toLowerCase().includes(lowerSearch) ||
                app.institution.toLowerCase().includes(lowerSearch) ||
                app.email.toLowerCase().includes(lowerSearch)
            );
        }

        return filtered;
    }, [rawApplications, searchTerm, statusFilter]);

    const updateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'comedor_applications', id), {
                status: newStatus
            });
            toast({
                title: 'Estado actualizado',
                description: `La solicitud ha sido marcada como ${newStatus === 'approved' ? 'aprobada' : 'rechazada'}.`
            });
        } catch (error) {
            console.error('Error updating status:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado.' });
        }
    };

    const confirmDelete = (id: string) => {
        setApplicationToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!firestore || !applicationToDelete) return;
        try {
            await deleteDoc(doc(firestore, 'comedor_applications', applicationToDelete));
            toast({ title: 'Solicitud eliminada' });
        } catch (error) {
            console.error('Error deleting application:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la solicitud.' });
        } finally {
            setIsDeleteDialogOpen(false);
            setApplicationToDelete(null);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex gap-4">
                     <Skeleton className="h-10 flex-1" />
                     <Skeleton className="h-10 w-48" />
                </div>
                <div className="rounded-md border p-4 space-y-4">
                    {[...Array(5)].map((_, i) => (
                         <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
                    <Input 
                        placeholder="Buscar por nombre, institución o email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="pending">Pendientes</SelectItem>
                        <SelectItem value="approved">Aprobados</SelectItem>
                        <SelectItem value="rejected">Rechazados</SelectItem>
                    </SelectContent>
                </Select>

                <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto h-10 border-white/10 flex items-center gap-2">
                            <Settings2 className="h-4 w-4" /> Plantilla WhatsApp
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md glass glass-dark border-white/10 shadow-premium">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <MessageCircle className="h-5 w-5 text-green-500" /> WhatsApp Dinámico
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <p className="text-sm text-foreground">
                                Define el mensaje base que se abrirá automáticamente al presionar "Contactar Estudiante".<br/>
                                Usa <code>{'{nombre}'}</code> y <code>{'{apellido}'}</code> y nosotros lo reemplazaremos de manera mágica para cada estudiante.
                            </p>
                            <Textarea 
                                value={whatsappTemplate}
                                onChange={(e) => saveTemplate(e.target.value)}
                                rows={6}
                                className="resize-none bg-white/5 border-white/10 focus-visible:ring-primary/50"
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Estudiante</TableHead>
                            <TableHead>Institución / Año</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredApplications.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-foreground">
                                    No se encontraron solicitudes.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredApplications.map((app) => (
                                <TableRow key={app.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {app.createdAt ? format(app.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium">{app.firstName} {app.lastName}</p>
                                        <p className="text-xs text-foreground">{app.email}</p>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium">{app.institution}</p>
                                        <p className="text-xs text-foreground">Año de cursado: {app.courseYear}</p>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm">{app.phone}</p>
                                        <p className="text-xs text-foreground">Emergencia: {app.contactName} ({app.contactPhone})</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            app.status === 'approved' ? 'default' : 
                                            app.status === 'rejected' ? 'destructive' : 'secondary'
                                        }>
                                            {app.status === 'approved' ? 'Aprobado' : 
                                             app.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleWhatsApp(app)}
                                                className="hidden md:flex border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-400 h-8 gap-1.5 px-2.5 rounded-lg"
                                            >
                                                <MessageCircle className="h-3.5 w-3.5" />
                                                <span className="text-xs">Contactar</span>
                                            </Button>
                                            
                                            <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem className="md:hidden" onClick={() => handleWhatsApp(app)}>
                                                    <MessageCircle className="mr-2 h-4 w-4 text-green-500" /> Enviar WhatsApp
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="md:hidden" />
                                                {app.status !== 'approved' && (
                                                    <DropdownMenuItem onClick={() => updateStatus(app.id!, 'approved')}>
                                                        <Check className="mr-2 h-4 w-4" /> Aprobar Solicitud
                                                    </DropdownMenuItem>
                                                )}
                                                {app.status !== 'rejected' && (
                                                    <DropdownMenuItem onClick={() => updateStatus(app.id!, 'rejected')}>
                                                        <X className="mr-2 h-4 w-4" /> Rechazar Solicitud
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => confirmDelete(app.id!)} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar Registro
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            
            <DeleteConfirmationDialog 
                isOpen={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDelete}
                title="¿Eliminar Solicitud?"
                description="Esta acción eliminará permanentemente la solicitud del comedor para este estudiante. No se puede deshacer."
            />
        </div>
    );
}

