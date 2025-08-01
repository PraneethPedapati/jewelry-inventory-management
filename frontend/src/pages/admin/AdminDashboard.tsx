import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { dashboardService, type DashboardWidgets } from '@/services/api';
import { env } from '@/config/env';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  // Set document title
  useDocumentTitle('Dashboard');

  // Check authentication on component mount
  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      console.log('❌ No admin token found, redirecting to login');
      toast.error('Please log in to access the dashboard');
      navigate('/admin/login');
      return;
    }

    console.log('✅ Admin token found, proceeding to load dashboard');
    loadWidgetsData();
  }, [navigate]);

  // Real-time updates for stale data widget
  useEffect(() => {
    if (!widgetsData) return;

    const interval = setInterval(async () => {
      try {
        // Only refresh stale data count (real-time widget)
        const response = await fetch(`${env.VITE_API_URL}/api/admin/dashboard/widgets`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setWidgetsData(prev => prev ? {
              ...prev,
              staleData: data.data.staleData,
              pendingOrders: data.data.pendingOrders
            } : null);
          }
        }
      } catch (error) {
        console.error('Failed to refresh stale data:', error);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [widgetsData]);

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

      // Check if it's an authentication error
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = (error as any).response;
        if (errorResponse?.status === 401) {
          console.log('❌ Authentication failed, redirecting to login');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_info');
          toast.error('Your session has expired. Please log in again.');
          navigate('/admin/login');
          return;
        }
      }

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

