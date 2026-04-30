'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
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
 * Verifies the caller's identity and returns the UID.
 */
async function verifyCallerUid(idToken: string): Promise<string> {
    if (!adminAuth) throw new Error('Firebase Admin Auth not initialized');
    const decoded = await adminAuth.verifyIdToken(idToken);
    return decoded.uid;
}

/**
 * Save or update a product with full server-side validation.
 * SECURED: Verifies that callerUid === productData.supplierId.
 */
export async function saveProductOperation(productData: any, idToken: string) {
    if (!adminDb) return { success: false, error: 'Firebase Admin not initialized' };

    try {
        const callerUid = await verifyCallerUid(idToken);
        const validated = ProductSchema.parse(productData);

        // Ownership check: only the supplier who owns this product can save it
        if (validated.supplierId !== callerUid) {
            return { success: false, error: 'Unauthorized: No podés modificar productos de otro comercio.' };
        }

        const { id, ...data } = validated;

        const collectionRef = adminDb.collection('products');
        const docRef = id ? collectionRef.doc(id) : collectionRef.doc();

        // If updating an existing product, verify the stored supplierId matches too
        if (id) {
            const existing = await docRef.get();
            if (existing.exists && existing.data()?.supplierId !== callerUid) {
                return { success: false, error: 'Unauthorized: Este producto pertenece a otro comercio.' };
            }
        }

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
 * Toggle product specific fields (stock, visibility).
 * SECURED: Verifies caller owns the product.
 */
export async function toggleProductStatusAction(productId: string, field: 'isActive' | 'stockAvailable', value: boolean, idToken: string) {
    if (!adminDb) return { success: false, error: 'Firebase Admin not initialized' };

    try {
        const callerUid = await verifyCallerUid(idToken);

        const docRef = adminDb.collection('products').doc(productId);
        const snap = await docRef.get();

        if (!snap.exists) return { success: false, error: 'El producto no existe.' };
        if (snap.data()?.supplierId !== callerUid) {
            return { success: false, error: 'Unauthorized: Este producto pertenece a otro comercio.' };
        }

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
 * Pure atomic delete.
 * SECURED: Reads the product first to verify caller ownership.
 */
export async function deleteProductAction(productId: string, idToken: string) {
    if (!adminDb) return { success: false, error: 'Firebase Admin not initialized' };

    try {
        const callerUid = await verifyCallerUid(idToken);

        const docRef = adminDb.collection('products').doc(productId);
        const snap = await docRef.get();

        if (!snap.exists) return { success: false, error: 'El producto no existe.' };
        if (snap.data()?.supplierId !== callerUid) {
            return { success: false, error: 'Unauthorized: No podés eliminar productos de otro comercio.' };
        }

        await docRef.delete();
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || 'Error al eliminar producto' };
    }
}
