import React from 'react';
import { Clock } from 'lucide-react';
import { WidgetCard } from '@/components/ui/widget-card';

interface PendingOrdersWidgetProps {
  value: number;
  loading?: boolean;
}

export const PendingOrdersWidget: React.FC<PendingOrdersWidgetProps> = ({
  value
}) => {
  return (
    <WidgetCard
      title="Pending Orders"
      value={value}
      subtitle="Awaiting Processing"
      icon={Clock}
    />
  );
}; 
