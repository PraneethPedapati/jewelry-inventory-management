import React from 'react';
import { DollarSign } from 'lucide-react';
import { WidgetCard } from '@/components/ui/widget-card';

interface OverallRevenueWidgetProps {
  value: { revenue: number; formatted: string };
  loading?: boolean;
}

export const OverallRevenueWidget: React.FC<OverallRevenueWidgetProps> = ({
  value,
  loading = false
}) => {
  // Ensure proper formatting to 2 decimal places
  const formattedValue = value.formatted || `₹${value.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <WidgetCard
      title="Overall Revenue"
      value={formattedValue}
      subtitle="All-time Total"
      loading={loading}
      icon={DollarSign}
      bgGradient="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200"
      iconBg="bg-emerald-500"
      textColor="text-emerald-900"
      subtitleColor="text-emerald-700"
      changeColor="text-emerald-600"
    />
  );
}; 
