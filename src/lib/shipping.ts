/**
 * Estuclub Logistics Engine
 * Calculates real-time shipping rates using Google Distance Matrix API
 */

const BASE_RATE = 1400; // $1.400 Base
const PER_KM_RATE = 500; // $500 per additional km
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface ShippingRateResponse {
    distanceKm: number;
    durationMin: number;
    rate: number;
    success: boolean;
}

/**
 * Calculates the shipping rate between two points
 * @param origin - Coordinates or address (Cluber/Store)
 * @param destination - Coordinates or address (User/Student)
 */
export async function getLiveShippingRate(origin: string, destination: string): Promise<ShippingRateResponse> {
    try {
        if (!GOOGLE_MAPS_API_KEY) {
            throw new Error('Missing Google Maps API Key');
        }

        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' || !data.rows[0].elements[0].distance) {
            console.error('Distance Matrix Error:', data);
            return { distanceKm: 0, durationMin: 0, rate: BASE_RATE, success: false };
        }

        const distanceValue = data.rows[0].elements[0].distance.value; // in meters
        const durationValue = data.rows[0].elements[0].duration.value; // in seconds
        
        const distanceKm = distanceValue / 1000;
        const durationMin = Math.ceil(durationValue / 60);

        // Formula: $1.400 + ($500 * (km - 1)) if km > 1
        let rate = BASE_RATE;
        if (distanceKm > 1) {
            rate += (distanceKm - 1) * PER_KM_RATE;
        }

        return {
            distanceKm: parseFloat(distanceKm.toFixed(2)),
            durationMin,
            rate: Math.round(rate),
            success: true
        };
    } catch (error) {
        console.error('getLiveShippingRate Error:', error);
        return { distanceKm: 0, durationMin: 0, rate: BASE_RATE, success: false };
    }
}
