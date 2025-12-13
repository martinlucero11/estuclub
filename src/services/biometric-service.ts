
'use client';

import { NativeBiometric } from 'capacitor-native-biometric';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/hooks/use-toast';

const CREDENTIALS_KEY = 'biometric_credentials';

class BiometricService {
  private isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isNativePlatform()) {
      return false;
    }
    try {
      const result = await NativeBiometric.isAvailable();
      return result.isAvailable;
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return false;
    }
  }

  private async saveCredentials(email: string, password: string): Promise<void> {
    const credentials = JSON.stringify({ email, password });
    // Use the `set` method from Capacitor Preferences to store credentials.
    // This is the recommended way to store sensitive data in a secure way.
    await NativeBiometric.setCredentials({
      username: email,
      password: password,
      server: 'com.estuclub.app', // Use app's bundle ID for server
    });
  }

  private async getCredentials(): Promise<{ email: string; password: string } | null> {
    // Use the `get` method to retrieve credentials.
    const credentials = await NativeBiometric.getCredentials({
      server: 'com.estuclub.app',
    });
    if (credentials.username && credentials.password) {
      return { email: credentials.username, password: credentials.password };
    }
    return null;
  }

  async askToSetupBiometrics(email: string, password: string): Promise<void> {
    if (!await this.isAvailable()) {
      return;
    }
    
    // This is a simplified approach. A better UX would use a custom dialog.
    const confirmSetup = confirm('¿Deseas configurar el inicio de sesión con huella digital o Face ID para un acceso más rápido?');
    
    if (confirmSetup) {
      try {
        await this.saveCredentials(email, password);
        toast({
            title: '¡Biometría Configurada!',
            description: 'Ahora puedes iniciar sesión con tu huella o rostro.',
        });
      } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Configuración de biometría cancelada',
        });
      }
    }
  }

  async loginWithBiometrics(): Promise<{ email: string; password: string } | null> {
     if (!await this.isAvailable()) {
      throw new Error('La autenticación biométrica no está disponible en este dispositivo.');
    }
    
    try {
      const credentials = await this.getCredentials();
      if (!credentials) {
        throw new Error('No hay credenciales guardadas. Inicia sesión con tu contraseña primero.');
      }

      await NativeBiometric.verifyIdentity({
        reason: 'Inicia sesión en EstuClub',
        title: 'Iniciar Sesión',
      });
      return credentials;
    } catch (error: any) {
      // User likely cancelled the biometric prompt
      console.log('Biometric authentication cancelled or failed.', error);
      throw new Error(error.message || 'Autenticación biométrica cancelada.');
    }
  }
}

export const biometricService = new BiometricService();
