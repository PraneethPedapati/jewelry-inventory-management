import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ExpenseBreakdownWidgetProps {
  value: Array<{ category: string; amount: number; percentage: number }>;
  loading?: boolean;
}

export const ExpenseBreakdownWidget: React.FC<ExpenseBreakdownWidgetProps> = ({
  value,
  loading = false
}) => {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <Card className="bg-brand-bg border-brand-border">
        <CardHeader>
          <CardTitle className="text-brand-primary">Expense Breakdown</CardTitle>
          <CardDescription className="text-brand-medium">Distribution of expenses by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-brand-bg border-brand-border">
      <CardHeader>
        <CardTitle className="text-brand-primary">Expense Breakdown</CardTitle>
        <CardDescription className="text-brand-medium">Distribution of expenses by category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {value?.map((category, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-brand-primary">{category.category}</span>
                <span className="text-brand-medium">
                  {formatCurrency(category.amount)} ({category.percentage}%)
                </span>
              </div>
              <div className="w-full bg-brand-lighter rounded-full h-2">
                <div
                  className="bg-brand-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 
