'use client';
import { useUser, useFirestore, useDoc, useMemoFirebase, useStorage } from '@/firebase';
import MainLayout from '@/components/layout/main-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { AtSign, Copy, Save, Upload, User as UserIcon, Award, Trophy, QrCode, History } from 'lucide-react';
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
import { useEffect, useRef, useState } from 'react';
import { useUserRank } from '@/hooks/use-user-rank';
import UserQRCodeDialog from '@/components/profile/user-qr-code-dialog';
import Link from 'next/link';

const profileFormSchema = z.object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres.'),
    username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres.').regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos.'),
});

interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    dni: string;
    phone: string;
    username: string;
    photoURL?: string;
    points: number;
    id: string;
}

function ProfileSkeleton() {
    return (
        <div className='space-y-8'>
            <Card>
                <CardHeader>
                    <CardTitle>Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-60" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>

    )
}

function UserStats({ points, rank, isLoading }: { points: number; rank: number | null, isLoading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estadísticas</CardTitle>
        <CardDescription>Tus puntos y posición en el ranking.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <p className="text-2xl font-bold">{points || 0}</p>
          </div>
          <p className="text-sm text-muted-foreground">Puntos Totales</p>
        </div>
        <div className="text-center">
           <div className="flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            {isLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{rank ? `#${rank}` : 'N/A'}</p>}
          </div>
          <p className="text-sm text-muted-foreground">Ranking</p>
        </div>
      </CardContent>
    </Card>
  )
}


export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();

    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading, error } = useDoc<UserProfile>(userProfileRef);

    // Efficiently get user rank
    const { rank, isLoading: isRankLoading } = useUserRank(user?.uid, userProfile?.points);
    
    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            username: '',
        },
    });
    
    useEffect(() => {
        if (userProfile) {
            form.reset({
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                username: userProfile.username,
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
    
    const userInitial = userProfile.username ? userProfile.username.charAt(0).toUpperCase() : 'U';
    const photo = userProfile.photoURL || user?.photoURL;

    return (
        <MainLayout>
            <div className="flex-1 space-y-8 p-4 md:p-8">
                <header className="flex items-center justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                            Mi Perfil
                        </h1>
                        <p className="text-muted-foreground">
                            Gestiona la información de tu cuenta.
                        </p>
                    </div>
                     <UserQRCodeDialog userId={user.uid} username={userProfile.username}>
                        <Button variant="outline">
                            <QrCode className="mr-2 h-4 w-4" />
                            Mi ID Card
                        </Button>
                    </UserQRCodeDialog>
                </header>

                <UserStats points={userProfile.points} rank={rank} isLoading={isRankLoading} />

                <Card>
                    <CardHeader>
                        <CardTitle>Información Personal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-6">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={photo || undefined} alt={user.displayName || 'User'} />
                                <AvatarFallback>{userInitial}</AvatarFallback>
                            </Avatar>
                            <div className='space-y-1'>
                                <p className="text-2xl font-semibold">{userProfile.firstName} {userProfile.lastName}</p>
                                <p className="text-muted-foreground">@{userProfile.username}</p>
                                <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                            </div>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                     <FormField
                                        control={form.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre</FormLabel>
                                                <div className="relative">
                                                    <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                    <FormControl>
                                                        <Input {...field} className="pl-10" />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Apellido</FormLabel>
                                                <div className="relative">
                                                    <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                    <FormControl>
                                                        <Input {...field} className="pl-10" />
                                                    </FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                          <FormItem className="md:col-span-2">
                                            <FormLabel>Nombre de usuario</FormLabel>
                                            <div className="relative">
                                              <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                              <FormControl>
                                                <Input {...field} className="pl-10" />
                                              </FormControl>
                                            </div>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    <div className="space-y-2">
                                        <Label htmlFor="dni">DNI</Label>
                                        <Input id="dni" value={userProfile.dni} disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Teléfono</Label>
                                        <Input id="phone" value={userProfile.phone} disabled />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="userId">ID de Usuario</Label>
                                        <div className="relative">
                                            <Input id="userId" value={user.uid} disabled className="pr-10" />
                                            <Button 
                                                type="button"
                                                variant="ghost" 
                                                size="icon" 
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                                onClick={() => copyToClipboard(user.uid)}
                                            >
                                                <Copy className="h-4 w-4" />
                                                <span className="sr-only">Copiar ID de Usuario</span>
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Este es tu identificador único en la aplicación.</p>
                                    </div>
                                </div>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                     {form.formState.isSubmitting ? 'Guardando...' : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Guardar Cambios
                                        </>
                                     )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
