import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BrandConfig {
  companyName: string;
  companyShortName: string;
  logoUrl: string;
  logoAlt: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
}

interface BrandStore {
  config: BrandConfig;
  isLoading: boolean;
  error: string | null;
  updateConfig: (updates: Partial<BrandConfig>) => void;
  resetToDefault: () => void;
  loadFromServer: () => Promise<void>;
  saveToServer: () => Promise<void>;
}

// Default configuration
const defaultConfig: BrandConfig = {
  companyName: 'Elegant Jewelry Store',
  companyShortName: 'EJS',
  logoUrl: '/logo.png',
  logoAlt: 'Elegant Jewelry Store Logo',
  faviconUrl: '/favicon.ico',
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  description: 'Premium jewelry collection with elegant designs',
  contactEmail: 'info@elegantjewelry.com',
  contactPhone: '+91-9876543210',
  website: 'https://elegantjewelry.com'
};

export const useBrandStore = create<BrandStore>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      isLoading: false,
      error: null,

      updateConfig: (updates: Partial<BrandConfig>) => {
        set((state) => ({
          config: { ...state.config, ...updates }
        }));

        // Update document title and favicon
        const newConfig = { ...get().config, ...updates };
        document.title = newConfig.companyName;

        // Update favicon if changed
        if (updates.faviconUrl) {
          const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
          if (favicon) {
            favicon.href = updates.faviconUrl;
          }
        }
      },

      resetToDefault: () => {
        set({ config: defaultConfig });
        document.title = defaultConfig.companyName;
      },

      loadFromServer: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/config/brand');
          if (response.ok) {
            const serverConfig = await response.json();
            set({ config: { ...defaultConfig, ...serverConfig }, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          set({ error: 'Failed to load brand configuration', isLoading: false });
        }
      },

      saveToServer: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/config/brand', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(get().config)
          });

          if (response.ok) {
            set({ isLoading: false });
          } else {
            set({ error: 'Failed to save brand configuration', isLoading: false });
          }
        } catch (error) {
          set({ error: 'Failed to save brand configuration', isLoading: false });
        }
      }
    }),
    {
      name: 'brand-config',
      partialize: (state) => ({ config: state.config })
    }
  )
); 
