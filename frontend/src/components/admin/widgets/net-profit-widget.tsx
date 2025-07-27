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
    />
  );
}; 
