'use server';

import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

// We could import a specific ProductSchema from schemas.ts if we had a full one, 
// for now let's use a robust one here that matches the DB expectations.
const ProductSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string().min(1, 'El ID del comercio es obligatorio'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  originalPrice: z.number().optional().nullable(),
  category: z.string().optional(),
  menuSection: z.string().optional(),
  imageUrl: z.string().url('La URL de la imagen no es válida').or(z.literal('')),
  isActive: z.boolean().default(true),
  stockAvailable: z.boolean().default(true),
});

function formatZodError(error: z.ZodError) {
    return error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}

/**
 * Save or update a product with full server-side validation.
 */
export async function saveProductOperation(productData: any) {
    if (!adminDb) return { success: false, error: 'Firebase Admin not initialized' };

    try {
        const validated = ProductSchema.parse(productData);
        const { id, ...data } = validated;

        const collectionRef = adminDb.collection('products');
        const docRef = id ? collectionRef.doc(id) : collectionRef.doc();

        await docRef.set({
            ...data,
            id: docRef.id,
            updatedAt: new Date().toISOString(),
            createdAt: id ? undefined : new Date().toISOString(), // Only set on new
        }, { merge: true });

        return { success: true, id: docRef.id };
    } catch (e: any) {
        if (e instanceof z.ZodError) return { success: false, error: formatZodError(e) };
        console.error('SAVE_PRODUCT_ERROR:', e);
        return { success: false, error: e.message || 'Error al guardar producto' };
    }
}

/**
 * Toggle product specific fields (stock, visibility)
 */
export async function toggleProductStatusAction(productId: string, field: 'isActive' | 'stockAvailable', value: boolean) {
    if (!adminDb) return { success: false, error: 'Firebase Admin not initialized' };

    try {
        const docRef = adminDb.collection('products').doc(productId);
        await docRef.update({
            [field]: value,
            updatedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || 'Error al actualizar estado' };
    }
}

/**
 * Pure atomic delete
 */
export async function deleteProductAction(productId: string) {
    if (!adminDb) return { success: false, error: 'Firebase Admin not initialized' };

    try {
        await adminDb.collection('products').doc(productId).delete();
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || 'Error al eliminar producto' };
    }
}
