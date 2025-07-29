import React from 'react';
import { BarChart3 } from 'lucide-react';
import { WidgetCard } from '@/components/ui/widget-card';

interface AOVWidgetProps {
  value: { aov: number; formatted: string };
  loading?: boolean;
}

export const AOVWidget: React.FC<AOVWidgetProps> = ({
  value
}) => {
  // Ensure proper formatting to 2 decimal places
  const formattedValue = value.formatted || `₹${value.aov.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <WidgetCard
      title="Average Order Value"
      value={formattedValue}
      subtitle="This Month"
      icon={BarChart3}
    />
  );
}; 
