import { NextResponse } from "next/server";
import { calculateDistance } from "@/lib/google-maps";

/**
 * Logistics API: Estuclub Dynamic Shipping Rate Engine
 * Formula: $1600 (Base) + $500 per additional km
 */

const BASE_RATE = 1600;
const PER_KM_RATE = 500;

export async function POST(req: Request) {
  try {
    const { origin, destination } = await req.json();

    if (!origin || !destination) {
      return NextResponse.json({ error: "Missing origin or destination" }, { status: 400 });
    }

    const { distanceKm, durationMin, success } = await calculateDistance(origin, destination);

    if (!success) {
      throw new Error("Could not calculate logistics");
    }

    // Formula execution
    let rate = BASE_RATE;
    if (distanceKm > 1) {
      rate += Math.ceil(distanceKm - 1) * PER_KM_RATE;
    }

    return NextResponse.json({
      rate: Math.round(rate),
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      durationMin,
      success: true
    });

  } catch (error) {
    console.error("Shipping API Error:", error);
    return NextResponse.json({ error: "Logistics failed", rate: BASE_RATE, success: false }, { status: 500 });
  }
}
