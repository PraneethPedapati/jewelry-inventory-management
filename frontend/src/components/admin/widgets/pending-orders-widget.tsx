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
    />
  );
}; 
