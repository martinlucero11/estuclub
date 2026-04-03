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
export const MP_CLIENT_SECRET = process.env.MP_CLIENT_SECRET || "";

export const MP_REDIRECT_URI = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000/api/auth/mercadopago/callback'
    : 'https://estuclub.com.ar/api/auth/mercadopago/callback';

export const getMPOAuthUrl = (state: string) => {
    return `https://auth.mercadopago.com/authorization?client_id=${MP_APP_ID}&response_type=code&platform_id=mp&state=${state}&redirect_uri=${encodeURIComponent(MP_REDIRECT_URI)}`;
};

