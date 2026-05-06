import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

if (!MP_ACCESS_TOKEN) {
    console.error('Error: MP_ACCESS_TOKEN is missing in environment variables.');
    process.exit(1);
}

const API_URL = 'https://api.mercadopago.com/preapproval_plan';

// Use environment variable for base URL or default to localhost
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const planes = [
  {
    reason: "Estuclub Rider",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 25000,
      currency_id: "ARS",
      free_trial: { frequency: 7, frequency_type: "days" }
    },
    back_url: "https://estuclub.com.ar/api/mp/callback"
  },
  {
    reason: "Estuclub Cluber Básico",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 25000,
      currency_id: "ARS"
    },
    back_url: "https://estuclub.com.ar/api/mp/callback"
  },
  {
    reason: "Estuclub Cluber Plus",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 35000,
      currency_id: "ARS"
    },
    back_url: "https://estuclub.com.ar/api/mp/callback"
  },
  {
    reason: "Estuclub Cluber Pro",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 50000,
      currency_id: "ARS"
    },
    back_url: "https://estuclub.com.ar/api/mp/callback"
  }
];

async function createPlans() {
    console.log('Creando planes de suscripción en Mercado Pago...');
    
    for (const plan of planes) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
                },
                body: JSON.stringify(plan)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Error al crear el plan "${plan.reason}":`, errorData);
                continue;
            }

            const data = await response.json();
            console.log(`✅ Plan creado con éxito: ${plan.reason}`);
            console.log(`ID del plan: ${data.id}`);
            console.log('---');
        } catch (error) {
            console.error(`Error inesperado al crear el plan "${plan.reason}":`, error);
        }
    }
    
    console.log('Terminado. Por favor copia los IDs y agrégalos a tu archivo .env.local como:');
    console.log('MP_PLAN_RIDER=...');
    console.log('MP_PLAN_CLUBER_BASIC=...');
    console.log('MP_PLAN_CLUBER_PLUS=...');
    console.log('MP_PLAN_CLUBER_PRO=...');
}

createPlans();
