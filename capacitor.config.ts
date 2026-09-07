import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fluxofinanceiro.app',
  appName: 'Fluxo Financeiro',
  webDir: 'dist',
  android: {
    path: 'mobile'
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
