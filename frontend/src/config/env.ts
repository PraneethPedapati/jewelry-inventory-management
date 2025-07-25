// Frontend environment configuration
export const env = {
  // Brand Configuration
  VITE_COMPANY_NAME: import.meta.env.VITE_COMPANY_NAME || 'Elegant Jewelry Store',
  VITE_COMPANY_SHORT_NAME: import.meta.env.VITE_COMPANY_SHORT_NAME || 'EJS',
  VITE_COMPANY_DESCRIPTION: import.meta.env.VITE_COMPANY_DESCRIPTION || 'Premium jewelry collection with elegant designs',
  VITE_CONTACT_EMAIL: import.meta.env.VITE_CONTACT_EMAIL || 'info@elegantjewelry.com',
  VITE_CONTACT_PHONE: import.meta.env.VITE_CONTACT_PHONE || '+91-9876543210',
  VITE_WEBSITE: import.meta.env.VITE_WEBSITE || 'https://elegantjewelry.com',
  VITE_LOGO_URL: import.meta.env.VITE_LOGO_URL || '/assets/logo.svg',
  VITE_FAVICON_URL: import.meta.env.VITE_FAVICON_URL || '/assets/favicon.svg',

  // API Configuration
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',

  // PWA Configuration
  VITE_PWA_NAME: import.meta.env.VITE_PWA_NAME || 'Elegant Jewelry Store',
  VITE_PWA_SHORT_NAME: import.meta.env.VITE_PWA_SHORT_NAME || 'EJS',
  VITE_PWA_DESCRIPTION: import.meta.env.VITE_PWA_DESCRIPTION || 'Premium jewelry collection with elegant designs',
  VITE_PWA_THEME_COLOR: import.meta.env.VITE_PWA_THEME_COLOR || '#8B5CF6',
  VITE_PWA_BACKGROUND_COLOR: import.meta.env.VITE_PWA_BACKGROUND_COLOR || '#ffffff',
} as const;

export type Env = typeof env; 
