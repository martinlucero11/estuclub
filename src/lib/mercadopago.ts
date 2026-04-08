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
    ? 'http://localhost:3000/api/mp/callback'
    : 'https://estuclub.com.ar/api/mp/callback';

export const getMPOAuthUrl = (state: string) => {
    const clientId = process.env.NEXT_PUBLIC_MP_CLIENT_ID || process.env.NEXT_PUBLIC_MP_APP_ID || "";
    return `https://auth.mercadopago.com.ar/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${state}&redirect_uri=${encodeURIComponent(MP_REDIRECT_URI)}`;
};

