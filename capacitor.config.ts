import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mismo.estuclub',
  appName: 'EstuClub',
  webDir: 'out',
  server: {
    // The app loads directly from the production website.
    // Any code change deployed to Firebase App Hosting is instantly
    // reflected in the Android app without needing a Play Store update.
    url: 'https://estuclub.com.ar',
    cleartext: false,
  },
};

export default config;
