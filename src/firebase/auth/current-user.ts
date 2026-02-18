import { cookies } from 'next/headers';

export interface User {
  uid: string;
  email: string | null;
  roles: string[];
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('__session');

  if (!sessionCookie) {
    return null; // Si no hay cookie, no hay usuario. ¡Seguro!
  }

  // AQUÍ VA LA MAGIA: 
  // En el futuro, decodificaremos el token real.
  // Por ahora, devolvemos NULL para obligar al login en el cliente, 
  // o si tienes lógica de cookies implementada, la usas.
  
  // Para evitar el error "Usuario falso visible para todos", devolvemos null por defecto
  // hasta que conectes la validación de token de Firebase Admin.
  return null; 
}
