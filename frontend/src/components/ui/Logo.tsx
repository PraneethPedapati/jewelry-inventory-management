import React from 'react';
import { useBrandStore } from '@/stores/brand.store';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'text' | 'icon' | 'full';
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  showText = true
}) => {
  const { config } = useBrandStore();

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const renderLogo = () => {
    if (variant === 'icon') {
      return (
        <div className={`${sizeClasses[size]} bg-primary rounded-lg flex items-center justify-center ${className}`}>
          <span className="text-white font-bold text-sm">
            {config.companyShortName.charAt(0)}
          </span>
        </div>
      );
    }

    if (variant === 'text') {
      return (
        <span className={`font-semibold text-foreground ${textSizes[size]} ${className}`}>
          {config.companyName}
        </span>
      );
    }

    // Full variant (icon + text)
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`${sizeClasses[size]} bg-primary rounded-lg flex items-center justify-center`}>
          <span className="text-white font-bold text-sm">
            {config.companyShortName.charAt(0)}
          </span>
        </div>
        {showText && (
          <span className={`font-semibold text-foreground ${textSizes[size]}`}>
            {config.companyName}
          </span>
        )}
      </div>
    );
  };

  return renderLogo();
};

export default Logo; 
