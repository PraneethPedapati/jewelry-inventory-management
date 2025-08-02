import React from 'react';
import { Clock, Wifi } from 'lucide-react';
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
      title={
        <div className="flex items-center gap-2">
          <span>Pending Orders</span>
          <Wifi className="w-3 h-3 text-green-500 animate-pulse" title="Real-time data" />
        </div>
      }
      value={value}
      subtitle="Awaiting Processing"
      icon={Clock}
      loading={loading}
    />
  );
}; 
