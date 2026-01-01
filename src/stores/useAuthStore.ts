// stores/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GoogleIntegration {
  isConnected: boolean;
  accessToken?: string;
  refreshToken?: string;
  email?: string;
  userName?: string;
  fullName?: string;  // Fixed: was 'fullName: boolean'
  photo?: string;
  connectedAt?: string;
}

interface ZoomIntegration {
  isConnected: boolean;
  accessToken?: string;
  refreshToken?: string;
  email?: string;
  userName?: string;
  fullName?: string;
  photo?: string;
  connectedAt?: string;
}

interface AuthState {
  googleIntegration: GoogleIntegration;
  zoomIntegration: ZoomIntegration;
  
  // Actions
  connectGoogle: (integrationData: Omit<GoogleIntegration, 'isConnected'>) => void;
  disconnectGoogle: () => void;
  checkGoogleConnection: () => boolean;
  
  connectZoom: (integrationData: Omit<ZoomIntegration, 'isConnected'>) => void;
  disconnectZoom: () => void;
  checkZoomConnection: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      googleIntegration: {
        isConnected: false,
      },
      zoomIntegration: {
        isConnected: false,
      },

      // Connect Google account
      connectGoogle: (integrationData) =>
        set({
          googleIntegration: {
            ...integrationData,
            isConnected: true,
            connectedAt: new Date().toISOString(),
          }
        }),

      // Disconnect Google account
      disconnectGoogle: () =>
        set({
          googleIntegration: {
            isConnected: false,
            accessToken: undefined,
            refreshToken: undefined,
            email: undefined,
            userName: undefined,
            fullName: undefined,
            photo: undefined,
            connectedAt: undefined,
          }
        }),

      // Check if Google is connected
      checkGoogleConnection: () => {
        const state = get();
        return state.googleIntegration.isConnected;
      },

      // Connect Zoom account
      connectZoom: (integrationData) =>
        set({
          zoomIntegration: {
            ...integrationData,
            isConnected: true,
            connectedAt: new Date().toISOString(),
          }
        }),

      // Disconnect Zoom account
      disconnectZoom: () =>
        set({
          zoomIntegration: {
            isConnected: false,
            accessToken: undefined,
            refreshToken: undefined,
            email: undefined,
            userName: undefined,
            fullName: undefined,
            photo: undefined,
            connectedAt: undefined,
          }
        }),

      // Check if Zoom is connected
      checkZoomConnection: () => {
        const state = get();
        return state.zoomIntegration.isConnected;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);