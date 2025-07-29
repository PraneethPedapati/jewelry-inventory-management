import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { WidgetCard } from '@/components/ui/widget-card';

interface StaleDataWidgetProps {
  value: number;
}

export const StaleDataWidget: React.FC<StaleDataWidgetProps> = ({
  value
}) => {
  return (
    <WidgetCard
      title="Stale Data"
      value={value}
      subtitle="Needs Attention"
      urgent={value > 0}
      icon={AlertTriangle}
    />
  );
}; 
