import { Request, Response } from 'express';
import { db } from '../../db/connection.js';
import { orders, orderItems, expenses, expenseCategories, products } from '../../db/schema.js';
import { eq, desc, and, gte, lte, count } from 'drizzle-orm';
import { asyncHandler } from '../../middleware/error-handler.middleware.js';

/**
 * Get analytics data for dashboard
 * GET /api/admin/analytics
 */
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { period = 'This Month' } = req.query;

  // Calculate date range based on period
  const currentDate = new Date();
  let startDate: Date;
  let endDate = new Date(currentDate);

  switch (period) {
    case 'This Week':
      startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 7);
      break;
    case 'Last 3 Months':
      startDate = new Date(currentDate);
      startDate.setMonth(currentDate.getMonth() - 3);
      break;
    case 'This Year':
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      break;
    case 'This Month':
    default:
      startDate = new Date(currentDate);
      startDate.setMonth(currentDate.getMonth() - 6); // Last 6 months for better chart data
      break;
  }

  // Get revenue data (orders) by month
  const ordersData = await db
    .select({
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt
    })
    .from(orders)
    .where(gte(orders.createdAt, startDate));

  // Get expenses data by month
  const expensesData = await db
    .select({
      amount: expenses.amount,
      expenseDate: expenses.expenseDate,
      categoryId: expenses.categoryId
    })
    .from(expenses)
    .where(gte(expenses.expenseDate, startDate));

  // Group revenue by month
  const revenueByMonth: { [key: string]: number } = {};
  ordersData.forEach(order => {
    if (order.createdAt) {
      const month = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short' });
      revenueByMonth[month] = (revenueByMonth[month] || 0) + parseFloat(order.totalAmount);
    }
  });

  // Group expenses by month
  const expensesByMonth: { [key: string]: number } = {};
  expensesData.forEach(expense => {
    if (expense.expenseDate) {
      const month = new Date(expense.expenseDate).toLocaleDateString('en-US', { month: 'short' });
      expensesByMonth[month] = (expensesByMonth[month] || 0) + parseFloat(expense.amount);
    }
  });

  // Create revenue data array for last 6 months
  const revenueData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short' });

    revenueData.push({
      month: monthKey,
      revenue: Math.round(revenueByMonth[monthKey] || 0),
      expenses: Math.round(expensesByMonth[monthKey] || 0)
    });
  }

  // Calculate expense categories breakdown
  interface ExpenseCategoryBreakdown {
    name: string;
    amount: number;
    percentage: number;
  }

  let expenseCategoriesBreakdown: ExpenseCategoryBreakdown[] = [];
  if (expensesData.length > 0) {
    // Get category names
    const categories = await db
      .select({
        id: expenseCategories.id,
        name: expenseCategories.name
      })
      .from(expenseCategories)
      .where(eq(expenseCategories.isActive, true));

    // Group expenses by category
    const expensesByCategory: { [key: string]: number } = {};
    const totalExpenses = expensesData.reduce((sum, expense) => {
      const amount = parseFloat(expense.amount);
      expensesByCategory[expense.categoryId] = (expensesByCategory[expense.categoryId] || 0) + amount;
      return sum + amount;
    }, 0);

    // Create category breakdown
    expenseCategoriesBreakdown = categories
      .map(category => {
        const amount = expensesByCategory[category.id] || 0;
        return {
          name: category.name,
          amount: Math.round(amount),
          percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
        };
      })
      .filter(category => category.amount > 0) // Only include categories with expenses
      .sort((a, b) => b.amount - a.amount); // Sort by amount descending
  }

  // Get top selling products
  const topSellingProducts = [];
  if (ordersData.length > 0) {
    // Get order items with product details
    const orderItemsData = await db
      .select({
        productSnapshot: orderItems.productSnapshot,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        orderId: orderItems.orderId
      })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .where(gte(orders.createdAt, startDate));

    // Group by product and calculate sales
    const productSales: { [key: string]: { sales: number; revenue: number; name: string } } = {};

    orderItemsData.forEach(item => {
      const productSnapshot = item.productSnapshot as any;
      const productName = productSnapshot?.product?.name || productSnapshot?.name || 'Unknown Product';
      const quantity = item.quantity;
      const revenue = parseFloat(item.totalPrice || '0');

      if (!productSales[productName]) {
        productSales[productName] = { sales: 0, revenue: 0, name: productName };
      }

      productSales[productName].sales += quantity;
      productSales[productName].revenue += revenue;
    });

    // Convert to array and sort by sales volume
    topSellingProducts.push(
      ...Object.values(productSales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)
        .map(product => ({
          name: product.name,
          sales: product.sales,
          revenue: `₹${product.revenue.toLocaleString('en-IN')}`,
          profit: `₹${(product.revenue * 0.375).toLocaleString('en-IN')}` // Assuming 37.5% profit margin
        }))
    );
  }

  // If no data, provide empty but valid structure
  if (revenueData.every(item => item.revenue === 0 && item.expenses === 0)) {
    // Return empty data structure instead of sample data
    revenueData.length = 0;
  }

  // Calculate additional metrics for dashboard cards
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = revenueData.reduce((sum, item) => sum + item.expenses, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Calculate growth rates
  const currentMonth = revenueData[revenueData.length - 1];
  const previousMonth = revenueData[revenueData.length - 2];

  const revenueChange = previousMonth && currentMonth && previousMonth.revenue > 0
    ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100)
    : 0;

  const expenseChange = previousMonth && currentMonth && previousMonth.expenses > 0
    ? ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses * 100)
    : 0;

  const profitMargin = totalRevenue > 0
    ? ((netProfit / totalRevenue) * 100)
    : 0;

  // Find most profitable month
  const mostProfitableMonth = revenueData.length > 0
    ? revenueData.reduce((max, curr) => {
      const currProfit = curr.revenue - curr.expenses;
      const maxProfit = max.revenue - max.expenses;
      return currProfit > maxProfit ? curr : max;
    })
    : { month: 'N/A' };

  // Calculate average monthly revenue
  const averageMonthlyRevenue = totalRevenue / revenueData.length;

  // Calculate expense efficiency (expense to revenue ratio)
  const expenseEfficiency = totalRevenue > 0
    ? ((totalExpenses / totalRevenue) * 100)
    : 0;

  const analyticsData = {
    revenueData,
    expenseCategories: expenseCategoriesBreakdown,
    topSellingProducts,
    // Additional metrics for dashboard cards
    summary: {
      totalRevenue,
      totalExpenses,
      netProfit,
      revenueChange: Math.round(revenueChange * 100) / 100,
      expenseChange: Math.round(expenseChange * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100,
      mostProfitableMonth: mostProfitableMonth.month,
      averageMonthlyRevenue: Math.round(averageMonthlyRevenue),
      expenseEfficiency: Math.round(expenseEfficiency * 100) / 100
    }
  };

  res.json({
    success: true,
    data: analyticsData,
    message: 'Analytics data retrieved successfully'
  });
}); 
