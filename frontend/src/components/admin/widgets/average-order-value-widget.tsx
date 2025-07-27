import React from 'react';
import { BarChart3 } from 'lucide-react';
import { WidgetCard } from '@/components/ui/widget-card';

interface AOVWidgetProps {
  value: { aov: number; formatted: string };
  loading?: boolean;
}

export const AOVWidget: React.FC<AOVWidgetProps> = ({
  value,
  loading = false
}) => {
  // Ensure proper formatting to 2 decimal places
  const formattedValue = value.formatted || `₹${value.aov.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <WidgetCard
      title="Average Order Value"
      value={formattedValue}
      subtitle="This Month"
      loading={loading}
      icon={BarChart3}
      bgGradient="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
      iconBg="bg-blue-500"
      textColor="text-blue-900"
      subtitleColor="text-blue-700"
      changeColor="text-blue-600"
    />
  );
}; 
