import { Request, Response } from 'express';
import { eq, desc, count } from 'drizzle-orm';
import { db } from '../../db/connection.js';
import { products, orders, orderItems, expenses } from '../../db/schema.js';
import { asyncHandler } from '../../middleware/error-handler.middleware.js';

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard
 */
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  // Get total products count
  const totalProductsResult = await db
    .select({ count: count() })
    .from(products)
    .where(eq(products.isActive, true));

  const totalProducts = totalProductsResult[0]?.count || 0;

  // Get total orders count and revenue
  const ordersData = await db
    .select({
      id: orders.id,
      totalAmount: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt
    })
    .from(orders);

  const totalOrders = ordersData.length;
  const totalRevenue = ordersData.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  // Calculate revenue growth (comparing current month with previous month)
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const currentMonthStart = new Date(currentYear, currentMonth, 1);
  const previousMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const previousMonthEnd = new Date(currentYear, currentMonth, 0);

  const currentMonthOrders = ordersData.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= currentMonthStart;
  });

  const previousMonthOrders = ordersData.filter(order => {
    const orderDate = new Date(order.createdAt);
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

      const productName = items[0]?.productSnapshot?.name || 'Unknown Product';

      // Calculate time ago
      const timeDiff = Date.now() - new Date(order.createdAt).getTime();
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
        date: order.createdAt.toISOString().split('T')[0],
        time: timeAgo
      };
    })
  );

  const dashboardStats = {
    totalRevenue: Math.round(totalRevenue),
    totalProducts,
    totalOrders,
    revenueGrowth: Math.round(revenueGrowth * 100) / 100, // Round to 2 decimal places
    recentOrders: recentOrdersWithItems
  };

  res.json({
    success: true,
    data: dashboardStats,
    message: 'Dashboard statistics retrieved successfully'
  });
}); 
