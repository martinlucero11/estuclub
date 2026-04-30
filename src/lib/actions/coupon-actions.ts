'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Coupon } from '@/types/data';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';

// Security: Verify admin identity before CRUD mutations
async function verifyAdmin(idToken: string): Promise<string> {
    if (!adminAuth || !adminDb) throw new Error('Firebase Admin not initialized');
    
    const decoded = await adminAuth.verifyIdToken(idToken);
    const callerUid = decoded.uid;

    // Check admin role in Firestore
    const userDoc = await adminDb.collection('users').doc(callerUid).get();
    const userData = userDoc.data();
    const isAdmin = userData?.role === 'admin';
    
    if (!isAdmin) {
        const adminDoc = await adminDb.collection('roles_admin').doc(callerUid).get();
        if (!adminDoc.exists) {
            throw new Error('Unauthorized: caller is not an admin');
        }
    }

    return callerUid;
}

const couponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  type: z.enum(['fixed', 'percentage']),
  value: z.number().positive(),
  startDate: z.date(),
  endDate: z.date(),
  usageLimit: z.number().int().min(1),
  isActive: z.boolean().default(true),
}).refine(data => {
  if (data.type === 'percentage' && data.value > 90) return false;
  return true;
}, {
  message: "El descuento porcentual no puede superar el 90%",
  path: ['value']
});

/**
 * Validates a coupon code for a specific user and order amount.
 * This is user-facing and does NOT require admin auth.
 */
export async function validateCoupon(code: string, userId: string, orderTotal: number) {
  if (!adminDb) return { success: false, message: 'Firebase Admin not initialized' };

  try {
    const normalizedCode = code.trim().toUpperCase();
    const snapshot = await adminDb.collection('coupons')
      .where('code', '==', normalizedCode)
      .where('isActive', '==', true)
      .get();

    if (snapshot.empty) {
      return { success: false, message: 'Cupón no encontrado o inactivo.' };
    }

    const couponDoc = snapshot.docs[0];
    const coupon = { ...couponDoc.data(), id: couponDoc.id } as Coupon;
    const now = Date.now() / 1000; // seconds

    // 1. Check Dates
    const startSeconds = coupon.startDate?.seconds ?? coupon.startDate?._seconds ?? 0;
    const endSeconds = coupon.endDate?.seconds ?? coupon.endDate?._seconds ?? 0;

    if (now < startSeconds) {
      return { success: false, message: 'El cupón aún no está vigente.' };
    }
    if (now > endSeconds) {
      return { success: false, message: 'El cupón ha expirado.' };
    }

    // 2. Check Global Usage Limit
    if (coupon.usageCount >= coupon.usageLimit) {
      return { success: false, message: 'El cupón ha alcanzado su límite de usos.' };
    }

    // 3. Check "One use per user"
    if (coupon.usedBy?.includes(userId)) {
      return { success: false, message: 'Ya has utilizado este cupón.' };
    }

    // Calculate Discount
    let discountAmount = 0;
    if (coupon.type === 'fixed') {
      discountAmount = coupon.value;
    } else {
      discountAmount = (orderTotal * coupon.value) / 100;
    }

    return { 
      success: true, 
      couponId: coupon.id,
      code: coupon.code,
      discountAmount: Math.min(discountAmount, orderTotal), // Never discount more than total
      message: 'Cupón aplicado con éxito.' 
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { success: false, message: 'Error al validar el cupón.' };
  }
}

/**
 * Increments the usage count and adds the user to usedBy.
 * This should be called AFTER a successful payment/order creation.
 * User-facing, no admin auth required.
 */
export async function recordCouponUsage(couponId: string, userId: string) {
  if (!adminDb) return { success: false };

  try {
    const couponRef = adminDb.collection('coupons').doc(couponId);
    await couponRef.update({
      usageCount: FieldValue.increment(1),
      usedBy: FieldValue.arrayUnion(userId),
      updatedAt: FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error recording coupon usage:', error);
    return { success: false };
  }
}

// --- ADMIN CRUD ACTIONS (require admin idToken) ---

/**
 * Creates a new coupon.
 * SECURED: Requires admin idToken.
 */
export async function createCoupon(data: any, idToken: string) {
  if (!adminDb) return { success: false, message: 'Firebase Admin not initialized' };

  try {
    await verifyAdmin(idToken);

    const validated = couponSchema.parse(data);
    
    // Check for duplicate code
    const existing = await adminDb.collection('coupons')
      .where('code', '==', validated.code)
      .get();

    if (!existing.empty) {
      return { success: false, message: 'Este código de cupón ya existe.' };
    }

    await adminDb.collection('coupons').add({
      ...validated,
      startDate: new Date(validated.startDate),
      endDate: new Date(validated.endDate),
      usageCount: 0,
      usedBy: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    return { success: true, message: 'Cupón creado correctamente.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al crear el cupón.' };
  }
}

/**
 * Toggles the active status of a coupon.
 * SECURED: Requires admin idToken.
 */
export async function toggleCouponStatus(id: string, active: boolean, idToken: string) {
  if (!adminDb) return { success: false };

  try {
    await verifyAdmin(idToken);

    await adminDb.collection('coupons').doc(id).update({
      isActive: active,
      updatedAt: FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al cambiar estado.' };
  }
}

/**
 * Deletes a coupon.
 * SECURED: Requires admin idToken.
 */
export async function deleteCoupon(id: string, idToken: string) {
  if (!adminDb) return { success: false };

  try {
    await verifyAdmin(idToken);

    await adminDb.collection('coupons').doc(id).delete();
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al eliminar cupón.' };
  }
}
