import { db } from '../db/connection.js';
import { analyticsCache, analyticsMetadata, analyticsHistory, orders, expenses, expenseCategories, orderItems, products } from '../db/schema.js';
import { eq, desc, and, gte, sql, count } from 'drizzle-orm';
import { config } from '../config/app.js';
import type { AnalyticsMetadata } from '../db/schema.js';

// In-memory cache for analytics data
class AnalyticsCacheService {
  private cache = new Map<string, any>();
  private lastRefreshTime = new Map<string, number>();
  private readonly COOLDOWN_PERIOD = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Check if analytics can be refreshed (cooldown period)
  canRefresh(metricType: string): boolean {
    const lastRefresh = this.lastRefreshTime.get(metricType);
    if (!lastRefresh) return true;

    const timeSinceLastRefresh = Date.now() - lastRefresh;
    return timeSinceLastRefresh >= this.COOLDOWN_PERIOD;
  }

  // Get cached analytics data
  getCached(metricType: string): any | null {
    return this.cache.get(metricType) || null;
  }

  // Set cached analytics data
  setCached(metricType: string, data: any): void {
    this.cache.set(metricType, data);
    this.lastRefreshTime.set(metricType, Date.now());
  }

  // Clear cache for a specific metric
  clearCache(metricType: string): void {
    this.cache.delete(metricType);
    this.lastRefreshTime.delete(metricType);
  }

  // Clear all cache
  clearAllCache(): void {
    this.cache.clear();
    this.lastRefreshTime.clear();
  }

  // Get remaining cooldown time
  getRemainingCooldown(metricType: string): number {
    const lastRefresh = this.lastRefreshTime.get(metricType);
    if (!lastRefresh) return 0;

    const timeSinceLastRefresh = Date.now() - lastRefresh;
    const remaining = this.COOLDOWN_PERIOD - timeSinceLastRefresh;
    return Math.max(0, remaining);
  }
}

// Global cache instance
const analyticsCacheService = new AnalyticsCacheService();

export class AnalyticsService {

  // Get live metrics (simple counts)
  static async getLiveMetrics() {
    const [totalProductsResult, totalOrdersResult, totalExpensesResult] = await Promise.all([
      db.select({ count: count() }).from(products).where(eq(products.isActive, true)),
      db.select({ count: count() }).from(orders),
      db.select({ count: count() }).from(expenses)
    ]);

    return {
      totalProducts: totalProductsResult[0]?.count || 0,
      totalOrders: totalOrdersResult[0]?.count || 0,
      totalExpenses: totalExpensesResult[0]?.count || 0,
      lastUpdated: new Date().toISOString()
    };
  }

  // Calculate net revenue
  static async calculateNetRevenue() {
    const startTime = Date.now();

    // Get total revenue from orders
    const revenueResult = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`
      })
      .from(orders)
      .where(sql`${orders.status} != 'cancelled'`);

    // Get total expenses
    const expensesResult = await db
      .select({
        totalExpenses: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL)), 0)`
      })
      .from(expenses);

    const totalRevenue = parseFloat(String(revenueResult[0]?.totalRevenue || '0'));
    const totalExpenses = parseFloat(String(expensesResult[0]?.totalExpenses || '0'));
    const netRevenue = totalRevenue - totalExpenses;
    const profitMarginPercentage = totalRevenue > 0 ? ((netRevenue / totalRevenue) * 100) : 0;

    const computationTime = Date.now() - startTime;

    return {
      totalRevenue,
      totalExpenses,
      netRevenue,
      profitMarginPercentage: Math.round(profitMarginPercentage * 100) / 100,
      calculatedAt: new Date().toISOString(),
      computationTimeMs: computationTime
    };
  }

  // Calculate monthly trends
  static async calculateMonthlyTrends() {
    const startTime = Date.now();

    // Get orders data for last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const ordersData = await db
      .select({
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        status: orders.status
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, twelveMonthsAgo),
          sql`${orders.status} != 'cancelled'`
        )
      );

    // Get expenses data for last 12 months
    const expensesData = await db
      .select({
        amount: expenses.amount,
        expenseDate: expenses.expenseDate
      })
      .from(expenses)
      .where(gte(expenses.expenseDate, twelveMonthsAgo));

    // Group by month
    const monthlyData: { [key: string]: { revenue: number; expenses: number; orderCount: number } } = {};

    // Process orders
    ordersData.forEach(order => {
      if (order.createdAt) {
        const month = new Date(order.createdAt).toISOString().substring(0, 7); // YYYY-MM format
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, expenses: 0, orderCount: 0 };
        }
        monthlyData[month].revenue += parseFloat(order.totalAmount);
        monthlyData[month].orderCount += 1;
      }
    });

    // Process expenses
    expensesData.forEach(expense => {
      if (expense.expenseDate) {
        const month = new Date(expense.expenseDate).toISOString().substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, expenses: 0, orderCount: 0 };
        }
        monthlyData[month].expenses += parseFloat(expense.amount);
      }
    });

    // Convert to array and sort by month
    const monthlyTrends = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        revenue: Math.round(data.revenue),
        expenses: Math.round(data.expenses),
        netProfit: Math.round(data.revenue - data.expenses),
        orderCount: data.orderCount
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Get last 12 months

    const computationTime = Date.now() - startTime;

    return {
      monthlyTrends,
      calculatedAt: new Date().toISOString(),
      computationTimeMs: computationTime
    };
  }

  // Calculate expense breakdown
  static async calculateExpenseBreakdown() {
    const startTime = Date.now();

    // Get all expenses with category information
    const expensesData = await db
      .select({
        amount: expenses.amount,
        categoryId: expenses.categoryId,
        categoryName: expenseCategories.name
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(eq(expenseCategories.isActive, true));

    // Group by category
    const categoryBreakdown: { [key: string]: { amount: number; count: number; name: string } } = {};

    expensesData.forEach(expense => {
      const categoryName = expense.categoryName || 'Uncategorized';
      if (!categoryBreakdown[categoryName]) {
        categoryBreakdown[categoryName] = { amount: 0, count: 0, name: categoryName };
      }
      categoryBreakdown[categoryName].amount += parseFloat(expense.amount);
      categoryBreakdown[categoryName].count += 1;
    });

    const totalExpenses = Object.values(categoryBreakdown).reduce((sum, cat) => sum + cat.amount, 0);

    // Convert to array with percentages
    const expenseBreakdown = Object.values(categoryBreakdown)
      .map(category => ({
        category: category.name,
        amount: Math.round(category.amount),
        count: category.count,
        percentage: totalExpenses > 0 ? Math.round((category.amount / totalExpenses) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount); // Sort by amount descending

    const computationTime = Date.now() - startTime;

    return {
      expenseBreakdown,
      totalExpenses: Math.round(totalExpenses),
      calculatedAt: new Date().toISOString(),
      computationTimeMs: computationTime
    };
  }

  // Calculate top performing products
  static async calculateTopProducts() {
    const startTime = Date.now();

    // Get order items with product information
    const orderItemsData = await db
      .select({
        productSnapshot: orderItems.productSnapshot,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice
      })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .where(sql`${orders.status} != 'cancelled'`);

    // Group by product
    const productPerformance: {
      [key: string]: {
        name: string;
        totalSold: number;
        revenue: number;
        avgPrice: number;
        count: number;
      }
    } = {};

    orderItemsData.forEach(item => {
      const productSnapshot = item.productSnapshot as any;
      const productName = productSnapshot?.product?.name || productSnapshot?.name || 'Unknown Product';

      if (!productPerformance[productName]) {
        productPerformance[productName] = {
          name: productName,
          totalSold: 0,
          revenue: 0,
          avgPrice: 0,
          count: 0
        };
      }

      const quantity = item.quantity;
      const revenue = parseFloat(item.totalPrice || '0');
      const unitPrice = parseFloat(item.unitPrice || '0');

      productPerformance[productName].totalSold += quantity;
      productPerformance[productName].revenue += revenue;
      productPerformance[productName].count += 1;
    });

    // Calculate average prices and convert to array
    const topProducts = Object.values(productPerformance)
      .map(product => ({
        name: product.name,
        totalSold: product.totalSold,
        revenue: Math.round(product.revenue),
        averagePrice: Math.round(product.revenue / product.totalSold),
        orderCount: product.count
      }))
      .sort((a, b) => b.revenue - a.revenue) // Sort by revenue descending
      .slice(0, 10); // Top 10 products

    const computationTime = Date.now() - startTime;

    return {
      topProducts,
      calculatedAt: new Date().toISOString(),
      computationTimeMs: computationTime
    };
  }

  // Store calculated metric in database
  static async storeMetric(metricType: string, data: any): Promise<void> {
    await db
      .insert(analyticsCache)
      .values({
        metricType,
        calculatedData: data,
        computationTimeMs: data.computationTimeMs,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: analyticsCache.metricType,
        set: {
          calculatedData: data,
          computationTimeMs: data.computationTimeMs,
          updatedAt: new Date()
        }
      });
  }

  // Retrieve cached analytics from database
  static async getCachedAnalytics(): Promise<any> {
    const cachedMetrics = await db
      .select()
      .from(analyticsCache)
      .orderBy(desc(analyticsCache.updatedAt));

    const analytics: any = {};
    cachedMetrics.forEach(metric => {
      analytics[metric.metricType] = metric.calculatedData;
    });

    return analytics;
  }

  // Get refresh metadata
  static async getRefreshMetadata(): Promise<AnalyticsMetadata | null> {
    const metadata = await db
      .select()
      .from(analyticsMetadata)
      .where(eq(analyticsMetadata.status, 'completed'))
      .orderBy(desc(analyticsMetadata.lastRefreshAt))
      .limit(1);

    return metadata[0] || null;
  }

  // Create historical snapshot
  static async createHistoricalSnapshot(analyticsData: any): Promise<void> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    await db.insert(analyticsHistory).values({
      metricType: 'daily_snapshot',
      calculatedData: analyticsData,
      snapshotDate: new Date(today || new Date())
    });
  }

  // Check if analytics data is stale (24 hours)
  static isStale(lastRefreshAt: Date | null): boolean {
    if (!lastRefreshAt) return true;

    const hoursSinceRefresh = (Date.now() - lastRefreshAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceRefresh > 24;
  }

  // Get analytics with caching
  static async getAnalytics(metricType: string): Promise<any> {
    // Check in-memory cache first
    const cachedData = analyticsCacheService.getCached(metricType);
    if (cachedData) {
      return cachedData;
    }

    // Check database cache
    const dbCached = await db
      .select()
      .from(analyticsCache)
      .where(eq(analyticsCache.metricType, metricType))
      .limit(1);

    if (dbCached[0]) {
      const data = dbCached[0].calculatedData;
      analyticsCacheService.setCached(metricType, data);
      return data;
    }

    return null;
  }

  // Refresh analytics with cooldown check
  static async refreshAnalytics(metricType: string, userId?: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    cooldownRemaining?: number;
  }> {
    // Check cooldown
    if (!analyticsCacheService.canRefresh(metricType)) {
      const remaining = analyticsCacheService.getRemainingCooldown(metricType);
      return {
        success: false,
        error: 'Analytics refresh is rate limited. Please wait before refreshing again.',
        cooldownRemaining: remaining
      };
    }

    try {
      // Create processing record
      const processingRecord = await db.insert(analyticsMetadata).values({
        status: 'processing',
        triggeredBy: userId || 'system',
        createdAt: new Date()
      }).returning();

      let calculatedData: any;

      // Calculate based on metric type
      switch (metricType) {
        case 'net_revenue':
          calculatedData = await this.calculateNetRevenue();
          break;
        case 'monthly_trends':
          calculatedData = await this.calculateMonthlyTrends();
          break;
        case 'expense_breakdown':
          calculatedData = await this.calculateExpenseBreakdown();
          break;
        case 'top_products':
          calculatedData = await this.calculateTopProducts();
          break;
        default:
          throw new Error(`Unknown metric type: ${metricType}`);
      }

      // Store in database
      await this.storeMetric(metricType, calculatedData);

      // Update in-memory cache
      analyticsCacheService.setCached(metricType, calculatedData);

      // Update metadata record
      if (processingRecord[0]?.id) {
        await db
          .update(analyticsMetadata)
          .set({
            lastRefreshAt: new Date(),
            refreshDurationMs: calculatedData.computationTimeMs,
            status: 'completed'
          })
          .where(eq(analyticsMetadata.id, processingRecord[0].id));
      }

      return {
        success: true,
        data: calculatedData
      };

    } catch (error) {
      console.error(`Analytics refresh failed for ${metricType}:`, error);

      // Update metadata record with failure
      await db.insert(analyticsMetadata).values({
        status: 'failed',
        triggeredBy: userId || 'system',
        createdAt: new Date()
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Refresh all analytics
  static async refreshAllAnalytics(userId?: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    cooldownRemaining?: number;
  }> {
    const metrics = ['net_revenue', 'monthly_trends', 'expense_breakdown', 'top_products'];

    // Check cooldown for any metric
    for (const metric of metrics) {
      if (!analyticsCacheService.canRefresh(metric)) {
        const remaining = analyticsCacheService.getRemainingCooldown(metric);
        return {
          success: false,
          error: 'Analytics refresh is rate limited. Please wait before refreshing again.',
          cooldownRemaining: remaining
        };
      }
    }

    try {
      // Create processing record
      const processingRecord = await db.insert(analyticsMetadata).values({
        status: 'processing',
        triggeredBy: userId || 'system',
        createdAt: new Date()
      }).returning();

      const startTime = Date.now();

      // Calculate all analytics in parallel
      const [netRevenue, monthlyTrends, expenseBreakdown, topProducts] = await Promise.all([
        this.calculateNetRevenue(),
        this.calculateMonthlyTrends(),
        this.calculateExpenseBreakdown(),
        this.calculateTopProducts()
      ]);

      const totalComputationTime = Date.now() - startTime;

      // Store all calculated metrics
      await Promise.all([
        this.storeMetric('net_revenue', netRevenue),
        this.storeMetric('monthly_trends', monthlyTrends),
        this.storeMetric('expense_breakdown', expenseBreakdown),
        this.storeMetric('top_products', topProducts)
      ]);

      // Update in-memory cache for all metrics
      analyticsCacheService.setCached('net_revenue', netRevenue);
      analyticsCacheService.setCached('monthly_trends', monthlyTrends);
      analyticsCacheService.setCached('expense_breakdown', expenseBreakdown);
      analyticsCacheService.setCached('top_products', topProducts);

      // Update metadata record
      if (processingRecord[0]?.id) {
        await db
          .update(analyticsMetadata)
          .set({
            lastRefreshAt: new Date(),
            refreshDurationMs: totalComputationTime,
            status: 'completed'
          })
          .where(eq(analyticsMetadata.id, processingRecord[0].id));
      }

      // Create historical snapshot
      await this.createHistoricalSnapshot({
        netRevenue,
        monthlyTrends,
        expenseBreakdown,
        topProducts
      });

      return {
        success: true,
        data: {
          netRevenue,
          monthlyTrends,
          expenseBreakdown,
          topProducts
        }
      };

    } catch (error) {
      console.error('Analytics refresh failed:', error);

      // Update metadata record with failure
      await db.insert(analyticsMetadata).values({
        status: 'failed',
        triggeredBy: userId || 'system',
        createdAt: new Date()
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get cooldown status for all metrics
  static getCooldownStatus(): { [key: string]: { canRefresh: boolean; remainingMs: number } } {
    const metrics = ['net_revenue', 'monthly_trends', 'expense_breakdown', 'top_products'];
    const status: { [key: string]: { canRefresh: boolean; remainingMs: number } } = {};

    metrics.forEach(metric => {
      status[metric] = {
        canRefresh: analyticsCacheService.canRefresh(metric),
        remainingMs: analyticsCacheService.getRemainingCooldown(metric)
      };
    });

    return status;
  }
} 
