import { db } from '../db/connection.js';
import {
  orders,
  orderItems,
  products,
  expenses,
  expenseCategories,
  analyticsCache,
  analyticsMetadata
} from '../db/schema.js';
import { eq, desc, and, gte, lte, count, sql, notInArray, inArray, or } from 'drizzle-orm';
import { AnalyticsService } from './analytics.service.js';

export class DashboardWidgetService {

  // ON-THE-FLY WIDGETS (No Cache)

  /**
   * Get pending actions count (orders with payment_pending status)
   */
  static async getPendingActions(): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, 'payment_pending'));

    return result[0]?.count || 0;
  }

  /**
   * Get stale data count (payment_pending orders >6hrs old)
   */
  static async getStaleDataCount(): Promise<number> {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const result = await db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          eq(orders.status, 'payment_pending'),
          lte(orders.createdAt, sixHoursAgo)
        )
      );

    return result[0]?.count || 0;
  }



  /**
   * Get today's orders count (excluding cancelled and payment_pending)
   */
  static async getTodaysOrders(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          notInArray(orders.status, ['cancelled', 'payment_pending']),
          gte(orders.createdAt, today),
          lte(orders.createdAt, tomorrow)
        )
      );

    return result[0]?.count || 0;
  }

  /**
   * Get pending orders count (payment_pending orders + recent orders ≤6hrs old, all statuses except cancelled)
   */
  static async getPendingOrders(): Promise<number> {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const result = await db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          notInArray(orders.status, ['cancelled']),
          or(
            eq(orders.status, 'payment_pending'),
            gte(orders.createdAt, sixHoursAgo)
          )
        )
      );

    return result[0]?.count || 0;
  }

  // CACHED WIDGETS (Use analyticsCache)

  /**
   * Get active products count
   */
  static async getActiveProducts(): Promise<number> {
    // Check cache first
    const cached = await this.getCachedWidget('active_products');
    if (cached) return cached.value;

    // Calculate fresh data
    const result = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.isActive, true));

    const value = result[0]?.count || 0;

    // Cache the result
    await this.cacheWidget('active_products', { value });

    return value;
  }

  /**
   * Get overall revenue (all-time)
   */
  static async getOverallRevenue(): Promise<{ revenue: number; formatted: string }> {
    // Check cache first
    const cached = await this.getCachedWidget('overall_revenue');
    if (cached) return cached;

    // Calculate fresh data
    const result = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`
      })
      .from(orders)
      .where(inArray(orders.status, ['confirmed', 'processing', 'shipped', 'delivered']));

    const revenue = parseFloat(String(result[0]?.revenue || 0));
    const formatted = `₹${revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Cache the result for 2 hours
    await this.cacheWidget('overall_revenue', { revenue, formatted });

    return { revenue, formatted };
  }

  /**
   * Get monthly revenue
   */
  static async getMonthlyRevenue(): Promise<{ revenue: number; formatted: string }> {
    // Check cache first
    const cached = await this.getCachedWidget('monthly_revenue');
    if (cached) return cached;

    // Calculate fresh data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const result = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`
      })
      .from(orders)
      .where(
        and(
          inArray(orders.status, ['confirmed', 'processing', 'shipped', 'delivered']),
          sql`EXTRACT(MONTH FROM ${orders.createdAt}) = ${currentMonth + 1}`,
          sql`EXTRACT(YEAR FROM ${orders.createdAt}) = ${currentYear}`
        )
      );

    const revenue = parseFloat(String(result[0]?.revenue || 0));
    const formatted = `₹${revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Cache the result
    await this.cacheWidget('monthly_revenue', { revenue, formatted });

    return { revenue, formatted };
  }

  /**
   * Get monthly orders count
   */
  static async getMonthlyOrders(): Promise<number> {
    // Check cache first
    const cached = await this.getCachedWidget('monthly_orders');
    if (cached) return cached.value;

    // Calculate fresh data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const result = await db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          notInArray(orders.status, ['cancelled']),
          sql`EXTRACT(MONTH FROM ${orders.createdAt}) = ${currentMonth + 1}`,
          sql`EXTRACT(YEAR FROM ${orders.createdAt}) = ${currentYear}`
        )
      );

    const value = result[0]?.count || 0;

    // Cache the result
    await this.cacheWidget('monthly_orders', { value });

    return value;
  }

  /**
   * Get net profit (all-time)
   */
  static async getNetProfit(): Promise<{ profit: number; margin: number; formatted: string; marginFormatted: string }> {
    // Check cache first
    const cached = await this.getCachedWidget('net_profit');
    if (cached) return cached;

    // Calculate fresh data
    const [revenueResult, expensesResult] = await Promise.all([
      db
        .select({
          revenue: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`
        })
        .from(orders)
        .where(inArray(orders.status, ['confirmed', 'processing', 'shipped', 'delivered'])),

      db
        .select({
          expenses: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL)), 0)`
        })
        .from(expenses)
    ]);

    const totalRevenue = parseFloat(String(revenueResult[0]?.revenue || 0));
    const totalExpenses = parseFloat(String(expensesResult[0]?.expenses || 0));
    const profit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    const formatted = `₹${profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const marginFormatted = `${margin.toFixed(1)}% margin`;

    // Cache the result for 2 hours
    await this.cacheWidget('net_profit', { profit, margin, formatted, marginFormatted });

    return { profit, margin, formatted, marginFormatted };
  }

  /**
   * Get average order value (all-time)
   */
  static async getAverageOrderValue(): Promise<{ aov: number; formatted: string }> {
    // Check cache first
    const cached = await this.getCachedWidget('average_order_value');
    if (cached) return cached;

    // Calculate fresh data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const result = await db
      .select({
        aov: sql<number>`COALESCE(AVG(CAST(${orders.totalAmount} AS DECIMAL)), 0)`
      })
      .from(orders)
      .where(
        and(
          inArray(orders.status, ['confirmed', 'processing', 'shipped', 'delivered']),
          sql`EXTRACT(MONTH FROM ${orders.createdAt}) = ${currentMonth + 1}`,
          sql`EXTRACT(YEAR FROM ${orders.createdAt}) = ${currentYear}`
        )
      );

    const aov = parseFloat(String(result[0]?.aov || 0));
    const formatted = `₹${aov.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Cache the result
    await this.cacheWidget('average_order_value', { aov, formatted });

    return { aov, formatted };
  }

  /**
   * Get overall average order value (all-time)
   */
  static async getOverallAOV(): Promise<{ aov: number; formatted: string }> {
    // Check cache first
    const cached = await this.getCachedWidget('overall_aov');
    if (cached) return cached;

    // Calculate fresh data
    const result = await db
      .select({
        aov: sql<number>`COALESCE(AVG(CAST(${orders.totalAmount} AS DECIMAL)), 0)`
      })
      .from(orders)
      .where(inArray(orders.status, ['confirmed', 'processing', 'shipped', 'delivered']));

    const aov = parseFloat(String(result[0]?.aov || 0));
    const formatted = `₹${aov.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Cache the result for 1 hour
    await this.cacheWidget('overall_aov', { aov, formatted });

    return { aov, formatted };
  }

  /**
   * Get revenue growth
   */
  static async getRevenueGrowth(): Promise<{ percentage: number; trend: 'up' | 'down' | 'neutral'; formatted: string }> {
    // Check cache first
    const cached = await this.getCachedWidget('revenue_growth');
    if (cached) return cached;

    // Calculate fresh data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Get current month revenue
    const currentMonthResult = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`
      })
      .from(orders)
      .where(
        and(
          inArray(orders.status, ['confirmed', 'processing', 'shipped', 'delivered']),
          sql`EXTRACT(MONTH FROM ${orders.createdAt}) = ${currentMonth + 1}`,
          sql`EXTRACT(YEAR FROM ${orders.createdAt}) = ${currentYear}`
        )
      );

    // Get previous month revenue
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const prevMonthResult = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`
      })
      .from(orders)
      .where(
        and(
          inArray(orders.status, ['confirmed', 'processing', 'shipped', 'delivered']),
          sql`EXTRACT(MONTH FROM ${orders.createdAt}) = ${prevMonth + 1}`,
          sql`EXTRACT(YEAR FROM ${orders.createdAt}) = ${prevYear}`
        )
      );

    const currentRevenue = parseFloat(String(currentMonthResult[0]?.revenue || 0));
    const prevRevenue = parseFloat(String(prevMonthResult[0]?.revenue || 0));

    let percentage = 0;
    let trend: 'up' | 'down' | 'neutral' = 'neutral';

    if (prevRevenue > 0) {
      percentage = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
      trend = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
    } else if (currentRevenue > 0) {
      percentage = 100;
      trend = 'up';
    }

    const formatted = `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;

    // Cache the result
    await this.cacheWidget('revenue_growth', { percentage, trend, formatted });

    return { percentage, trend, formatted };
  }

  /**
   * Get expense breakdown by category (all-time data)
   */
  static async getExpenseBreakdown(): Promise<Array<{ category: string; amount: number; percentage: number }>> {
    // Check cache first
    const cached = await this.getCachedWidget('expense_breakdown');
    if (cached) return cached.data;

    // Calculate fresh data - show all-time breakdown instead of just current month
    const result = await db
      .select({
        category: expenseCategories.name,
        amount: sql<number>`SUM(CAST(${expenses.amount} AS DECIMAL))`,
        count: count()
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(eq(expenseCategories.isActive, true))
      .groupBy(expenseCategories.id, expenseCategories.name)
      .orderBy(desc(sql`SUM(CAST(${expenses.amount} AS DECIMAL))`));

    const totalAmount = result.reduce((sum, item) => sum + (parseFloat(String(item.amount || 0))), 0);

    const breakdown = result.map(item => ({
      category: item.category || 'Uncategorized',
      amount: Number(parseFloat(String(item.amount || 0)).toFixed(2)),
      percentage: totalAmount > 0 ? Math.round(((parseFloat(String(item.amount || 0))) / totalAmount) * 100) : 0
    }));

    // Return only top 7 categories
    const top7Breakdown = breakdown.slice(0, 7);

    // Cache the result
    await this.cacheWidget('expense_breakdown', { data: top7Breakdown });

    return top7Breakdown;
  }

  /**
   * Get top selling products
   */
  static async getTopSellingProducts(): Promise<Array<{ productCode: string; productName: string; salesCount: number; revenue: number }>> {
    // Check cache first
    const cached = await this.getCachedWidget('top_selling_products');
    if (cached) return cached.data;

    // Calculate fresh data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const result = await db
      .select({
        productCode: products.productCode,
        productName: products.name,
        salesCount: count(orderItems.id),
        revenue: sql<number>`SUM(CAST(${orderItems.totalPrice} AS DECIMAL))`
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(
        and(
          inArray(orders.status, ['confirmed', 'processing', 'shipped', 'delivered']),
          sql`EXTRACT(MONTH FROM ${orders.createdAt}) = ${currentMonth + 1}`,
          sql`EXTRACT(YEAR FROM ${orders.createdAt}) = ${currentYear}`
        )
      )
      .groupBy(products.id, products.productCode, products.name)
      .orderBy(desc(count(orderItems.id)), desc(sql`SUM(CAST(${orderItems.totalPrice} AS DECIMAL))`))
      .limit(5);

    const topProducts = result.map(item => ({
      productCode: item.productCode || 'N/A',
      productName: item.productName || 'Unknown Product',
      salesCount: item.salesCount || 0,
      revenue: Number(parseFloat(String(item.revenue || 0)).toFixed(2))
    }));

    // Cache the result
    await this.cacheWidget('top_selling_products', { data: topProducts });

    return topProducts;
  }

  /**
   * Get average product value (all active products)
   */
  static async getAverageProductValue(): Promise<{ aov: number; formatted: string }> {
    // Temporarily bypass cache for testing
    // const cached = await this.getCachedWidget('average_product_value');
    // if (cached) return cached;

    // Calculate fresh data
    const result = await db
      .select({
        aov: sql<number>`COALESCE(AVG(CAST(${products.price} AS DECIMAL)), 0)`
      })
      .from(products)
      .where(eq(products.isActive, true));

    const aov = parseFloat(String(result[0]?.aov || 0));
    const formatted = `₹${aov.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Temporarily skip caching for testing
    // await this.cacheWidget('average_product_value', { aov, formatted });

    return { aov, formatted };
  }

  // CACHE MANAGEMENT

  /**
   * Get cached widget data
   */
  private static async getCachedWidget(metricType: string): Promise<any> {
    const cached = await db
      .select()
      .from(analyticsCache)
      .where(eq(analyticsCache.metricType, metricType))
      .limit(1);

    if (!cached.length) return null;

    // Check if cache is fresh (30 minutes for most, 1-2 hours for heavy calculations)
    const updatedAt = cached[0]?.updatedAt;
    const cacheAge = Date.now() - new Date(updatedAt || new Date()).getTime();

    let cacheThreshold = 30 * 60 * 1000; // 30 minutes default

    // Set different cache thresholds for heavy calculations
    if (metricType === 'overall_revenue' || metricType === 'net_profit') {
      cacheThreshold = 2 * 60 * 60 * 1000; // 2 hours
    } else if (metricType === 'overall_aov' || metricType === 'average_product_value') {
      cacheThreshold = 60 * 60 * 1000; // 1 hour
    }

    if (cacheAge > cacheThreshold) return null;

    return cached[0]?.calculatedData;
  }

  /**
   * Cache widget data
   */
  private static async cacheWidget(metricType: string, data: any): Promise<void> {
    await db
      .insert(analyticsCache)
      .values({
        metricType,
        calculatedData: data,
        computationTimeMs: 0, // We'll track this if needed
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: analyticsCache.metricType,
        set: {
          calculatedData: data,
          updatedAt: new Date()
        }
      });
  }

  /**
   * Get all widgets data in a single call
   */
  static async getAllWidgets(): Promise<{
    overallRevenue: { revenue: number; formatted: string };
    monthlyRevenue: { revenue: number; formatted: string };
    monthlyOrders: number;
    netProfit: { profit: number; margin: number; formatted: string; marginFormatted: string };
    pendingOrders: number;
    staleData: number;
    averageOrderValue: { aov: number; formatted: string };
    revenueGrowth: { percentage: number; trend: 'up' | 'down' | 'neutral'; formatted: string };
    expenseBreakdown: Array<{ category: string; amount: number; percentage: number }>;
    topSellingProducts: Array<{ productCode: string; productName: string; salesCount: number; revenue: number }>;
    averageProductValue: { aov: number; formatted: string };
  }> {
    // Calculate on-the-fly widgets in parallel
    const [pendingOrders, staleData] = await Promise.all([
      this.getPendingOrders(),
      this.getStaleDataCount()
    ]);

    // Calculate cached widgets in parallel
    const [
      overallRevenue,
      monthlyRevenue,
      monthlyOrders,
      netProfit,
      averageOrderValue,
      revenueGrowth,
      expenseBreakdown,
      topSellingProducts,
      averageProductValue
    ] = await Promise.all([
      this.getOverallRevenue(),
      this.getMonthlyRevenue(),
      this.getMonthlyOrders(),
      this.getNetProfit(),
      this.getAverageOrderValue(),
      this.getRevenueGrowth(),
      this.getExpenseBreakdown(),
      this.getTopSellingProducts(),
      this.getAverageProductValue()
    ]);

    return {
      overallRevenue,
      monthlyRevenue,
      monthlyOrders,
      netProfit,
      pendingOrders,
      staleData,
      averageOrderValue,
      revenueGrowth,
      expenseBreakdown,
      topSellingProducts,
      averageProductValue
    };
  }

  /**
   * Refresh all cached widgets
   */
  static async refreshAllCachedWidgets(): Promise<void> {
    // Clear all cached widget data
    await db.delete(analyticsCache);

    // Recalculate all cached widgets
    await Promise.all([
      this.getOverallRevenue(),
      this.getMonthlyRevenue(),
      this.getMonthlyOrders(),
      this.getNetProfit(),
      this.getAverageOrderValue(),
      this.getRevenueGrowth(),
      this.getExpenseBreakdown(),
      this.getTopSellingProducts(),
      this.getAverageProductValue()
    ]);
  }

  /**
   * Clear cache for debugging
   */
  static async clearCache(): Promise<void> {
    await db.delete(analyticsCache);
    console.log('Cache cleared');
  }
} 
