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
      bgGradient="bg-gradient-to-br from-red-50 to-red-100 border-red-200"
      iconBg="bg-red-500"
      textColor="text-red-900"
      subtitleColor="text-red-700"
      changeColor="text-red-600"
    />
  );
}; 
