import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { WidgetCard } from '@/components/ui/widget-card';

interface MonthlyOrdersWidgetProps {
  value: number;
  loading?: boolean;
}

export const MonthlyOrdersWidget: React.FC<MonthlyOrdersWidgetProps> = ({
  value,
  loading = false
}) => {
  return (
    <WidgetCard
      title="Monthly Orders"
      value={value}
      subtitle="This Month"
      loading={loading}
      icon={ShoppingCart}
    />
  );
}; 
