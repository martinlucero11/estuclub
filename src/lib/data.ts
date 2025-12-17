
import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';
import type { Timestamp } from 'firebase/firestore';

export type PerkCategory = 'Comercios' | 'Eventos' | 'Comida' | 'Educación' | 'Entretenimiento';

export interface Perk {
  id: string;
  title: string;
  description: string;
  category: PerkCategory;
  image: string;
  imageUrl: string;
  location?: string;
  ownerId?: string; // To track which supplier created the benefit
  createdAt?: Timestamp;
  points: number;
  redemptionLimit?: number;
  validUntil?: Timestamp;
  availableDays?: string[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
}


export const perkCategories: PerkCategory[] = ['Comercios', 'Eventos', 'Comida', 'Educación', 'Entretenimiento'];

// This is now just for initial data seeding or as a fallback.
// The app will primarily use Firestore.
export const perks: Perk[] = [
  { id: '2', title: 'Entradas Indie Fest 2024', description: 'Acceso anticipado al festival de música indie más grande del año.', category: 'Eventos', image: 'concert-ticket', imageUrl: 'https://images.unsplash.com/photo-1709090083073-d130ac28cc19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8bXVzaWMlMjBjb25jZXJ0fGVufDB8fHx8MTc2NTIzNTk0Nnww&ixlib=rb-4.1.0&q=80&w=1080', location: 'City Park', points: 100 },
  { id: '3', title: '50% Off en Ropa de Verano', description: 'Renueva tu guardarropa con grandes descuentos en las últimas tendencias.', category: 'Comercios', image: 'clothing-sale', imageUrl: 'https://images.unsplash.com/photo-1555529771-835f59fc5efe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxjbG90aGluZyUyMHN0b3JlfGVufDB8fHx8MTc2NTIyNzIxNnww&ixlib=rb-4.1.0&q=80&w=1080', location: 'Mall Center', points: 75 },
  { id: '7', title: 'Taller de Oratoria', description: 'Mejora tus habilidades de presentación en este taller gratuito.', category: 'Eventos', image: 'event-speaker', imageUrl: 'https://images.unsplash.com/photo-1626125345510-4603468eedfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxjb25mZXJlbmNlJTIwc3BlYWtlcnxlbnwwfHx8fDE3NjUyMDg0NTF8MA&ixlib=rb-4.1.0&q=80&w=1080', location: 'University Auditorium', points: 10 },
];
