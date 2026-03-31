'use client';
import { useUser, useFirestore, useDocOnce, useStorage } from '@/firebase';
import MainLayout from '@/components/layout/main-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { AtSign, Copy, Save, User as UserIcon, Award, Trophy, QrCode, Paintbrush, Scissors } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import React, { useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useUserRank } from '@/hooks/use-user-rank';
import { PageHeader } from '@/components/ui/page-header';
import { LevelProgress } from '@/components/profile/level-progress';
import { AvatarSelector, AvatarFallbackFachero } from '@/components/profile/avatar-selector';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { getAvatarUrl, cn } from '@/lib/utils';
import { StudentVerificationCard } from '@/components/profile/student-verification-card';
import { Timestamp } from 'firebase/firestore';

const UserQRCodeDialog = dynamic(() => import('@/components/profile/user-qr-code-dialog'), { ssr: false });

const profileFormSchema = z.object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres.'),
    username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres.').regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos.'),
    avatarSeed: z.string().optional(),
});

interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    dni: string;
    phone: string;
    username: string;
    photoURL?: string;
    avatarSeed?: string;
    useAvatar?: boolean;
    points: number;
    id: string;
    isStudent: boolean;
    studentStatus?: 'pending' | 'submitted' | 'verified';
    studentCertificateUrl?: string;
    certificateDeadline?: Timestamp;
}

function ProfileSkeleton() {
    return (
        <div className='space-y-8 animate-fade-in'>
            <Card className="glass glass-dark shadow-premium border-0 rounded-[2rem]">
                <CardHeader>
                    <Skeleton className="h-8 w-32" />
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="flex items-center space-x-6">
                        <Skeleton className="h-24 w-24 rounded-3xl" />
                        <div className="space-y-3">
                            <Skeleton className="h-7 w-40" />
                            <Skeleton className="h-4 w-60" />
                        </div>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function UserStats({ points, rank, isLoading }: { points: number; rank: number | null, isLoading: boolean }) {
  return (
    <Card className="glass glass-dark shadow-premium border-0 rounded-[2rem] overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <CardHeader>
        <CardTitle className="text-xl font-black tracking-tight uppercase text-xs text-muted-foreground/80 tracking-[0.2em]">Estadísticas</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-8 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                <Award className="h-6 w-6 text-primary" />
            </div>
            <p className="text-3xl font-black tracking-tighter">{points || 0}</p>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Puntos Totales</p>
        </div>
        <div className="space-y-2">
           <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <p className="text-3xl font-black tracking-tighter">{rank ? `#${rank}` : 'N/A'}</p>}
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ranking</p>
        </div>
      </CardContent>
    </Card>
  )
}


export default function ProfilePage() {
    const { user, isUserLoading, roles } = useUser();
    const isSupplier = roles.includes('supplier');
    const firestore = useFirestore();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const shouldOpenCustomizer = searchParams?.get('customize') === 'true';

    const userProfileRef = useMemo(() => {
        if (isUserLoading || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user?.uid, firestore, isUserLoading]);
    
    const { data: userProfile, isLoading: isProfileLoading, error } = useDocOnce<UserProfile>(userProfileRef);

    // Efficiently get user rank, but only when the user profile is actually loaded.
    const { rank, isLoading: isRankLoading } = useUserRank(userProfile ? user?.uid : undefined, userProfile?.points);
    
    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            username: '',
            avatarSeed: '',
        },
    });
    
    useEffect(() => {
        if (userProfile) {
            form.reset({
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                username: userProfile.username,
                avatarSeed: userProfile.avatarSeed || '',
            });
        }
    }, [userProfile, form]);

    async function onSubmit(values: z.infer<typeof profileFormSchema>) {
        if (!user || !userProfileRef || !userProfile) {
            toast({ variant: "destructive", title: "Error", description: "No se puede actualizar el perfil sin estar autenticado." });
            return;
        }

        form.clearErrors();
        toast({ title: 'Actualizando perfil...', description: 'Por favor espera.' });

        try {
            const batch = writeBatch(firestore);
            const updates: { [key: string]: any } = {
                firstName: values.firstName,
                lastName: values.lastName,
                avatarSeed: values.avatarSeed || '',
            };

            const newUsername = values.username.toLowerCase();
            const oldUsername = userProfile.username.toLowerCase();

            // --- 1. Username Validation ---
            if (newUsername !== oldUsername) {
                const newUsernameRef = doc(firestore, 'usernames', newUsername);
                const usernameDoc = await getDoc(newUsernameRef);
                if (usernameDoc.exists()) {
                    form.setError('username', { message: 'Este nombre de usuario ya está en uso.' });
                    toast({ variant: "destructive", title: "Error", description: "Nombre de usuario no disponible." });
                    return;
                }
                updates.username = newUsername;
                const oldUsernameRef = doc(firestore, 'usernames', oldUsername);
                batch.delete(oldUsernameRef);
                batch.set(newUsernameRef, { userId: user.uid });
            }


            // --- 2. Batch Write and Auth Profile Update ---
            batch.update(userProfileRef, updates);
            await batch.commit();

            await updateProfile(user, {
                displayName: `${values.firstName} ${values.lastName}`,
            });

            toast({
                title: 'Perfil Actualizado',
                description: 'Tus datos han sido guardados correctamente.',
            });

        } catch (e: any) {
            console.error("Error updating profile:", e);
            toast({
                variant: "destructive",
                title: "Error al actualizar",
                description: e.message || "No se pudo actualizar tu perfil. Inténtalo de nuevo.",
            });
        }
    }
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copiado al portapapeles',
            description: 'Tu ID de usuario ha sido copiado.',
        });
    }
    
    // Determine the photo URL:
    // - Non-suppliers: always DiceBear avatar
    // - Suppliers: respect `useAvatar` preference (logo by default)
    const photo = useMemo(() => {
        if (!isSupplier) return getAvatarUrl(userProfile?.avatarSeed);
        if (userProfile?.useAvatar) return getAvatarUrl(userProfile?.avatarSeed);
        return userProfile?.photoURL || user?.photoURL;
    }, [userProfile?.avatarSeed, userProfile?.photoURL, user?.photoURL, isSupplier, userProfile?.useAvatar]);

    if (isUserLoading || (user && isProfileLoading)) {
        return (
            <MainLayout>
                <div className="space-y-8 p-4 md:p-8">
                   <ProfileSkeleton />
                </div>
            </MainLayout>
        )
    }

    if (!user || !userProfile) {
        return (
            <MainLayout>
                <div className="space-y-8 p-4 md:p-8">
                    <p>No se pudo cargar el perfil. Por favor, inicia sesión de nuevo.</p>
                     {error && <p className="text-destructive">{error.message}</p>}
                </div>
            </MainLayout>
        )
    }
    
    return (
        <MainLayout>
            <div className="flex-1 space-y-12 p-4 md:p-12 mb-12 max-w-5xl mx-auto animate-fade-in">
                <header className="space-y-4">
                    <div className="flex items-center justify-between">
                         <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
                            Mi <span className="text-primary">Perfil</span>
                        </h1>
                        <UserQRCodeDialog userId={user.uid} username={userProfile.username}>
                            <Button variant="outline" className="h-11 rounded-xl font-bold shadow-premium glass glass-dark border-primary/10">
                                <QrCode className="mr-2 h-4 w-4" />
                                Mi ID Card
                            </Button>
                        </UserQRCodeDialog>
                    </div>
                    <p className="text-lg text-muted-foreground font-medium max-w-2xl leading-relaxed">
                        Gestiona tu información personal y visualiza tu progreso en el Club.
                    </p>
                </header>

                <div className="grid gap-8 md:grid-cols-2">
                    <LevelProgress points={userProfile.points} />
                    <UserStats points={userProfile.points} rank={rank} isLoading={isRankLoading} />
                </div>

                <StudentVerificationCard userProfile={userProfile} />

                <Card className="glass glass-dark shadow-premium border-0 rounded-[2rem] overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-black tracking-tight uppercase text-xs text-muted-foreground/80 tracking-[0.2em]">Información Personal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-10 pt-6">
                        <div className="flex items-center space-x-8">
                            <div className="relative group">
                                <Avatar className="h-28 w-28 rounded-3xl shadow-xl transition-transform duration-500 group-hover:scale-105 border-4 border-background overflow-hidden bg-background">
                                    {photo ? (
                                        <AvatarImage src={photo} alt={user.displayName || 'User'} className="object-cover" />
                                    ) : (
                                        <AvatarFallbackFachero className="w-full h-full text-4xl" />
                                    )}
                                </Avatar>
                                <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg border-2 border-background">
                                    <UserIcon className="h-4 w-4" />
                                </div>
                            </div>
                            <div className='space-y-3'>
                                <p className="text-3xl font-black tracking-tighter">{userProfile.firstName} {userProfile.lastName}</p>
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">@{userProfile.username}</span>
                                    <span className="text-sm text-muted-foreground font-medium">{userProfile.email}</span>
                                </div>
                                <div className="pt-1">
                                    <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        className="h-8 rounded-lg font-black uppercase tracking-widest text-[10px] bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm"
                                        onClick={() => {
                                            const element = document.getElementById('avatar-accordion-trigger');
                                            if (element) {
                                                element.click();
                                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }
                                        }}
                                    >
                                        <Paintbrush className="mr-2 h-3 w-3" />
                                        Personalizar mi Avatar
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Avatar Customizer — available for ALL users */}
                        <Accordion 
                            type="single" 
                            collapsible 
                            className="w-full"
                            defaultValue={shouldOpenCustomizer ? 'avatar-customizer' : undefined}
                        >
                            <AccordionItem value="avatar-customizer" className="border-0 bg-primary/5 rounded-[2rem] px-6">
                                <AccordionTrigger id="avatar-accordion-trigger" className="hover:no-underline py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/20 rounded-xl">
                                            <UserIcon className="h-5 w-5 text-primary" />
                                        </div>
                                        <span className="text-lg font-black tracking-tight uppercase">Personalizar mi Avatar</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-8 space-y-6">
                                    {/* Supplier-only toggle: logo vs avatar */}
                                    {isSupplier && (
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-background/60 border border-border/40">
                                            <div>
                                                <p className="font-black text-sm">Mostrar en mi perfil</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {userProfile?.useAvatar ? 'Usando tu avatar Micah' : 'Usando tu logo de empresa'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (!userProfileRef) return;
                                                        await updateDoc(userProfileRef, { useAvatar: false });
                                                        toast({ title: 'Usando Logo de empresa' });
                                                        window.location.reload();
                                                    }}
                                                    className={cn(
                                                        'px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all',
                                                        !userProfile?.useAvatar
                                                            ? 'bg-background text-foreground shadow-sm'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    )}
                                                >
                                                    🏢 Logo
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (!userProfileRef) return;
                                                        await updateDoc(userProfileRef, { useAvatar: true });
                                                        toast({ title: 'Usando Avatar' });
                                                        window.location.reload();
                                                    }}
                                                    className={cn(
                                                        'px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all',
                                                        userProfile?.useAvatar
                                                            ? 'bg-background text-foreground shadow-sm'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    )}
                                                >
                                                    👤 Avatar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <AvatarSelector 
                                        selectedSeed={form.watch('avatarSeed')} 
                                        onSelect={(seed) => form.setValue('avatarSeed', seed)}
                                        onSave={async (seed) => {
                                            if (!userProfileRef) return;
                                            form.setValue('avatarSeed', seed);
                                            await updateDoc(userProfileRef, { avatarSeed: seed });
                                            toast({ title: '¡Avatar guardado!', description: 'Tu Estu fue actualizado.' });
                                            window.location.reload();
                                        }}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                                <div className="grid gap-8 md:grid-cols-2">
                                     <FormField
                                        control={form.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/80">Nombre</FormLabel>
                                                <div className="relative">
                                                    <UserIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                    <FormControl>
                                                        <Input {...field} className="h-12 pl-12 rounded-xl bg-background/50 border-primary/5 focus:border-primary/20 font-bold transition-all text-base" />
                                                    </FormControl>
                                                </div>
                                                <FormMessage className="text-xs font-bold" />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/80">Apellido</FormLabel>
                                                <div className="relative">
                                                    <UserIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                    <FormControl>
                                                        <Input {...field} className="h-12 pl-12 rounded-xl bg-background/50 border-primary/5 focus:border-primary/20 font-bold transition-all text-base" />
                                                    </FormControl>
                                                </div>
                                                <FormMessage className="text-xs font-bold" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                          <FormItem className="md:col-span-2">
                                            <FormLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/80">Nombre de usuario</FormLabel>
                                            <div className="relative">
                                              <AtSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                              <FormControl>
                                                <Input {...field} className="h-12 pl-12 rounded-xl bg-background/50 border-primary/5 focus:border-primary/20 font-bold transition-all text-base" />
                                              </FormControl>
                                            </div>
                                            <FormMessage className="text-xs font-bold" />
                                          </FormItem>
                                        )}
                                      />
                                    <div className="space-y-3">
                                        <Label htmlFor="dni" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/80">DNI</Label>
                                        <Input id="dni" value={userProfile.dni} disabled className="h-12 rounded-xl bg-muted/30 border-transparent font-bold text-base opacity-70" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="phone" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/80">Teléfono</Label>
                                        <Input id="phone" value={userProfile.phone} disabled className="h-12 rounded-xl bg-muted/30 border-transparent font-bold text-base opacity-70" />
                                    </div>
                                    <div className="space-y-3 md:col-span-2">
                                        <Label htmlFor="userId" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground/80">ID de Usuario</Label>
                                        <div className="relative">
                                            <Input id="userId" value={user.uid} disabled className="h-12 pr-12 rounded-xl bg-muted/30 border-transparent font-extrabold text-sm opacity-50 font-mono tracking-tighter" />
                                            <Button 
                                                type="button"
                                                variant="ghost" 
                                                size="icon" 
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-background"
                                                onClick={() => copyToClipboard(user.uid)}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Tu identificador único en EstuClub</p>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <Button type="submit" className="h-14 px-10 rounded-2xl font-black text-base shadow-lg hover:shadow-primary/20 transition-all active:scale-95" disabled={form.formState.isSubmitting}>
                                        {form.formState.isSubmitting ? 'GUARDANDO...' : (
                                            <>
                                                <Save className="mr-2 h-5 w-5" />
                                                GUARDAR CAMBIOS
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
