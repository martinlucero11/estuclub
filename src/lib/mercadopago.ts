import { MercadoPagoConfig } from 'mercadopago';

/**
 * Mercado Pago SDK V2 Configuration
 * Using standard environment variables for production (Marketplace/Split)
 */
export const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || "", 
    options: { timeout: 10000, idempotencyKey: 'estuclub-unique-key' }
});

export const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || "";
export const MP_APP_ID = process.env.MP_APP_ID || "";
export const MP_USER_ID = process.env.MP_USER_ID || "";
