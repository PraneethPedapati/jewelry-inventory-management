import { config } from '../config/app';

export interface BrandConfig {
  companyName: string;
  companyShortName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  logoUrl: string;
  faviconUrl: string;
  // primaryColor: string;
  // secondaryColor: string;
}

/**
 * Get brand configuration from environment variables
 */
export const getBrandConfig = (): BrandConfig => {
  return {
    companyName: config.COMPANY_NAME,
    companyShortName: config.COMPANY_SHORT_NAME,
    description: config.COMPANY_DESCRIPTION,
    contactEmail: config.CONTACT_EMAIL,
    contactPhone: config.CONTACT_PHONE,
    website: config.WEBSITE,
    logoUrl: config.LOGO_URL,
    faviconUrl: config.FAVICON_URL,
    // primaryColor: config.PRIMARY_COLOR,
    // secondaryColor: config.SECONDARY_COLOR,
  };
};

/**
 * Get company name for use in messages and notifications
 */
export const getCompanyName = (): string => {
  return config.COMPANY_NAME;
};

/**
 * Get company short name for use in compact displays
 */
export const getCompanyShortName = (): string => {
  return config.COMPANY_SHORT_NAME;
}; 
