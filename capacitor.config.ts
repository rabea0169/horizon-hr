import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.selim.hr',
  appName: 'سليم HR',
  webDir: 'dist/public',
  server: {
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#1a202c',
    allowMixedContent: false,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#1a202c',
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
