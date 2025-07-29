import { Request, Response } from 'express';
import { db } from '../../db/connection.js';
import { orders, orderItems, expenses, expenseCategories, products } from '../../db/schema.js';
import { eq, desc, and, gte, lte, count } from 'drizzle-orm';
import { asyncHandler } from '../../middleware/error-handler.middleware.js';
import { AnalyticsService } from '../../services/analytics.service.js';

/**
 * Get analytics data for dashboard (cached)
 * GET /api/admin/analytics
 */
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { period = 'This Month' } = req.query;

  // Get cached analytics data
  const cachedAnalytics = await AnalyticsService.getCachedAnalytics();
  const refreshMetadata = await AnalyticsService.getRefreshMetadata();

  // If no cached data exists, return empty structure
  if (!cachedAnalytics || Object.keys(cachedAnalytics).length === 0) {
    const emptyAnalytics = {
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
    };

    res.json({
      success: true,
      data: emptyAnalytics,
      message: 'No analytics data available. Please refresh to calculate analytics.',
      isStale: true,
      lastRefreshed: null
    });
    return;
  }

  // Transform cached data to match existing API format
  const netRevenue = cachedAnalytics.net_revenue;
  const monthlyTrends = cachedAnalytics.monthly_trends;
  const expenseBreakdown = cachedAnalytics.expense_breakdown;
  const topProducts = cachedAnalytics.top_products;

  // Create revenue data array for charts
  const revenueData = monthlyTrends?.monthlyTrends?.map((trend: any) => ({
    month: trend.month,
    revenue: trend.revenue,
    expenses: trend.expenses
  })) || [];

  // Transform expense breakdown
  const expenseCategories = expenseBreakdown?.expenseBreakdown?.map((expense: any) => ({
    name: expense.category,
    amount: expense.amount,
    percentage: expense.percentage
  })) || [];

  // Transform top products
  const topSellingProducts = topProducts?.topProducts?.map((product: any) => ({
    name: product.name,
    sales: product.totalSold,
    revenue: `₹${product.revenue.toLocaleString('en-IN')}`,
    profit: `₹${(product.revenue * 0.375).toLocaleString('en-IN')}` // Assuming 37.5% profit margin
  })) || [];

  // Calculate summary metrics
  const totalRevenue = netRevenue?.totalRevenue || 0;
  const totalExpenses = netRevenue?.totalExpenses || 0;
  const netProfit = netRevenue?.netRevenue || 0;

  // Calculate growth rates from monthly trends
  let revenueChange = 0;
  let expenseChange = 0;
  if (monthlyTrends?.monthlyTrends && monthlyTrends.monthlyTrends.length >= 2) {
    const currentMonth = monthlyTrends.monthlyTrends[monthlyTrends.monthlyTrends.length - 1];
    const previousMonth = monthlyTrends.monthlyTrends[monthlyTrends.monthlyTrends.length - 2];

    revenueChange = previousMonth.revenue > 0
      ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100)
      : 0;

    expenseChange = previousMonth.expenses > 0
      ? ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses * 100)
      : 0;
  }

  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

  // Find most profitable month
  const mostProfitableMonth = revenueData.length > 0
    ? revenueData.reduce((max: any, curr: any) => {
      const currProfit = curr.revenue - curr.expenses;
      const maxProfit = max.revenue - max.expenses;
      return currProfit > maxProfit ? curr : max;
    }).month
    : 'N/A';

  // Calculate average monthly revenue
  const averageMonthlyRevenue = revenueData.length > 0 ? totalRevenue / revenueData.length : 0;

  // Calculate expense efficiency
  const expenseEfficiency = totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100) : 0;

  const analyticsData = {
    revenueData,
    expenseCategories,
    topSellingProducts,
    summary: {
      totalRevenue: Math.round(totalRevenue),
      totalExpenses: Math.round(totalExpenses),
      netProfit: Math.round(netProfit),
      revenueChange: Math.round(revenueChange * 100) / 100,
      expenseChange: Math.round(expenseChange * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100,
      mostProfitableMonth,
      averageMonthlyRevenue: Math.round(averageMonthlyRevenue),
      expenseEfficiency: Math.round(expenseEfficiency * 100) / 100
    }
  };

  // Check if data is stale
  const isStale = AnalyticsService.isStale(refreshMetadata?.lastRefreshAt || null);

  res.json({
    success: true,
    data: analyticsData,
    message: 'Analytics data retrieved successfully',
    isStale,
    lastRefreshed: refreshMetadata?.lastRefreshAt?.toISOString(),
    cooldownStatus: AnalyticsService.getCooldownStatus()
  });
});

/**
 * Refresh analytics data
 * POST /api/admin/analytics/refresh
 */
export const refreshAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  // Refresh all analytics
  const result = await AnalyticsService.refreshAllAnalytics(userId);

  if (!result.success) {
    if (result.cooldownRemaining) {
      const remainingMinutes = Math.ceil(result.cooldownRemaining / (1000 * 60));
      return res.status(429).json({
        success: false,
        message: result.error,
        cooldownRemaining: result.cooldownRemaining,
        remainingMinutes
      });
    }

    return res.status(500).json({
      success: false,
      message: result.error || 'Analytics refresh failed'
    });
  }

  // Transform the refreshed data to match API format
  const { netRevenue, monthlyTrends, expenseBreakdown, topProducts } = result.data;

  // Create revenue data array
  const revenueData = monthlyTrends.monthlyTrends.map((trend: any) => ({
    month: trend.month,
    revenue: trend.revenue,
    expenses: trend.expenses
  }));

  // Transform expense breakdown
  const expenseCategories = expenseBreakdown.expenseBreakdown.map((expense: any) => ({
    name: expense.category,
    amount: expense.amount,
    percentage: expense.percentage
  }));

  // Transform top products
  const topSellingProducts = topProducts.topProducts.map((product: any) => ({
    name: product.name,
    sales: product.totalSold,
    revenue: `₹${product.revenue.toLocaleString('en-IN')}`,
    profit: `₹${(product.revenue * 0.375).toLocaleString('en-IN')}`
  }));

  // Calculate summary metrics
  const totalRevenue = netRevenue.totalRevenue;
  const totalExpenses = netRevenue.totalExpenses;
  const netProfit = netRevenue.netRevenue;

  // Calculate growth rates
  let revenueChange = 0;
  let expenseChange = 0;
  if (monthlyTrends.monthlyTrends.length >= 2) {
    const currentMonth = monthlyTrends.monthlyTrends[monthlyTrends.monthlyTrends.length - 1];
    const previousMonth = monthlyTrends.monthlyTrends[monthlyTrends.monthlyTrends.length - 2];

    revenueChange = previousMonth.revenue > 0
      ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100)
      : 0;

    expenseChange = previousMonth.expenses > 0
      ? ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses * 100)
      : 0;
  }

  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

  // Find most profitable month
  const mostProfitableMonth = revenueData.length > 0
    ? revenueData.reduce((max: any, curr: any) => {
      const currProfit = curr.revenue - curr.expenses;
      const maxProfit = max.revenue - max.expenses;
      return currProfit > maxProfit ? curr : max;
    }).month
    : 'N/A';

  // Calculate average monthly revenue
  const averageMonthlyRevenue = revenueData.length > 0 ? totalRevenue / revenueData.length : 0;

  // Calculate expense efficiency
  const expenseEfficiency = totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100) : 0;

  const analyticsData = {
    revenueData,
    expenseCategories,
    topSellingProducts,
    summary: {
      totalRevenue: Math.round(totalRevenue),
      totalExpenses: Math.round(totalExpenses),
      netProfit: Math.round(netProfit),
      profitMargin: Math.round(profitMargin * 100) / 100,
      revenueChange: Math.round(revenueChange * 100) / 100,
      expenseChange: Math.round(expenseChange * 100) / 100,
      mostProfitableMonth,
      averageMonthlyRevenue: Math.round(averageMonthlyRevenue),
      expenseEfficiency: Math.round(expenseEfficiency * 100) / 100
    },
    cooldownStatus: AnalyticsService.getCooldownStatus()
  };

  return res.status(200).json({
    success: true,
    message: 'Analytics refreshed successfully',
    data: analyticsData,
    computationTime: result.data?.computationTime || 0
  });
});

/**
 * Get analytics status and cooldown information
 * GET /api/admin/analytics/status
 */
export const getAnalyticsStatus = asyncHandler(async (req: Request, res: Response) => {
  const refreshMetadata = await AnalyticsService.getRefreshMetadata();
  const cooldownStatus = AnalyticsService.getCooldownStatus();
  const isStale = AnalyticsService.isStale(refreshMetadata?.lastRefreshAt || null);

  res.json({
    success: true,
    data: {
      lastRefreshed: refreshMetadata?.lastRefreshAt?.toISOString(),
      isStale,
      cooldownStatus,
      canRefresh: Object.values(cooldownStatus).every(status => status.canRefresh)
    },
    message: 'Analytics status retrieved successfully'
  });
}); 
