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
      bgGradient="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200"
      iconBg="bg-indigo-500"
      textColor="text-indigo-900"
      subtitleColor="text-indigo-700"
      changeColor="text-indigo-600"
    />
  );
}; 
