import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { dashboardService, type DashboardWidgets } from '@/services/api';
import { env } from '@/config/env';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { CacheService } from '@/services/cache.service';
import {
  OverallRevenueWidget,
  MonthlyRevenueWidget,
  NetProfitWidget,
  RevenueGrowthWidget,
  ExpenseBreakdownWidget,
  TopSellingProductsWidget
} from '@/components/admin/widgets';

const AdminDashboard: React.FC = () => {
  const [widgetsData, setWidgetsData] = useState<DashboardWidgets | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<any>(null);

  // Set document title
  useDocumentTitle('Dashboard');

  // Load dashboard widgets data from API
  const loadWidgetsData = async () => {
    try {
      setLoading(true);

      // Check cache status before loading
      const cacheStatus = dashboardService.getCacheStatus();
      console.log('📊 Cache status before loading:', cacheStatus);

      const data = await dashboardService.getWidgets();
      setWidgetsData(data);

      // Update cache status
      const status = dashboardService.getCacheStatus();
      setCacheStatus(status);

      console.log('✅ Widgets loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load dashboard widgets:', error);
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
      console.log('🔄 Starting dashboard refresh...');
      setRefreshing(true);

      const data = await dashboardService.refreshWidgets();
      console.log('📊 Received fresh widget data:', data);

      setWidgetsData(data);
      console.log('✅ Updated widget state');

      // Update cache status after refresh
      const status = dashboardService.getCacheStatus();
      setCacheStatus(status);
      console.log('📋 Updated cache status:', status);

      toast.success('Dashboard refreshed successfully!');
    } catch (error: any) {
      console.error('❌ Failed to refresh dashboard:', error);
      toast.error('Failed to refresh dashboard. Please try again.');
    } finally {
      setRefreshing(false);
      console.log('🏁 Refresh operation completed');
    }
  };

  // Load widgets data on component mount
  useEffect(() => {
    console.log('📊 Loading dashboard widgets...');
    loadWidgetsData();

    // Debug cache in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Cache status:', CacheService.getCacheStatus('DASHBOARD_WIDGETS'));
    }
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
          {cacheStatus && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              {cacheStatus.hasCache ? (
                <>
                  <span>📊 Using cached data</span>
                  {cacheStatus.lastUpdated && (
                    <span>• Last updated: {cacheStatus.lastUpdated.toLocaleTimeString()}</span>
                  )}
                  {cacheStatus.isStale && (
                    <span className="text-orange-600">• Data may be stale</span>
                  )}
                </>
              ) : (
                <span>🔄 Fresh data from server</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
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
        <NetProfitWidget
          value={widgetsData.netProfit}
          loading={loading}
        />
        <RevenueGrowthWidget
          value={widgetsData.revenueGrowth}
          loading={loading}
        />
      </div>

      {/* Row 2 - Business Metrics (2 widgets sharing space equally) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopSellingProductsWidget
          value={widgetsData.topSellingProducts}
          loading={loading}
        />
        <ExpenseBreakdownWidget
          value={widgetsData.expenseBreakdown}
          loading={loading}
        />
      </div>


    </div>
  );
};

export default AdminDashboard;

