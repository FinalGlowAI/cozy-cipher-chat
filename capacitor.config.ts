import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f66e1707c50749ffa59b47c04e9e2425',
  appName: 'cozy-cipher-chat',
  webDir: 'dist',
  server: {
    url: 'https://f66e1707-c507-49ff-a59b-47c04e9e2425.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      // Replace with your actual iOS Client ID from Google Cloud Console
      iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
      // For Android, use the web client ID
      serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
