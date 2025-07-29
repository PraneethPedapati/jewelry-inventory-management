import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { WidgetCard } from '@/components/ui/widget-card';

interface RevenueGrowthWidgetProps {
  value: { percentage: number; trend: 'up' | 'down' | 'neutral'; formatted: string };
  loading?: boolean;
}

export const RevenueGrowthWidget: React.FC<RevenueGrowthWidgetProps> = ({
  value
}) => {
  const getTrendIcon = () => {
    if (value.trend === 'up') return TrendingUp;
    if (value.trend === 'down') return TrendingDown;
    return Minus;
  };

  return (
    <WidgetCard
      title="Revenue Growth"
      value={value.formatted}
      subtitle="vs Last Month"
      icon={getTrendIcon()}
    />
  );
}; 
