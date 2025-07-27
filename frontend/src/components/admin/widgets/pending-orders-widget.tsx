import React from 'react';
import { Clock } from 'lucide-react';
import { WidgetCard } from '@/components/ui/widget-card';

interface PendingOrdersWidgetProps {
  value: number;
  loading?: boolean;
}

export const PendingOrdersWidget: React.FC<PendingOrdersWidgetProps> = ({
  value,
  loading = false
}) => {
  return (
    <WidgetCard
      title="Pending Orders"
      value={value}
      subtitle="≤6 hours old"
      loading={loading}
      icon={Clock}
      bgGradient="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200"
      iconBg="bg-amber-500"
      textColor="text-amber-900"
      subtitleColor="text-amber-700"
      changeColor="text-amber-600"
    />
  );
}; 
