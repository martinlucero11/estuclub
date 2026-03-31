import { NextResponse } from 'next/server';
import { Preference } from 'mercadopago';
import { mpClient } from '@/lib/mercadopago';
import { calculateDistance } from '@/lib/google-maps';

/**
 * CORE CHECKOUT API: Estuclub Marketplace Engine
 * Logic: Triple Split Payments
 * - Estuclub Fee: $500 (Platform service)
 * - Cluber: Item subtotals
 * - Rider: Shipping cost (Calculated by Google Maps Matrix)
 */

const SERVICE_FEE_PERCENTAGE = 0.05; // 5% Platform Fee
const SHIPPING_BASE = 1600;
const SHIPPING_PER_KM = 500;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { orderId, items, supplierId, totalSubtotal, origin, destination } = body;

        if (!orderId || !items || !supplierId || !origin || !destination) {
            return NextResponse.json({ error: "Missing required checkout parameters" }, { status: 400 });
        }

        // 1. Precise Logistics Calculation
        const logistics = await calculateDistance(origin, destination);
        
        let shippingFee = SHIPPING_BASE;
        if (logistics.success && logistics.distanceKm > 1) {
            shippingFee += Math.ceil(logistics.distanceKm - 1) * SHIPPING_PER_KM;
        }

        // 2. Business Logic: 5% Service Fee on (Products + Shipping)
        const serviceFee = Math.round((totalSubtotal + shippingFee) * SERVICE_FEE_PERCENTAGE);
        
        // Estuclub keeps: Service Fee + Shipping Fee (to pay the Rider later)
        const estuclubShare = serviceFee + shippingFee;
        const totalToCharge = totalSubtotal + estuclubShare;

        // 3. Create Preference with Mercado Pago V2 SDK
        const preference = new Preference(mpClient);
        
        // Final Sanity Check for URLs (Clean potential trailing slashes)
        const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');

        const response = await preference.create({
            body: {
                items: [
                    ...items.map((item: any) => ({
                        id: item.id || item.productId,
                        title: item.name,
                        quantity: item.quantity,
                        unit_price: Math.round(item.price),
                        currency_id: 'ARS'
                    })),
                    {
                        id: 'shipping_stcl',
                        title: 'Logística de Envío Estuclub 🏍️',
                        quantity: 1,
                        unit_price: Math.round(shippingFee),
                        currency_id: 'ARS'
                    },
                    {
                        id: 'platform_stcl',
                        title: 'Tarifa de Gestión Estuclub ✨',
                        quantity: 1,
                        unit_price: Math.round(serviceFee),
                        currency_id: 'ARS'
                    }
                ],
                back_urls: {
                    success: `${baseUrl}/orders/${orderId}`,
                    failure: `${baseUrl}/delivery`,
                    pending: `${baseUrl}/orders/${orderId}`,
                },
                auto_return: 'approved',
                notification_url: `${baseUrl}/api/webhooks/mercadopago`,
                marketplace_fee: Math.round(estuclubShare), 
                external_reference: orderId,
                metadata: {
                    order_id: orderId,
                    supplier_id: supplierId,
                    cluber_net: totalSubtotal,
                    rider_net: shippingFee,
                    estuclub_net: serviceFee,
                    distance_km: logistics.distanceKm,
                    type: "delivery_order"
                }
            }
        });

        return NextResponse.json({ 
            id: response.id, 
            preference_id: response.id, 
            init_point: response.init_point,
            logistics: {
                distanceKm: logistics.distanceKm,
                shippingFee,
                serviceFee
            }
        });

    } catch (error: any) {
        console.error('Master App Checkout Error:', error);
        return NextResponse.json({ error: "Internal payment processing error" }, { status: 500 });
    }
}
