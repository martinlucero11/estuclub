import { NextResponse } from 'next/server';

/**
 * SECURE SHIPPING ENGINE (Server-Side)
 * Protection for Google Maps Billing & Business Logic
 */

const BASE_RATE = 1400;   // Arancel base por envío
const PER_KM_RATE = 500;  // Extra por cada km excedente del primero

export async function POST(req: Request) {
    try {
        const { origin, destination } = await req.json();

        if (!origin || !destination) {
            return NextResponse.json({ error: 'Origin and destination are required' }, { status: 400 });
        }

        // 1. Usar API Key privada (no expuesta al cliente)
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
            console.error("CRITICAL: GOOGLE_MAPS_API_KEY is not defined in the environment.");
            return NextResponse.json({ error: 'Logística temporalmente no disponible' }, { status: 500 });
        }

        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();

        // 2. Manejo de Errores de Google
        if (data.status !== 'OK' || !data.rows[0].elements[0].distance) {
            console.error('Distance Matrix API Error:', data);
            return NextResponse.json({ 
                success: false, 
                rate: BASE_RATE, 
                distanceKm: 0,
                message: 'No se pudo calcular la distancia exacta'
            });
        }

        const element = data.rows[0].elements[0];
        
        if (element.status !== 'OK') {
             return NextResponse.json({ 
                success: false, 
                rate: BASE_RATE, 
                distanceKm: 0,
                message: 'Dirección fuera de rango o inválida'
            });
        }

        const distanceValue = element.distance.value; // en metros
        const durationValue = element.duration.value; // en segundos
        
        const distanceKm = distanceValue / 1000;
        const durationMin = Math.ceil(durationValue / 60);

        // 3. Aplicar Fórmula de Tarifas Estuclub
        // Formula: $1.400 + ($500 * (km - 1)) solo si km > 1
        let rate = BASE_RATE;
        if (distanceKm > 1) {
            rate += (distanceKm - 1) * PER_KM_RATE;
        }

        // 4. Retornar Resultado Seguro
        return NextResponse.json({
            success: true,
            distanceKm: parseFloat(distanceKm.toFixed(2)),
            durationMin,
            rate: Math.round(rate)
        });

    } catch (error: any) {
        console.error('Shipping calculation exception:', error);
        return NextResponse.json({ 
            success: false, 
            rate: BASE_RATE, 
            error: 'Internal logistics error' 
        }, { status: 500 });
    }
}

