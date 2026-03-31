import { Client, DistanceMatrixResponseData, TravelMode, UnitSystem } from "@googlemaps/google-maps-services-js";

/**
 * Google Maps SDK Client
 * Centralized instance for server-side operations
 */
export const googleMapsClient = new Client({});
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

/**
 * Calculates real-distance in KM between two points
 * @param origin Address or coordinates
 * @param destination Address or coordinates
 * @returns distance in KM and estimated duration
 */
export async function calculateDistance(origin: string, destination: string) {
  try {
    const response = await googleMapsClient.distancematrix({
      params: {
        origins: [origin],
        destinations: [destination],
        mode: TravelMode.driving,
        units: UnitSystem.metric,
        key: GOOGLE_MAPS_API_KEY,
      },
      timeout: 5000,
    });

    const data: DistanceMatrixResponseData = response.data;

    if (data.status !== "OK" || !data.rows[0].elements[0].distance) {
      throw new Error(`Distance computation failed: ${data.status}`);
    }

    const row = data.rows[0].elements[0];
    return {
      distanceKm: row.distance.value / 1000,
      durationMin: Math.ceil(row.duration.value / 60),
      success: true,
    };
  } catch (error) {
    console.error("calculateDistance Error:", error);
    return { distanceKm: 0, durationMin: 0, success: false };
  }
}
