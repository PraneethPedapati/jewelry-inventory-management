import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TopSellingProductsWidgetProps {
  value: Array<{ productCode: string; productName: string; salesCount: number; revenue: number }>;
  loading?: boolean;
}

export const TopSellingProductsWidget: React.FC<TopSellingProductsWidgetProps> = ({
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
          <CardTitle className="text-brand-primary">Top Selling Products</CardTitle>
          <CardDescription className="text-brand-medium">Best performing products by sales volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-3 bg-brand-ultra-light rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brand-light rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-brand-light rounded mb-1"></div>
                    <div className="h-3 bg-brand-light rounded w-1/2"></div>
                  </div>
                </div>
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
        <CardTitle className="text-brand-primary">Top Selling Products</CardTitle>
        <CardDescription className="text-brand-medium">Best performing products by sales volume</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {value?.map((product, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-brand-ultra-light rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-white text-sm font-bold border border-brand-border">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-sm text-brand-primary">{product.productName}</p>
                  <p className="text-xs text-brand-medium">{product.salesCount} sales</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm text-brand-primary">{formatCurrency(product.revenue)}</p>
                <p className="text-xs text-brand-medium">{product.productCode}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 
