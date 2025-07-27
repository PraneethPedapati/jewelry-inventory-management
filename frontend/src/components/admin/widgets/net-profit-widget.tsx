import React from 'react';
import { TrendingUp } from 'lucide-react';
import { WidgetCard } from '@/components/ui/widget-card';

interface NetProfitWidgetProps {
  value: { profit: number; margin: number; formatted: string; marginFormatted: string };
  loading?: boolean;
}

export const NetProfitWidget: React.FC<NetProfitWidgetProps> = ({
  value,
  loading = false
}) => {
  // Ensure proper formatting to 2 decimal places
  const formattedValue = value.formatted || `₹${value.profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <WidgetCard
      title="Net Profit"
      value={formattedValue}
      subtitle="All-time Profit"
      loading={loading}
      icon={TrendingUp}
      bgGradient="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
      iconBg="bg-blue-500"
      textColor="text-blue-900"
      subtitleColor="text-blue-700"
      changeColor="text-blue-600"
    />
  );
}; 
