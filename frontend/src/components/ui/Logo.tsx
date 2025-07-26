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
          logoUrl: env.VITE_LOGO_URL,
          faviconUrl: env.VITE_FAVICON_URL
        });
      }
    };

    fetchBrandConfig();
  }, []);

  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16'
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
          className={`${sizeClasses[size]} w-auto object-contain`}
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
        className={`${sizeClasses[size]} w-auto object-contain`}
        onError={(e) => {
          // Fallback to text if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.classList.remove('hidden');
        }}
      />
      {showText && (
        <>
          <span className={`${textSizes[size]} font-bold text-primary`}>
            {brandConfig.companyName}
          </span>
          <span className={`${textSizes[size]} font-bold text-primary hidden`}>
            {brandConfig.companyShortName}
          </span>
        </>
      )}
    </div>
  );
};

export default Logo;
