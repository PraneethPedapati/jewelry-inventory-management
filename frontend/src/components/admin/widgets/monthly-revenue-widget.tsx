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
    />
  );
}; 
