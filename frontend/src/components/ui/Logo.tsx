import React, { useState, useEffect } from 'react';
import { env } from '@/config/env';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'text' | 'icon' | 'full';
  showText?: boolean;
  className?: string;
}

interface BrandConfig {
  companyName: string;
  companyShortName: string;
  description: string;
  logoUrl: string;
  faviconUrl: string;
}

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'full',
  showText = true,
  className = ''
}) => {
  const [brandConfig, setBrandConfig] = useState<BrandConfig>({
    companyName: env.VITE_COMPANY_NAME, // Use frontend environment variable as default
    companyShortName: env.VITE_COMPANY_SHORT_NAME, // Use frontend environment variable as default
    description: env.VITE_COMPANY_DESCRIPTION || 'Premium jewelry collection with elegant designs',
    logoUrl: env.VITE_LOGO_URL, // Use frontend environment variable directly
    faviconUrl: env.VITE_FAVICON_URL // Use frontend environment variable directly
  });

  useEffect(() => {
    const fetchBrandConfig = async () => {
      try {
        const response = await fetch('/api/brand-config');
        if (response.ok) {
          const config = await response.json();
          setBrandConfig({
            ...config,
            logoUrl: env.VITE_LOGO_URL, // Always use frontend env var for logo
            faviconUrl: env.VITE_FAVICON_URL // Always use frontend env var for favicon
          });
        }
      } catch (error) {
        console.error('Failed to fetch brand config:', error);
        // Keep using frontend environment variables as fallback
        setBrandConfig({
          companyName: env.VITE_COMPANY_NAME,
          companyShortName: env.VITE_COMPANY_SHORT_NAME,
          description: env.VITE_COMPANY_DESCRIPTION || 'Premium jewelry collection with elegant designs',
          logoUrl: env.VITE_LOGO_URL,
          faviconUrl: env.VITE_FAVICON_URL
        });
      }
    };

    fetchBrandConfig();
  }, []);

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  if (variant === 'icon') {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src={brandConfig.logoUrl}
          alt={`${brandConfig.companyName} Logo`}
          className={`${sizeClasses[size]} rounded-full object-cover`}
          onError={(e) => {
            // Fallback to text if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <span className={`${textSizes[size]} font-bold text-primary hidden`}>
          {brandConfig.companyShortName}
        </span>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <span className={`${textSizes[size]} font-bold text-primary ${className}`}>
        {brandConfig.companyName}
      </span>
    );
  }

  // Full variant (icon + text)
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={brandConfig.logoUrl}
        alt={`${brandConfig.companyName} Logo`}
        className={`${sizeClasses[size]} rounded-full object-cover`}
        onError={(e) => {
          // Fallback to text if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.classList.remove('hidden');
        }}
      />
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizes[size]} font-bold text-primary`}>
            {brandConfig.companyName}
          </span>
          <span className={`${textSizes[size] === 'text-sm' ? 'text-xs' : textSizes[size] === 'text-base' ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
            {brandConfig.description}
          </span>
          <span className={`${textSizes[size]} font-bold text-primary hidden`}>
            {brandConfig.companyShortName}
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
