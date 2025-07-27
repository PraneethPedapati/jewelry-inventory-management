import React from 'react';
import { Clock } from 'lucide-react';
import { WidgetCard } from '@/components/ui/widget-card';

interface StaleDataWidgetProps {
  value: number;
  loading?: boolean;
}

export const StaleDataWidget: React.FC<StaleDataWidgetProps> = ({
  value,
  loading = false
}) => {
  return (
    <WidgetCard
      title="Stale Orders"
      value={value}
      subtitle=">6hrs old"
      loading={loading}
      urgent={value > 0}
      icon={Clock}
    />
  );
}; 
