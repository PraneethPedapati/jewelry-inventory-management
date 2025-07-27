import React from 'react';
import { DollarSign } from 'lucide-react';
import { WidgetCard } from '@/components/ui/widget-card';

interface MonthlyRevenueWidgetProps {
  value: { revenue: number; formatted: string };
  loading?: boolean;
}

export const MonthlyRevenueWidget: React.FC<MonthlyRevenueWidgetProps> = ({
  value,
  loading = false
}) => {
  // Ensure proper formatting to 2 decimal places
  const formattedValue = value.formatted || `₹${value.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <WidgetCard
      title="Monthly Revenue"
      value={formattedValue}
      subtitle="This Month"
      loading={loading}
      icon={DollarSign}
      bgGradient="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200"
      iconBg="bg-teal-500"
      textColor="text-teal-900"
      subtitleColor="text-teal-700"
      changeColor="text-teal-600"
    />
  );
}; 
