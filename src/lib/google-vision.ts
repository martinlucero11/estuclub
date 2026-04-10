import { ImageAnnotatorClient } from '@google-cloud/vision';

/**
 * Robust initialization of the Google Cloud Vision client.
 * Uses the service account credentials from the environment.
 */
export function getVisionClient() {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  
  let options = {};
  
  if (base64) {
    try {
      const credentials = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
      options = { credentials };
      console.log("[VISION] Client initialized via Service Account Base64");
    } catch (error) {
      console.error("[VISION] Failed to parse Service Account Base64", error);
    }
  } else {
    console.warn("[VISION] No Service Account provided, falling back to default ambient credentials");
  }

  return new ImageAnnotatorClient(options);
}
