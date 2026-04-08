import { z } from 'zod';

/**
 * Schema for Rider Applications
 */
export const RiderApplicationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  email: z.string().email("Invalid email format"),
  userName: z.string().min(2, "Name is too short"),
  phone: z.string().min(8, "Phone number is too short"),
  dni: z.string().min(7, "DNI is too short"),
  patente: z.string().min(6, "Patente is too short"),
  vehicleType: z.enum(['bici', 'moto', 'auto']).optional(),
  fotoRostroUrl: z.string().url().optional(),
  fotoVehiculoUrl: z.string().url().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});

/**
 * Schema for Supplier Requests
 */
export const SupplierRequestSchema = z.object({
  userId: z.string().min(1),
  supplierName: z.string().min(2, "Name is too short"),
  category: z.string().min(1),
  address: z.string().min(5, "Address is too short"),
  commercialPhone: z.string().min(8),
  logo: z.string().url().optional().or(z.literal('')),
  fachada: z.string().url().optional().or(z.literal('')),
});

/**
 * Schema for User Profiles
 */
export const UserProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['admin', 'supplier', 'rider', 'student', 'rider_pending', 'rider_rejected']),
  phone: z.string().optional(),
  storeName: z.string().optional(),
  isVerified: z.boolean().default(false),
  isOnline: z.boolean().optional(),
});

/**
 * Schema for Delivery Orders
 */
export const OrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  items: z.array(z.any()),
  total: z.number().positive(),
  status: z.enum(['pending', 'assigned', 'at_store', 'on_the_way', 'delivered', 'completed', 'cancelled']),
  deliveryAddress: z.string().min(5),
  riderId: z.string().optional(),
  paymentMethod: z.enum(['cash', 'mercado_pago', 'wallet']),
  createdAt: z.any(),
});
