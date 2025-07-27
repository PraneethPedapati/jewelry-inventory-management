import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { WidgetCard } from '@/components/ui/widget-card';

interface RevenueGrowthWidgetProps {
  value: { percentage: number; trend: 'up' | 'down' | 'neutral'; formatted: string };
  loading?: boolean;
}

export const RevenueGrowthWidget: React.FC<RevenueGrowthWidgetProps> = ({
  value,
  loading = false
}) => {
  const getTrendIcon = () => {
    if (value.trend === 'up') return TrendingUp;
    if (value.trend === 'down') return TrendingDown;
    return Minus;
  };

  const getColorScheme = () => {
    if (value.trend === 'up') {
      return {
        bgGradient: "bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200",
        iconBg: "bg-rose-500",
        textColor: "text-rose-900",
        subtitleColor: "text-rose-700",
        changeColor: "text-rose-600"
      };
    }
    if (value.trend === 'down') {
      return {
        bgGradient: "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200",
        iconBg: "bg-slate-500",
        textColor: "text-slate-900",
        subtitleColor: "text-slate-700",
        changeColor: "text-slate-600"
      };
    }
    return {
      bgGradient: "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200",
      iconBg: "bg-gray-500",
      textColor: "text-gray-900",
      subtitleColor: "text-gray-700",
      changeColor: "text-gray-600"
    };
  };

  const colors = getColorScheme();

  return (
    <WidgetCard
      title="Revenue Growth"
      value={value.formatted}
      subtitle="vs Last Month"
      loading={loading}
      icon={getTrendIcon()}
      bgGradient={colors.bgGradient}
      iconBg={colors.iconBg}
      textColor={colors.textColor}
      subtitleColor={colors.subtitleColor}
      changeColor={colors.changeColor}
    />
  );
}; 
