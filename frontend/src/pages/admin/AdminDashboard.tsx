import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Settings,
  BarChart3,
  DollarSign,
  Clock,
  User,
  Receipt,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { dashboardService, analyticsService, type DashboardStats, type AnalyticsStatus } from '@/services/api';
import { env } from '@/config/env';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [analyticsStatus, setAnalyticsStatus] = useState<AnalyticsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Set document title
  useDocumentTitle('Dashboard');

  // Load dashboard data from API
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getStats();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data. Please try again.');
      setDashboardData(null);
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

  // Refresh analytics
  const handleRefreshAnalytics = async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);
      await analyticsService.refreshAnalytics();

      // Reload dashboard data to get updated analytics
      await loadDashboardData();
      await loadAnalyticsStatus();

      toast.success('Analytics refreshed successfully!');
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

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
    loadAnalyticsStatus();
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'shipped':
        return 'outline';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'processing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'shipped':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'delivered':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
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

  if (!dashboardData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No dashboard data available</h3>
            <p className="text-muted-foreground">
              Unable to load dashboard statistics at this time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Revenue',
      value: `₹${(dashboardData.totalRevenue / 100000).toFixed(1)}L`,
      change: `${dashboardData.revenueGrowth >= 0 ? '+' : ''}${dashboardData.revenueGrowth}%`,
      trend: dashboardData.revenueGrowth >= 0 ? 'up' : 'down',
      icon: DollarSign,
      bgGradient: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
      iconBg: 'bg-green-500',
      textColor: 'text-green-900',
      subtitleColor: 'text-green-700',
      changeColor: dashboardData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Products',
      value: dashboardData.totalProducts.toString(),
      change: null,
      trend: null,
      icon: Package,
      bgGradient: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
      iconBg: 'bg-blue-500',
      textColor: 'text-blue-900',
      subtitleColor: 'text-blue-700',
      changeColor: 'text-blue-600'
    },
    {
      title: 'Orders',
      value: dashboardData.totalOrders.toString(),
      change: null,
      trend: null,
      icon: ShoppingCart,
      bgGradient: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
      iconBg: 'bg-purple-500',
      textColor: 'text-purple-900',
      subtitleColor: 'text-purple-700',
      changeColor: 'text-purple-600'
    },
    {
      title: 'Revenue Growth',
      value: `${dashboardData.revenueGrowth}%`,
      change: 'This Month',
      trend: dashboardData.revenueGrowth >= 0 ? 'up' : 'down',
      icon: TrendingUp,
      bgGradient: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200',
      iconBg: 'bg-orange-500',
      textColor: 'text-orange-900',
      subtitleColor: 'text-orange-700',
      changeColor: dashboardData.revenueGrowth >= 0 ? 'text-orange-600' : 'text-red-600'
    }
  ];

  const quickActions = [
    {
      title: 'Product Management',
      description: 'Add, edit, or remove jewelry products',
      href: '/admin/products',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      title: 'Order Management',
      description: 'View and manage customer orders',
      href: '/admin/orders',
      icon: ShoppingCart,
      color: 'bg-green-500'
    },
    {
      title: 'Expense Tracker',
      description: 'Track and manage business expenses',
      href: '/admin/expenses',
      icon: Receipt,
      color: 'bg-red-500'
    },
    {
      title: 'Analytics',
      description: 'View detailed reports and insights',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'bg-orange-500'
    }
  ];

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
          onClick={handleRefreshAnalytics}
          disabled={refreshing || !analyticsStatus?.canRefresh}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          {refreshing && <RefreshCw className="w-4 h-4 animate-spin" />}
          Refresh Analytics
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={`${stat.bgGradient} border p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${stat.iconBg} rounded-2xl`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</div>
                  <div className="text-xs font-medium text-muted-foreground">This Month</div>
                </div>
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${stat.subtitleColor} mb-1`}>{stat.title}</h3>
                {stat.change && (
                  <p className={`text-xs ${stat.changeColor} flex items-center`}>
                    {stat.trend === 'up' ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : stat.trend === 'down' ? (
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586L9.707 5.293a1 1 0 00-1.414 0L3 10.586V8a1 1 0 10-2 0v5a1 1 0 001 1h5a1 1 0 100-2H4.414L9 7.414l4.293 4.293A1 1 0 0012 13z" clipRule="evenodd" />
                      </svg>
                    ) : null}
                    {stat.change} {stat.title === 'Revenue Growth' ? '' : 'from last month'}
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  to={action.href}
                  className="p-4 border border-border rounded-lg hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 ${action.color} rounded-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link
            to="/admin/orders"
            className="text-sm text-primary hover:underline"
          >
            View all orders
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-sm">{order.id}</h4>
                      <Badge
                        variant={getStatusVariant(order.status)}
                        className={`text-xs ${getStatusColor(order.status)}`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{order.item}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{order.amount}</p>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {order.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default AdminDashboard; 
