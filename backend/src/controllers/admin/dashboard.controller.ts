import { Request, Response } from 'express';
import { eq, desc, count } from 'drizzle-orm';
import { db } from '../../db/connection.js';
import { products, orders, orderItems } from '../../db/schema.js';
import { asyncHandler } from '../../middleware/error-handler.middleware.js';
import { AnalyticsService } from '../../services/analytics.service.js';

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard
 */
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  // Get live metrics (simple counts)
  const liveMetrics = await AnalyticsService.getLiveMetrics();

  // Get cached analytics data
  const cachedAnalytics = await AnalyticsService.getCachedAnalytics();
  const refreshMetadata = await AnalyticsService.getRefreshMetadata();

  // Calculate revenue growth (comparing current month with previous month)
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const currentMonthStart = new Date(currentYear, currentMonth, 1);
  const previousMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const previousMonthEnd = new Date(currentYear, currentMonth, 0);

  // Get orders for revenue growth calculation
  const ordersData = await db
    .select({
      id: orders.id,
      totalAmount: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt
    })
    .from(orders);

  const currentMonthOrders = ordersData.filter(order => {
    const orderDate = new Date(order.createdAt || new Date());
    return orderDate >= currentMonthStart;
  });

  const previousMonthOrders = ordersData.filter(order => {
    const orderDate = new Date(order.createdAt || new Date());
    return orderDate >= previousMonthStart && orderDate <= previousMonthEnd;
  });

  const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
  const previousMonthRevenue = previousMonthOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  const revenueGrowth = previousMonthRevenue > 0
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    : 0;

  // Get recent orders (last 5 orders)
  const recentOrdersData = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      totalAmount: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(5);

  // Get order items for recent orders to get product names
  const recentOrdersWithItems = await Promise.all(
    recentOrdersData.map(async (order) => {
      const items = await db
        .select({
          productSnapshot: orderItems.productSnapshot,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id))
        .limit(1);

      const productSnapshot = items[0]?.productSnapshot as any;
      const productName = productSnapshot?.product?.name || 'Unknown Product';

      // Calculate time ago
      const timeDiff = Date.now() - new Date(order.createdAt || new Date()).getTime();
      const minutes = Math.floor(timeDiff / (1000 * 60));
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      let timeAgo = '';
      if (days > 0) {
        timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
      } else if (hours > 0) {
        timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else if (minutes > 0) {
        timeAgo = `${minutes} min${minutes > 1 ? 's' : ''} ago`;
      } else {
        timeAgo = 'Just now';
      }

      return {
        id: order.orderNumber,
        customer: order.customerName,
        item: productName,
        amount: `₹${parseFloat(order.totalAmount).toLocaleString('en-IN')}`,
        status: order.status,
        date: (order.createdAt || new Date()).toISOString().split('T')[0],
        time: timeAgo
      };
    })
  );

  // Get total revenue from cached analytics or calculate live
  let totalRevenue = 0;
  if (cachedAnalytics.net_revenue) {
    totalRevenue = cachedAnalytics.net_revenue.totalRevenue;
  } else {
    // Fallback to live calculation if no cached data
    totalRevenue = ordersData.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
  }

  const dashboardStats = {
    totalRevenue: Math.round(totalRevenue),
    totalProducts: liveMetrics.totalProducts,
    totalOrders: liveMetrics.totalOrders,
    revenueGrowth: Math.round(revenueGrowth * 100) / 100, // Round to 2 decimal places
    recentOrders: recentOrdersWithItems
  };

  // Check if analytics data is stale
  const isStale = AnalyticsService.isStale(refreshMetadata?.lastRefreshAt || null);

  res.json({
    success: true,
    data: dashboardStats,
    message: 'Dashboard statistics retrieved successfully',
    analyticsStatus: {
      isStale,
      lastRefreshed: refreshMetadata?.lastRefreshAt?.toISOString(),
      hasCachedData: Object.keys(cachedAnalytics).length > 0
    }
  });
}); 
