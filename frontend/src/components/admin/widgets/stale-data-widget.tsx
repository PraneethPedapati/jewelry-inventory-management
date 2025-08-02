import React from 'react';
import { AlertTriangle, Wifi } from 'lucide-react';
import { WidgetCard } from '@/components/ui/widget-card';

interface StaleDataWidgetProps {
  value: number;
}

export const StaleDataWidget: React.FC<StaleDataWidgetProps> = ({
  value
}) => {
  return (
    <WidgetCard
      title={
        <div className="flex items-center gap-2">
          <span>Stale Data</span>
          <Wifi className="w-3 h-3 text-green-500 animate-pulse" title="Real-time data" />
        </div>
      }
      value={value}
      subtitle="Needs Attention"
      urgent={value > 0}
      icon={AlertTriangle}
    />
  );
}; 
