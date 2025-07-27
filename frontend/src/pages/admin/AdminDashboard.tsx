import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { dashboardService, type DashboardWidgets } from '@/services/api';
import { env } from '@/config/env';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  OverallRevenueWidget,
  MonthlyRevenueWidget,
  MonthlyOrdersWidget,
  NetProfitWidget,
  PendingOrdersWidget,
  StaleDataWidget,
  OverallAOVWidget,
  RevenueGrowthWidget,
  ExpenseBreakdownWidget,
  TopSellingProductsWidget
} from '@/components/admin/widgets';

const AdminDashboard: React.FC = () => {
  const [widgetsData, setWidgetsData] = useState<DashboardWidgets | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Set document title
  useDocumentTitle('Dashboard');

  // Load dashboard widgets data from API
  const loadWidgetsData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getWidgets();
      setWidgetsData(data);
    } catch (error) {
      console.error('Failed to load dashboard widgets:', error);
      toast.error('Failed to load dashboard data. Please try again.');
      setWidgetsData(null);
    } finally {
      setLoading(false);
    }
  };

  // Refresh widgets data
  const handleRefreshWidgets = async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);
      await dashboardService.refreshWidgets();
      await loadWidgetsData();
      toast.success('Dashboard refreshed successfully!');
    } catch (error: any) {
      console.error('Failed to refresh dashboard:', error);
      toast.error('Failed to refresh dashboard. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Load widgets data on component mount
  useEffect(() => {
    loadWidgetsData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!widgetsData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No dashboard data available</h3>
            <p className="text-muted-foreground">
              Unable to load dashboard widgets at this time.
            </p>
            <Button onClick={loadWidgetsData} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome to {env.VITE_COMPANY_NAME}</h1>
          <p className="text-muted-foreground mt-2">
            Discover insights and trends for your stunning daily wear jewellery collection
          </p>
        </div>
        <Button
          onClick={handleRefreshWidgets}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {refreshing && <RefreshCw className="w-4 h-4 animate-spin" />}
          Refresh Dashboard
        </Button>
      </div>

      {/* Row 1 - Financial Overview (4 widgets) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <OverallRevenueWidget
          value={widgetsData.overallRevenue}
          loading={loading}
        />
        <MonthlyRevenueWidget
          value={widgetsData.monthlyRevenue}
          loading={loading}
        />
        <MonthlyOrdersWidget
          value={widgetsData.monthlyOrders}
          loading={loading}
        />
        <NetProfitWidget
          value={widgetsData.netProfit}
          loading={loading}
        />
      </div>

      {/* Row 2 - Operational Metrics (4 widgets) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PendingOrdersWidget
          value={widgetsData.pendingOrders}
          loading={loading}
        />
        <StaleDataWidget
          value={widgetsData.staleData}
          loading={loading}
        />
        <OverallAOVWidget
          value={widgetsData.averageOrderValue}
          loading={loading}
        />
        <RevenueGrowthWidget
          value={widgetsData.revenueGrowth}
          loading={loading}
        />
      </div>

      {/* Row 3 - Detailed Analysis (2 widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseBreakdownWidget
          value={widgetsData.expenseBreakdown}
          loading={loading}
        />
        <TopSellingProductsWidget
          value={widgetsData.topSellingProducts}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default AdminDashboard; 
