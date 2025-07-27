import React from 'react';
import { Card, CardContent } from './card';

// Utility function for conditional class names
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export interface BaseWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  loading?: boolean;
  urgent?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ComponentType<any>;
  className?: string;
  children?: React.ReactNode;
  bgGradient?: string;
  iconBg?: string;
  textColor?: string;
  subtitleColor?: string;
  changeColor?: string;
}

export const WidgetCard: React.FC<BaseWidgetProps> = ({
  title,
  value,
  subtitle,
  loading = false,
  urgent = false,
  trend,
  icon: Icon,
  className,
  children,
  bgGradient = "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
  iconBg = "bg-blue-500",
  textColor = "text-blue-900",
  subtitleColor = "text-blue-700",
  changeColor = "text-blue-600"
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') {
      return (
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>
      );
    }
    if (trend === 'down') {
      return (
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586L9.707 5.293a1 1 0 00-1.414 0L3 10.586V8a1 1 0 10-2 0v5a1 1 0 001 1h5a1 1 0 100-2H4.414L9 7.414l4.293 4.293A1 1 0 0012 13z" clipRule="evenodd" />
        </svg>
      );
    }
    return null;
  };

  if (children) {
    // For complex widgets (Row 3), use the analytics page style
    return (
      <Card className={cn("relative overflow-hidden transition-all duration-200 hover:shadow-md", className)}>
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>
    );
  }

  // For simple widgets (Row 1 & 2), use the products page style
  return (
    <Card className={cn(
      bgGradient,
      "border p-6 transition-all duration-200 hover:shadow-md",
      urgent && "ring-2 ring-red-200",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl", iconBg)}>
          {Icon && <Icon className="h-6 w-6 text-white" />}
        </div>
        <div className="text-right">
          <div className={cn("text-3xl font-bold", textColor)}>{value}</div>
          <div className={cn("text-xs font-medium", changeColor)}>
            {urgent ? 'Urgent' : subtitle || 'This Month'}
          </div>
        </div>
      </div>
      <div>
        <h3 className={cn("text-sm font-semibold mb-1", subtitleColor)}>{title}</h3>
        {subtitle && (
          <p className={cn("text-xs flex items-center", changeColor)}>
            {getTrendIcon()}
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
}; 
