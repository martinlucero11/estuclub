import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mismo.estuclub',
  appName: 'EstuClub',
  webDir: 'out',
  server: {
    url: 'https://estuclub.com.ar',
    allowNavigation: ['estuclub.com.ar']
  }
};

export default config;
