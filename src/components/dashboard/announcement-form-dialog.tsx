'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Announcement } from "@/types/data";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  content: z.string().min(10, "El contenido debe tener al menos 10 caracteres."),
  imageUrl: z.string().url("Por favor, introduce una URL de imagen válida.").optional().or(z.literal('')),
});

interface AnnouncementFormDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    announcement?: Announcement;
}

export function AnnouncementFormDialog({ isOpen, onOpenChange, announcement }: AnnouncementFormDialogProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: announcement ? {
            title: announcement.title,
            content: announcement.content,
            imageUrl: announcement.imageUrl,
        } : {
            title: "",
            content: "",
            imageUrl: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user) return;

        try {
            if (announcement) {
                // Update existing announcement
                const announcementRef = doc(firestore, "announcements", announcement.id);
                await updateDoc(announcementRef, values);
                toast({ title: "Anuncio actualizado con éxito" });
            } else {
                // Create new announcement
                await addDoc(collection(firestore, "announcements"), {
                    ...values,
                    supplierId: user.uid,
                    status: 'pending', // Or 'approved' if you want to bypass admin approval
                    submittedAt: serverTimestamp(),
                });
                toast({ title: "Anuncio creado con éxito" });
            }
            onOpenChange(false);
            form.reset();

        } catch (error) {
            console.error("Error saving announcement: ", error);
            toast({ title: "Error al guardar el anuncio", variant: "destructive" });
        }
    }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{announcement ? "Editar Anuncio" : "Crear Anuncio"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: ¡Gran venta de verano!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe tu anuncio..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de la Imagen (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://ejemplo.com/imagen.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit">{announcement ? "Guardar Cambios" : "Crear Anuncio"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
