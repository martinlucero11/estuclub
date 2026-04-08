'use server';

import { db } from '@/firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  Timestamp,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { Coupon } from '@/types/data';
import { z } from 'zod';

// Security: Check for Admin role (assuming we have a utility or session)
// For now, we'll implement the logic and leave hooks for role verification

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
 */
export async function validateCoupon(code: string, userId: string, orderTotal: number) {
  try {
    const normalizedCode = code.trim().toUpperCase();
    const q = query(collection(db, 'coupons'), where('code', '==', normalizedCode), where('isActive', '==', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { success: false, message: 'Cupón no encontrado o inactivo.' };
    }

    const couponDoc = snapshot.docs[0];
    const coupon = { ...couponDoc.data(), id: couponDoc.id } as Coupon;
    const now = Timestamp.now();

    // 1. Check Dates
    if (now.seconds < coupon.startDate.seconds) {
      return { success: false, message: 'El cupón aún no está vigente.' };
    }
    if (now.seconds > coupon.endDate.seconds) {
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
 */
export async function recordCouponUsage(couponId: string, userId: string) {
  try {
    const couponRef = doc(db, 'coupons', couponId);
    await updateDoc(couponRef, {
      usageCount: increment(1),
      usedBy: arrayUnion(userId),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error recording coupon usage:', error);
    return { success: false };
  }
}

// --- ADMIN CRUD ACTIONS ---

export async function createCoupon(data: any) {
  try {
    const validated = couponSchema.parse(data);
    
    // Check for duplicate code
    const q = query(collection(db, 'coupons'), where('code', '==', validated.code));
    const existing = await getDocs(q);
    if (!existing.empty) {
      return { success: false, message: 'Este código de cupón ya existe.' };
    }

    await addDoc(collection(db, 'coupons'), {
      ...validated,
      startDate: Timestamp.fromDate(validated.startDate),
      endDate: Timestamp.fromDate(validated.endDate),
      usageCount: 0,
      usedBy: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true, message: 'Cupón creado correctamente.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Error al crear el cupón.' };
  }
}

export async function toggleCouponStatus(id: string, active: boolean) {
  try {
    await updateDoc(doc(db, 'coupons', id), {
      isActive: active,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function deleteCoupon(id: string) {
  try {
    await deleteDoc(doc(db, 'coupons', id));
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
