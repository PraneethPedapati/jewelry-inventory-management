import axios from 'axios';

// API Configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Theme API Services
export const themeService = {
  // Get all themes
  getThemes: async (): Promise<ColorTheme[]> => {
    const response = await apiClient.get<ApiResponse<ColorTheme[]>>('/api/themes');
    return response.data.data;
  },

  // Get active theme
  getActiveTheme: async (): Promise<ColorTheme | null> => {
    const themes = await themeService.getThemes();
    return themes.find(theme => theme.isActive) || null;
  },

  // Set active theme (admin only)
  setActiveTheme: async (themeId: string): Promise<void> => {
    await apiClient.post('/api/themes/activate', { themeId });
  },
};

// Health check
export const healthService = {
  check: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/health');
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  },
};

export default apiClient; 
