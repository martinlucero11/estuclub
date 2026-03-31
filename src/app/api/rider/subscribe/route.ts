import { NextResponse } from "next/server";
import { Preference } from 'mercadopago';
import { mpClient } from "@/lib/mercadopago";
import { adminDb } from "@/firebase/admin";

/**
 * Rider Subscription API
 * Purpose: One-month full Rider Membership ($25,000)
 */

export async function POST(req: Request) {
  try {
    const { riderId, email } = await req.json();

    if (!riderId || !email) {
      return NextResponse.json({ error: "Missing identity" }, { status: 400 });
    }

    const preference = new Preference(mpClient);

    const preferenceData = {
      body: {
        items: [
          {
            id: 'rider_subscription_1m',
            title: 'Membresía Rider Estuclub - 1 Mes',
            unit_price: 25000,
            quantity: 1,
            description: "Acceso ilimitado a pedidos de delivery por 30 días",
            currency_id: 'ARS'
          }
        ],
        payer: {
          email: email
        },
        metadata: {
          rider_id: riderId,
          type: "subscription_rider"
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/rider`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/rider/wallet`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/rider`
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`
      }
    };

    const response = await preference.create(preferenceData);

    return NextResponse.json({
      init_point: response.init_point,
      preference_id: response.id
    });

  } catch (error) {
    console.error("Subscription API Error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
