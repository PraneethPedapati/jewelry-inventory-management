import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Receipt, TrendingDown, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');

  // Sample analytics data - replace with actual API calls
  const revenueData = [
    { month: 'Jan', revenue: 1240000, expenses: 85000 },
    { month: 'Feb', revenue: 1580000, expenses: 92000 },
    { month: 'Mar', revenue: 2100000, expenses: 110000 },
    { month: 'Apr', revenue: 1890000, expenses: 88000 },
    { month: 'May', revenue: 2350000, expenses: 125000 },
    { month: 'Jun', revenue: 2780000, expenses: 140000 }
  ];

  const currentMonth = revenueData[revenueData.length - 1];
  const previousMonth = revenueData[revenueData.length - 2];

  const revenueChange = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100).toFixed(1);
  const expenseChange = ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses * 100).toFixed(1);
  const profitMargin = (((currentMonth.revenue - currentMonth.expenses) / currentMonth.revenue) * 100).toFixed(1);

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = revenueData.reduce((sum, item) => sum + item.expenses, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Expense breakdown by category
  const expenseCategories = [
    { name: 'Raw Materials', amount: 450000, percentage: 45, color: 'bg-blue-500' },
    { name: 'Marketing & Advertising', amount: 180000, percentage: 18, color: 'bg-green-500' },
    { name: 'Rent & Utilities', amount: 120000, percentage: 12, color: 'bg-purple-500' },
    { name: 'Equipment & Tools', amount: 100000, percentage: 10, color: 'bg-orange-500' },
    { name: 'Professional Services', amount: 80000, percentage: 8, color: 'bg-red-500' },
    { name: 'Packaging & Shipping', amount: 70000, percentage: 7, color: 'bg-yellow-500' }
  ];

  const topSellingProducts = [
    { name: 'Diamond Solitaire Ring', sales: 24, revenue: '₹49,39,976', profit: '₹18,47,865' },
    { name: 'Gold Chain Necklace', sales: 18, revenue: '₹13,31,182', profit: '₹4,99,193' },
    { name: 'Pearl Bracelet', sales: 15, revenue: '₹4,34,235', profit: '₹1,62,838' },
    { name: 'Silver Watch', sales: 12, revenue: '₹12,89,588', profit: '₹4,83,595' },
    { name: 'Emerald Earrings', sales: 9, revenue: '₹14,12,091', profit: '₹5,29,534' }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Analytics & Reports
          </h1>
          <p className="text-muted-foreground mt-2">
            Insights into your jewelry store's performance, revenue, expenses, and profitability
          </p>
        </div>

        {/* Modern Period Selector */}
        <div className="relative">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[160px]"
          >
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Quarter">This Quarter</option>
            <option value="This Year">This Year</option>
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Enhanced Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500 rounded-2xl">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-900">₹{(totalRevenue / 100000).toFixed(1)}L</div>
              <div className="text-xs text-green-600 font-medium">Revenue</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-green-700 mb-1">Total Revenue</h3>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{revenueChange}% from last month
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500 rounded-2xl">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-900">₹{(totalExpenses / 100000).toFixed(1)}L</div>
              <div className="text-xs text-red-600 font-medium">Expenses</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-700 mb-1">Total Expenses</h3>
            <p className="text-xs text-red-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{expenseChange}% from last month
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-2xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-900">₹{(netProfit / 100000).toFixed(1)}L</div>
              <div className="text-xs text-blue-600 font-medium">Profit</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-700 mb-1">Net Profit</h3>
            <p className="text-xs text-blue-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {profitMargin}% profit margin
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-2xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-900">+{revenueChange}%</div>
              <div className="text-xs text-purple-600 font-medium">Growth</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-purple-700 mb-1">Monthly Growth</h3>
            <p className="text-xs text-purple-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Revenue growth rate
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue vs Expenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Monthly comparison of income and expenditure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueData.slice(-6).map((item, index) => (
                <div key={item.month} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.month}</span>
                    <span className="text-muted-foreground">
                      Revenue: ₹{(item.revenue / 100000).toFixed(1)}L |
                      Expenses: ₹{(item.expenses / 100000).toFixed(1)}L
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex-1 bg-muted rounded-full h-3 relative overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(item.revenue / Math.max(...revenueData.map(d => d.revenue))) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-3 relative overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${(item.expenses / Math.max(...revenueData.map(d => d.expenses))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Category-wise expense distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenseCategories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ₹{(category.amount / 1000).toFixed(0)}K ({category.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${category.color}`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing items by sales volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSellingProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">Revenue: {product.revenue}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{product.sales}</div>
                    <p className="text-sm text-muted-foreground">Units Sold</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Key financial indicators and trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{((totalRevenue - totalExpenses) / 100000).toFixed(1)}L
                  </div>
                  <div className="text-sm text-green-700">Total Profit</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">{profitMargin}%</div>
                  <div className="text-sm text-blue-700">Profit Margin</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Revenue Growth</span>
                  <span className="text-sm font-semibold text-green-600">+{revenueChange}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Expense Control</span>
                  <span className="text-sm font-semibold text-red-600">+{expenseChange}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Orders This Month</span>
                  <span className="text-sm font-semibold">78</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Products</span>
                  <span className="text-sm font-semibold">247</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Cost Efficiency Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cost per Sale</span>
                    <span>₹{Math.round(totalExpenses / 78).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Revenue per Product</span>
                    <span>₹{Math.round(totalRevenue / 247).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics; 
