import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Receipt, TrendingDown, Calendar, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { analyticsService, type AnalyticsData, type AnalyticsStatus } from '@/services/api';
import Dropdown from '@/components/ui/dropdown';

const AdminAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsStatus, setAnalyticsStatus] = useState<AnalyticsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load analytics data from API
  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getAnalytics(selectedPeriod);
      setAnalyticsData(data);
    } catch (error: any) {
      console.error('Failed to load analytics data:', error);
      toast.error('Failed to load analytics data. Please try again.');

      // Set empty data structure with zeros instead of mock data
      setAnalyticsData({
        revenueData: [],
        expenseCategories: [],
        topSellingProducts: [],
        summary: {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          revenueChange: 0,
          expenseChange: 0,
          profitMargin: 0,
          mostProfitableMonth: 'N/A',
          averageMonthlyRevenue: 0,
          expenseEfficiency: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Load analytics status
  const loadAnalyticsStatus = async () => {
    try {
      const status = await analyticsService.getAnalyticsStatus();
      setAnalyticsStatus(status);
    } catch (error) {
      console.error('Failed to load analytics status:', error);
    }
  };

  // Refresh analytics data
  const handleRefreshAnalytics = async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);
      const result = await analyticsService.refreshAnalytics();

      setAnalyticsData(result.data);
      setAnalyticsStatus({
        lastRefreshed: result.lastRefreshed,
        isStale: result.isStale,
        cooldownStatus: result.cooldownStatus,
        canRefresh: Object.values(result.cooldownStatus).every(status => status.canRefresh)
      });

      toast.success(`Analytics refreshed successfully! (${Math.round(result.computationTimeMs / 1000)}s)`);
    } catch (error: any) {
      console.error('Failed to refresh analytics:', error);

      if (error.response?.status === 429) {
        const remainingMinutes = error.response.data.remainingMinutes || 1;
        toast.error(`Analytics refresh is rate limited. Please wait ${remainingMinutes} minute(s) before refreshing again.`);
      } else {
        toast.error('Failed to refresh analytics. Please try again.');
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Load analytics data on component mount and when period changes
  useEffect(() => {
    loadAnalyticsData();
    loadAnalyticsStatus();
  }, [selectedPeriod]);

  // Format time ago
  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Get refresh button variant
  const getRefreshButtonVariant = () => {
    if (refreshing) return 'secondary';
    if (analyticsStatus?.isStale) return 'default';
    return 'outline';
  };

  // Get refresh button text
  const getRefreshButtonText = () => {
    if (refreshing) return 'Refreshing...';
    if (analyticsStatus?.isStale) return 'Refresh Recommended';
    return 'Refresh Analytics';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No analytics data available</h3>
            <p className="text-muted-foreground">
              Unable to load analytics data at this time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check if there's any real data
  const hasData = analyticsData.revenueData.length > 0 ||
    analyticsData.expenseCategories.length > 0 ||
    analyticsData.topSellingProducts.length > 0;

  if (!hasData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive insights into your jewelry business performance
            </p>
          </div>
          <Button
            onClick={handleRefreshAnalytics}
            disabled={refreshing || !analyticsStatus?.canRefresh}
            variant={getRefreshButtonVariant()}
            className="flex items-center gap-2"
          >
            {refreshing && <RefreshCw className="w-4 h-4 animate-spin" />}
            {getRefreshButtonText()}
          </Button>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No analytics data available</h3>
            <p className="text-muted-foreground mb-4">
              Click "Refresh Analytics" to calculate your business insights.
            </p>
            {analyticsStatus && (
              <p className="text-sm text-muted-foreground">
                Last refreshed: {formatTimeAgo(analyticsStatus.lastRefreshed)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Use summary data from backend instead of calculating locally
  const summary = analyticsData.summary || {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    revenueChange: 0,
    expenseChange: 0,
    profitMargin: 0,
    mostProfitableMonth: 'Jan',
    averageMonthlyRevenue: 0,
    expenseEfficiency: 0
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights into your jewelry business performance
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Dropdown
            options={[
              { value: 'This Week', label: 'This Week' },
              { value: 'This Month', label: 'This Month' },
              { value: 'Last 3 Months', label: 'Last 3 Months' },
              { value: 'This Year', label: 'This Year' }
            ]}
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            placeholder="Select Period"
          />
          <Button
            onClick={handleRefreshAnalytics}
            disabled={refreshing || !analyticsStatus?.canRefresh}
            variant={getRefreshButtonVariant()}
            className="flex items-center gap-2"
          >
            {refreshing && <RefreshCw className="w-4 h-4 animate-spin" />}
            {getRefreshButtonText()}
          </Button>
        </div>
      </div>

      {/* Analytics Status */}
      {analyticsStatus && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Last refreshed: {formatTimeAgo(analyticsStatus.lastRefreshed)}</span>
            {analyticsStatus.isStale && (
              <span className="text-orange-600 font-medium">Data may be outdated</span>
            )}
          </div>
          {!analyticsStatus.canRefresh && (
            <div className="text-sm text-muted-foreground">
              Refresh available in {Math.ceil(Math.max(...Object.values(analyticsStatus.cooldownStatus).map(s => s.remainingMs)) / (1000 * 60))} minutes
            </div>
          )}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-700">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(summary.totalRevenue)}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{summary.revenueChange.toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-red-700">Total Expenses</CardTitle>
              <Receipt className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{formatCurrency(summary.totalExpenses)}</div>
            <div className="flex items-center text-xs text-red-600 mt-1">
              {summary.expenseChange >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {summary.expenseChange >= 0 ? '+' : ''}{summary.expenseChange.toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-700">Net Profit</CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(summary.netProfit)}</div>
            <div className="flex items-center text-xs text-blue-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {summary.profitMargin.toFixed(1)}% profit margin
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-700">Growth Rate</CardTitle>
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{summary.revenueChange.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-purple-600 mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Monthly growth
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Most Profitable Month</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {summary.mostProfitableMonth}
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Highest profit margin achieved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Average Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary.averageMonthlyRevenue)}
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Consistent performance indicator
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Expense Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {summary.expenseEfficiency.toFixed(1)}%
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Expense to revenue ratio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue and expenses comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between space-x-2 h-80">
            {analyticsData?.revenueData?.map((data, index) => {
              const maxValue = Math.max(...(analyticsData?.revenueData?.map(d => d.revenue) || [0]));
              const revenueHeight = maxValue > 0 ? (data.revenue / maxValue) * 280 : 0;
              const expenseHeight = maxValue > 0 ? (data.expenses / maxValue) * 280 : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                  <div className="w-full flex items-end space-x-1" style={{ height: '280px' }}>
                    <div
                      className="bg-green-500 rounded-t flex-1"
                      style={{ height: `${revenueHeight}px` }}
                      title={`Revenue: ${formatCurrency(data.revenue)}`}
                    />
                    <div
                      className="bg-red-500 rounded-t flex-1"
                      style={{ height: `${expenseHeight}px` }}
                      title={`Expenses: ${formatCurrency(data.expenses)}`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">{data.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-muted-foreground">Revenue</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm text-muted-foreground">Expenses</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Distribution of expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData?.expenseCategories?.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(category.amount)} ({category.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing products by sales volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData?.topSellingProducts?.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sales} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{product.revenue}</p>
                    <p className="text-xs text-muted-foreground">Profit: {product.profit}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics; 
