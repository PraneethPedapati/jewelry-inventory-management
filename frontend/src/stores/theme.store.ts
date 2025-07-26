import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { themeService, type ColorTheme as ApiColorTheme } from '../services/api';

export interface ColorTheme {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  isDefault: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    border: string;
    input: string;
    ring: string;
    muted: string;
    mutedForeground: string;
    destructive: string;
    destructiveForeground: string;
    success: string;
    successForeground: string;
    warning: string;
    warningForeground: string;
  };
  description?: string;
}

interface ThemeState {
  // Current active theme
  activeTheme: ColorTheme | null;

  // Available themes list
  availableThemes: ColorTheme[];

  // Loading states
  isLoading: boolean;
  isUpdating: boolean;

  // Actions
  setActiveTheme: (theme: ColorTheme) => void;
  loadThemes: () => Promise<void>;
  applyTheme: (theme: ColorTheme) => void;
  updateThemeColors: (colors: Partial<ColorTheme['colors']>) => void;
  resetToDefault: () => void;

  // Admin actions
  createTheme: (theme: Omit<ColorTheme, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTheme: (id: string, updates: Partial<ColorTheme>) => Promise<void>;
  deleteTheme: (id: string) => Promise<void>;
}

// Default theme colors (jewelry store appropriate)
const defaultTheme: ColorTheme = {
  id: 'default',
  name: 'default',
  displayName: 'Default Jewelry Theme',
  isActive: true,
  isDefault: true,
      colors: {
      primary: '#6c3158',      // Dark magenta - updated color
      secondary: '#F59E0B',    // Gold accent
      accent: '#EC4899',       // Pink accent for feminine touch
      background: '#FFFFFF',   // Clean white background
      foreground: '#1F2937',   // Dark gray text
      card: '#F9FAFB',        // Light gray cards
      cardForeground: '#111827', // Dark card text
      border: '#E5E7EB',      // Light borders
      input: '#FFFFFF',       // White inputs
      ring: '#6c3158',        // Focus ring matches primary
    muted: '#F3F4F6',       // Muted backgrounds
    mutedForeground: '#6B7280', // Muted text
    destructive: '#EF4444',  // Red for destructive actions
    destructiveForeground: '#FFFFFF', // White text on red
    success: '#10B981',      // Green for success
    successForeground: '#FFFFFF', // White text on green
    warning: '#F59E0B',      // Amber for warnings
    warningForeground: '#FFFFFF', // White text on amber
  },
  description: 'Default elegant theme for jewelry store'
};

// Seasonal theme examples
const seasonalThemes: ColorTheme[] = [
  {
    id: 'valentine',
    name: 'valentine',
    displayName: 'Valentine\'s Collection',
    isActive: false,
    isDefault: false,
    colors: {
      ...defaultTheme.colors,
      primary: '#EC4899',      // Pink primary
      secondary: '#DC2626',    // Red secondary
      accent: '#F97316',       // Orange accent
    },
    description: 'Romantic theme for Valentine\'s Day collection'
  },
  {
    id: 'summer',
    name: 'summer',
    displayName: 'Summer Vibes',
    isActive: false,
    isDefault: false,
    colors: {
      ...defaultTheme.colors,
      primary: '#06B6D4',      // Cyan primary
      secondary: '#F59E0B',    // Gold secondary
      accent: '#84CC16',       // Lime accent
    },
    description: 'Bright and vibrant theme for summer collection'
  },
  {
    id: 'luxury',
    name: 'luxury',
    displayName: 'Luxury Collection',
    isActive: false,
    isDefault: false,
    colors: {
      ...defaultTheme.colors,
      primary: '#1F2937',      // Dark gray primary
      secondary: '#F59E0B',    // Gold secondary
      accent: '#8B5CF6',       // Purple accent
      background: '#FAFAFA',   // Off-white background
    },
    description: 'Sophisticated theme for luxury jewelry pieces'
  }
];

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      activeTheme: defaultTheme,
      availableThemes: [defaultTheme, ...seasonalThemes],
      isLoading: false,
      isUpdating: false,

      setActiveTheme: (theme: ColorTheme) => {
        set({ activeTheme: theme });
        get().applyTheme(theme);
      },

      loadThemes: async () => {
        set({ isLoading: true });
        try {
          const themes = await themeService.getThemes();
          const activeTheme = themes.find(theme => theme.isActive) || themes.find(theme => theme.isDefault) || themes[0];

          set({
            availableThemes: themes,
            activeTheme,
            isLoading: false
          });

          // Apply the active theme immediately
          if (activeTheme) {
            get().applyTheme(activeTheme);
          }
        } catch (error) {
          console.error('Failed to load themes:', error);
          // Fallback to default themes if API fails
          set({
            availableThemes: [defaultTheme, ...seasonalThemes],
            activeTheme: defaultTheme,
            isLoading: false
          });
        }
      },

      applyTheme: (theme: ColorTheme) => {
        // Apply CSS custom properties to document root
        const root = document.documentElement;

        Object.entries(theme.colors).forEach(([key, value]) => {
          const cssProperty = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
          root.style.setProperty(cssProperty, value);
        });

        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', theme.colors.primary);
        }

        console.log(`🎨 Applied theme: ${theme.displayName}`);
      },

      updateThemeColors: (colors: Partial<ColorTheme['colors']>) => {
        const { activeTheme } = get();
        if (!activeTheme) return;

        const updatedTheme = {
          ...activeTheme,
          colors: { ...activeTheme.colors, ...colors }
        };

        set({ activeTheme: updatedTheme });
        get().applyTheme(updatedTheme);
      },

      resetToDefault: () => {
        const { availableThemes } = get();
        const defaultTheme = availableThemes.find(theme => theme.isDefault);
        if (defaultTheme) {
          get().setActiveTheme(defaultTheme);
        }
      },

      // Admin actions (to be implemented with API calls)
      createTheme: async (themeData) => {
        set({ isUpdating: true });
        try {
          // TODO: API call
          // const response = await themeService.createTheme(themeData);

          const newTheme: ColorTheme = {
            ...themeData,
            id: `custom-${Date.now()}`,
          };

          set(state => ({
            availableThemes: [...state.availableThemes, newTheme],
            isUpdating: false
          }));
        } catch (error) {
          console.error('Failed to create theme:', error);
          set({ isUpdating: false });
        }
      },

      updateTheme: async (id: string, updates: Partial<ColorTheme>) => {
        set({ isUpdating: true });
        try {
          // TODO: API call
          // await themeService.updateTheme(id, updates);

          set(state => ({
            availableThemes: state.availableThemes.map(theme =>
              theme.id === id ? { ...theme, ...updates } : theme
            ),
            isUpdating: false
          }));
        } catch (error) {
          console.error('Failed to update theme:', error);
          set({ isUpdating: false });
        }
      },

      deleteTheme: async (id: string) => {
        set({ isUpdating: true });
        try {
          // TODO: API call
          // await themeService.deleteTheme(id);

          set(state => ({
            availableThemes: state.availableThemes.filter(theme => theme.id !== id),
            isUpdating: false
          }));
        } catch (error) {
          console.error('Failed to delete theme:', error);
          set({ isUpdating: false });
        }
      },
    }),
    {
      name: 'jewelry-theme-store',
      partialize: (state) => ({
        activeTheme: state.activeTheme,
      }),
    }
  )
);

// Initialize theme on store creation
if (typeof window !== 'undefined') {
  const store = useThemeStore.getState();
  if (store.activeTheme) {
    store.applyTheme(store.activeTheme);
  }
} 
