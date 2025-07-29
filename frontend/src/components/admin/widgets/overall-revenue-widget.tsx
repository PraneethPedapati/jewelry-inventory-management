import React from 'react';
import { DollarSign } from 'lucide-react';
import { WidgetCard } from '@/components/ui/widget-card';

interface OverallRevenueWidgetProps {
  value: { revenue: number; formatted: string };
  loading?: boolean;
}

export const OverallRevenueWidget: React.FC<OverallRevenueWidgetProps> = ({
  value
}) => {
  // Ensure proper formatting to 2 decimal places
  const formattedValue = value.formatted || `₹${value.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <WidgetCard
      title="Overall Revenue"
      value={formattedValue}
      subtitle="All-time Revenue"
      icon={DollarSign}
    />
  );
}; 
