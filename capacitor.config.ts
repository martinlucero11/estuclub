import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.estuclub.app',
  appName: 'EstuClub',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#D44459",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
      useDialog: true,
      layoutName: "launch_screen",
      androidSpinnerStyle: "large",
      splashSpinnerStyle: 'large',
      spinnerColor: '#ffffff',
      showSpinner: true,
    }
  }
};

export default config;
