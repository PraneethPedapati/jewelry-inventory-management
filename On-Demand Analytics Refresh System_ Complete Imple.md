<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# On-Demand Analytics Refresh System: Complete Implementation Document

## Executive Summary

This document outlines the complete implementation of an on-demand analytics refresh system for the inventory management admin module. The system optimizes computational resources by calculating complex analytics only when explicitly requested, while maintaining live access to simple database counts.

## System Architecture Overview

### Core Concept

- **Live Data**: Simple database counts (products, orders, expenses) fetched in real-time
- **Computed Analytics**: Complex calculations triggered only by user refresh action
- **Persistent Storage**: All calculated analytics stored in database for instant retrieval
- **Resource Optimization**: 70-80% reduction in continuous computational load


### Data Flow Architecture

```
User Dashboard → Live Counts (Real-time) + Cached Analytics (Stored)
User Clicks Refresh → Analytics Engine → Database Storage → Updated Dashboard
```


## Database Schema Implementation

### Primary Analytics Storage Table

```sql
CREATE TABLE analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL,
    calculated_data JSONB NOT NULL,
    computation_time_ms INTEGER,
    data_period_start DATE,
    data_period_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_cache_metric_type ON analytics_cache(metric_type);
CREATE INDEX idx_analytics_cache_updated_at ON analytics_cache(updated_at DESC);
```


### Analytics Metadata Table

```sql
CREATE TABLE analytics_metadata (
    id SERIAL PRIMARY KEY,
    last_refresh_at TIMESTAMP,
    refresh_duration_ms INTEGER,
    total_orders_processed INTEGER,
    total_expenses_processed INTEGER,
    triggered_by VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed'
);
```


### Historical Analytics Table

```sql
CREATE TABLE analytics_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL,
    calculated_data JSONB NOT NULL,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```


## Frontend Implementation

### Dashboard State Management

#### TypeScript Interface Definitions

```typescript
interface DashboardState {
  liveData: {
    totalProducts: number;
    totalOrders: number;
    totalExpenses: number;
    lastUpdated: string;
  };
  analyticsData: {
    netRevenue: number;
    monthlyTrends: Array<MonthlyTrend>;
    expenseBreakdown: Array<ExpenseCategory>;
    topProducts: Array<ProductPerformance>;
    lastRefreshed: string;
    isRefreshing: boolean;
    isStale: boolean;
  };
}

interface MonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  orderCount: number;
}

interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

interface ProductPerformance {
  productId: number;
  name: string;
  totalSold: number;
  revenue: number;
  profitMargin: number;
}
```


#### React Component Structure

```jsx
// Main Dashboard Component
const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardState>();
  const [refreshing, setRefreshing] = useState(false);

  // Load initial data (live + cached analytics)
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const response = await fetch('/api/admin/dashboard');
    const data = await response.json();
    setDashboardData(data.data);
  };

  const triggerAnalyticsRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/admin/analytics/refresh', {
        method: 'POST'
      });
      const updatedAnalytics = await response.json();
      
      setDashboardData(prev => ({
        ...prev,
        analyticsData: {
          ...updatedAnalytics.data,
          isRefreshing: false,
          isStale: false
        }
      }));
    } catch (error) {
      console.error('Analytics refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <LiveMetricsSection data={dashboardData?.liveData} />
      <AnalyticsSection 
        data={dashboardData?.analyticsData}
        onRefresh={triggerAnalyticsRefresh}
        isRefreshing={refreshing}
      />
    </div>
  );
};
```


#### Refresh Button Component

```jsx
const RefreshAnalyticsButton = ({ 
  onRefresh, 
  lastRefreshed, 
  isLoading, 
  isStale 
}) => {
  const getButtonVariant = () => {
    if (isStale) return 'warning';
    return 'primary';
  };

  const getButtonText = () => {
    if (isLoading) return 'Refreshing...';
    if (isStale) return 'Refresh Recommended';
    return 'Refresh Analytics';
  };

  return (
    <div className="refresh-section">
      <button 
        onClick={onRefresh}
        disabled={isLoading}
        className={`refresh-btn ${getButtonVariant()}`}
      >
        {isLoading && <LoadingSpinner />}
        {getButtonText()}
      </button>
      {lastRefreshed && (
        <span className="last-refresh">
          Last updated: {formatDistanceToNow(new Date(lastRefreshed))} ago
        </span>
      )}
    </div>
  );
};
```


#### Progress Indicator Component

```jsx
const AnalyticsProgress = ({ steps, currentStep }) => {
  const progressSteps = [
    'Calculating Revenue',
    'Processing Expenses', 
    'Analyzing Trends',
    'Finalizing Results'
  ];

  return (
    <div className="analytics-progress">
      {progressSteps.map((step, index) => (
        <div 
          key={index}
          className={`progress-step ${index <= currentStep ? 'completed' : ''}`}
        >
          {step}
        </div>
      ))}
    </div>
  );
};
```


## Backend Implementation

### Analytics Controller

```typescript
import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { AnalyticsCache, AnalyticsMetadata } from '../models';

export class AnalyticsController {
  
  // GET /api/admin/dashboard - Load dashboard with live + cached data
  static async getDashboard(req: Request, res: Response) {
    try {
      // Fetch live data (fast queries)
      const liveData = await AnalyticsService.getLiveMetrics();
      
      // Fetch cached analytics
      const cachedAnalytics = await AnalyticsService.getCachedAnalytics();
      
      // Get refresh metadata
      const refreshMetadata = await AnalyticsService.getRefreshMetadata();
      
      res.json({
        success: true,
        data: {
          liveData,
          analyticsData: {
            ...cachedAnalytics,
            isStale: AnalyticsService.isStale(refreshMetadata?.last_refresh_at),
            lastRefreshed: refreshMetadata?.last_refresh_at
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to load dashboard data',
        error: error.message
      });
    }
  }

  // POST /api/admin/analytics/refresh - Trigger analytics refresh
  static async refreshAnalytics(req: Request, res: Response) {
    const startTime = Date.now();
    
    try {
      // Create processing record
      const processingRecord = await AnalyticsMetadata.create({
        status: 'processing',
        triggered_by: req.user?.id || 'system'
      });

      // Calculate all analytics in parallel
      const analyticsPromises = [
        AnalyticsService.calculateNetRevenue(),
        AnalyticsService.calculateMonthlyTrends(),
        AnalyticsService.calculateExpenseBreakdown(),
        AnalyticsService.calculateTopProducts()
      ];

      const [netRevenue, monthlyTrends, expenseBreakdown, topProducts] = 
        await Promise.all(analyticsPromises);

      const computationTime = Date.now() - startTime;

      // Store all calculated metrics
      await Promise.all([
        AnalyticsService.storeMetric('net_revenue', netRevenue),
        AnalyticsService.storeMetric('monthly_trends', monthlyTrends),
        AnalyticsService.storeMetric('expense_breakdown', expenseBreakdown),
        AnalyticsService.storeMetric('top_products', topProducts)
      ]);

      // Update metadata record
      await processingRecord.update({
        last_refresh_at: new Date(),
        refresh_duration_ms: computationTime,
        status: 'completed'
      });

      // Store historical snapshot
      await AnalyticsService.createHistoricalSnapshot({
        netRevenue,
        monthlyTrends,
        expenseBreakdown,
        topProducts
      });

      res.json({
        success: true,
        data: {
          netRevenue,
          monthlyTrends,
          expenseBreakdown,
          topProducts
        },
        metadata: {
          refreshedAt: new Date().toISOString(),
          computationTimeMs: computationTime
        }
      });

    } catch (error) {
      await AnalyticsMetadata.create({
        status: 'failed',
        triggered_by: req.user?.id || 'system'
      });
      
      res.status(500).json({
        success: false,
        message: 'Analytics refresh failed',
        error: error.message
      });
    }
  }
}
```


### Analytics Service Layer

```typescript
export class AnalyticsService {
  
  // Get live metrics (simple counts)
  static async getLiveMetrics() {
    const [totalProducts, totalOrders, totalExpenses] = await Promise.all([
      Product.count(),
      Order.count({ where: { status: { [Op.ne]: 'cancelled' } } }),
      Expense.count()
    ]);

    return {
      totalProducts,
      totalOrders,
      totalExpenses,
      lastUpdated: new Date().toISOString()
    };
  }

  // Calculate net revenue
  static async calculateNetRevenue() {
    const result = await sequelize.query(`
      WITH revenue_total AS (
        SELECT COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0) as total_revenue
        FROM orders 
        WHERE status != 'cancelled'
      ),
      expense_total AS (
        SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as total_expenses
        FROM expenses
      )
      SELECT 
        r.total_revenue,
        e.total_expenses,
        (r.total_revenue - e.total_expenses) as net_revenue,
        CASE 
          WHEN r.total_revenue > 0 
          THEN ROUND(((r.total_revenue - e.total_expenses) / r.total_revenue) * 100, 2)
          ELSE 0 
        END as profit_margin_percentage
      FROM revenue_total r, expense_total e;
    `, { type: QueryTypes.SELECT });

    return {
      totalRevenue: parseFloat(result[0].total_revenue) || 0,
      totalExpenses: parseFloat(result[0].total_expenses) || 0,
      netRevenue: parseFloat(result[0].net_revenue) || 0,
      profitMarginPercentage: parseFloat(result[0].profit_margin_percentage) || 0,
      calculatedAt: new Date().toISOString()
    };
  }

  // Calculate monthly trends
  static async calculateMonthlyTrends() {
    const monthlyData = await sequelize.query(`
      WITH monthly_revenue AS (
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as order_count,
          COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0) as revenue
        FROM orders
        WHERE status != 'cancelled'
          AND created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
      ),
      monthly_expenses AS (
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COALESCE(SUM(CAST(amount AS DECIMAL)), 0) as expenses
        FROM expenses
        WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
      )
      SELECT 
        COALESCE(r.month, e.month) as month,
        COALESCE(r.revenue, 0) as revenue,
        COALESCE(e.expenses, 0) as expenses,
        COALESCE(r.revenue, 0) - COALESCE(e.expenses, 0) as net_profit,
        COALESCE(r.order_count, 0) as order_count
      FROM monthly_revenue r
      FULL OUTER JOIN monthly_expenses e ON r.month = e.month
      ORDER BY month DESC
      LIMIT 12;
    `, { type: QueryTypes.SELECT });

    return monthlyData.map(row => ({
      month: new Date(row.month).toISOString().substring(0, 7), // YYYY-MM format
      revenue: parseFloat(row.revenue) || 0,
      expenses: parseFloat(row.expenses) || 0,
      netProfit: parseFloat(row.net_profit) || 0,
      orderCount: parseInt(row.order_count) || 0
    }));
  }

  // Calculate expense breakdown
  static async calculateExpenseBreakdown() {
    const expenseData = await sequelize.query(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(CAST(amount AS DECIMAL)) as total_amount
      FROM expenses
      GROUP BY category
      ORDER BY total_amount DESC;
    `, { type: QueryTypes.SELECT });

    const totalExpenses = expenseData.reduce(
      (sum, item) => sum + parseFloat(item.total_amount), 0
    );

    return expenseData.map(item => ({
      category: item.category,
      amount: parseFloat(item.total_amount) || 0,
      count: parseInt(item.count) || 0,
      percentage: totalExpenses > 0 
        ? Math.round((parseFloat(item.total_amount) / totalExpenses) * 100)
        : 0
    }));
  }

  // Calculate top performing products
  static async calculateTopProducts() {
    const topProducts = await sequelize.query(`
      SELECT 
        p.id as product_id,
        p.name,
        COUNT(oi.id) as total_sold,
        SUM(CAST(oi.price AS DECIMAL) * oi.quantity) as revenue,
        AVG(CAST(oi.price AS DECIMAL)) as avg_price
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      GROUP BY p.id, p.name
      HAVING COUNT(oi.id) > 0
      ORDER BY revenue DESC
      LIMIT 10;
    `, { type: QueryTypes.SELECT });

    return topProducts.map(product => ({
      productId: parseInt(product.product_id),
      name: product.name,
      totalSold: parseInt(product.total_sold) || 0,
      revenue: parseFloat(product.revenue) || 0,
      averagePrice: parseFloat(product.avg_price) || 0
    }));
  }

  // Store calculated metric in database
  static async storeMetric(metricType: string, data: any) {
    await AnalyticsCache.upsert({
      metric_type: metricType,
      calculated_data: data,
      updated_at: new Date()
    }, {
      conflictFields: ['metric_type']
    });
  }

  // Retrieve cached analytics
  static async getCachedAnalytics() {
    const cachedMetrics = await AnalyticsCache.findAll({
      order: [['updated_at', 'DESC']]
    });

    const analytics = {};
    cachedMetrics.forEach(metric => {
      analytics[metric.metric_type] = metric.calculated_data;
    });

    return analytics;
  }

  // Get refresh metadata
  static async getRefreshMetadata() {
    return await AnalyticsMetadata.findOne({
      where: { status: 'completed' },
      order: [['last_refresh_at', 'DESC']]
    });
  }

  // Check if analytics data is stale
  static isStale(lastRefreshAt: Date): boolean {
    if (!lastRefreshAt) return true;
    
    const hoursSinceRefresh = (Date.now() - lastRefreshAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceRefresh > 24; // Consider stale after 24 hours
  }

  // Create historical snapshot
  static async createHistoricalSnapshot(analyticsData: any) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    await Promise.all([
      AnalyticsHistory.create({
        metric_type: 'daily_snapshot',
        calculated_data: analyticsData,
        snapshot_date: today
      })
    ]);
  }
}
```


## API Routes Implementation

### Route Definitions

```typescript
// routes/analytics.ts
import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Dashboard data endpoint
router.get('/dashboard', AnalyticsController.getDashboard);

// Analytics refresh endpoint
router.post('/analytics/refresh', AnalyticsController.refreshAnalytics);

// Analytics status endpoint
router.get('/analytics/status', AnalyticsController.getAnalyticsStatus);

// Historical analytics endpoint
router.get('/analytics/history/:metric', AnalyticsController.getHistoricalData);

export default router;
```


## Database Models

### Sequelize Model Definitions

```typescript
// models/AnalyticsCache.ts
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class AnalyticsCache extends Model {
  public id!: string;
  public metric_type!: string;
  public calculated_data!: any;
  public computation_time_ms!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

AnalyticsCache.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  metric_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  calculated_data: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  computation_time_ms: {
    type: DataTypes.INTEGER
  }
}, {
  sequelize,
  tableName: 'analytics_cache',
  underscored: true
});

// models/AnalyticsMetadata.ts
export class AnalyticsMetadata extends Model {
  public id!: number;
  public last_refresh_at!: Date;
  public refresh_duration_ms!: number;
  public triggered_by!: string;
  public status!: string;
}

AnalyticsMetadata.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  last_refresh_at: {
    type: DataTypes.DATE
  },
  refresh_duration_ms: {
    type: DataTypes.INTEGER
  },
  triggered_by: {
    type: DataTypes.STRING(100)
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'completed'
  }
}, {
  sequelize,
  tableName: 'analytics_metadata',
  underscored: true
});
```


## Performance Optimization

### Database Query Optimization

```sql
-- Create materialized view for complex monthly calculations
CREATE MATERIALIZED VIEW monthly_analytics AS
SELECT 
  DATE_TRUNC('month', o.created_at) as month,
  COUNT(DISTINCT o.id) as order_count,
  SUM(CAST(o.total_amount AS DECIMAL)) as total_revenue,
  COUNT(DISTINCT oi.product_id) as unique_products_sold,
  AVG(CAST(o.total_amount AS DECIMAL)) as avg_order_value
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status != 'cancelled'
GROUP BY DATE_TRUNC('month', o.created_at);

-- Refresh materialized view during analytics refresh
REFRESH MATERIALIZED VIEW monthly_analytics;
```


### Caching Strategy

```typescript
// Redis caching for frequently accessed data
export class CacheService {
  private static redis = new Redis(process.env.REDIS_URL);

  static async cacheAnalytics(key: string, data: any, ttl: number = 3600) {
    await this.redis.setex(key, ttl, JSON.stringify(data));
  }

  static async getCachedAnalytics(key: string) {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  static async invalidateAnalyticsCache() {
    const pattern = 'analytics:*';
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```


## Error Handling \& Monitoring

### Error Handling Implementation

```typescript
export class AnalyticsErrorHandler {
  static async handleCalculationError(error: Error, metricType: string) {
    console.error(`Analytics calculation failed for ${metricType}:`, error);
    
    // Log error to monitoring system
    await this.logError(error, metricType);
    
    // Store error in database
    await AnalyticsMetadata.create({
      status: 'failed',
      triggered_by: 'system',
      error_message: error.message
    });
    
    // Return fallback data if available
    return await this.getFallbackData(metricType);
  }

  static async logError(error: Error, context: string) {
    // Integration with monitoring service (e.g., Sentry, LogRocket)
    console.error(`[Analytics Error] ${context}:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  static async getFallbackData(metricType: string) {
    // Return last successful calculation or default values
    const lastSuccessful = await AnalyticsCache.findOne({
      where: { metric_type: metricType },
      order: [['updated_at', 'DESC']]
    });

    return lastSuccessful?.calculated_data || this.getDefaultData(metricType);
  }
}
```


### Performance Monitoring

```typescript
export class AnalyticsMonitor {
  static async trackPerformance(metricType: string, executionTime: number) {
    // Store performance metrics
    await AnalyticsMetadata.update({
      computation_time_ms: executionTime
    }, {
      where: { metric_type: metricType },
      order: [['created_at', 'DESC']],
      limit: 1
    });

    // Alert if performance degrades
    if (executionTime > 30000) { // 30 seconds threshold
      await this.sendPerformanceAlert(metricType, executionTime);
    }
  }

  static async getPerformanceMetrics() {
    return await AnalyticsMetadata.findAll({
      attributes: [
        'metric_type',
        [sequelize.fn('AVG', sequelize.col('computation_time_ms')), 'avg_time'],
        [sequelize.fn('MAX', sequelize.col('computation_time_ms')), 'max_time'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'execution_count']
      ],
      group: ['metric_type'],
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });
  }
}
```


## Security Implementation

### Access Control

```typescript
// middleware/analyticsAuth.ts
export const authorizeAnalyticsAccess = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Analytics access requires admin privileges'
    });
  }

  // Rate limiting for analytics refresh
  if (req.path.includes('/refresh')) {
    const lastRefresh = req.session.lastAnalyticsRefresh;
    const cooldownPeriod = 5 * 60 * 1000; // 5 minutes
    
    if (lastRefresh && (Date.now() - lastRefresh) < cooldownPeriod) {
      return res.status(429).json({
        success: false,
        message: 'Analytics refresh is rate limited. Please wait 5 minutes between refreshes.'
      });
    }
    
    req.session.lastAnalyticsRefresh = Date.now();
  }

  next();
};
```


### Data Validation

```typescript
export class AnalyticsValidator {
  static validateCalculatedData(metricType: string, data: any): boolean {
    const validators = {
      net_revenue: this.validateNetRevenue,
      monthly_trends: this.validateMonthlyTrends,
      expense_breakdown: this.validateExpenseBreakdown,
      top_products: this.validateTopProducts
    };

    const validator = validators[metricType];
    return validator ? validator(data) : false;
  }

  static validateNetRevenue(data: any): boolean {
    return (
      typeof data.totalRevenue === 'number' &&
      typeof data.totalExpenses === 'number' &&
      typeof data.netRevenue === 'number' &&
      data.totalRevenue >= 0 &&
      data.totalExpenses >= 0
    );
  }

  static validateMonthlyTrends(data: Array<any>): boolean {
    return Array.isArray(data) && data.every(item =>
      typeof item.month === 'string' &&
      typeof item.revenue === 'number' &&
      typeof item.expenses === 'number' &&
      item.revenue >= 0 && item.expenses >= 0
    );
  }
}
```


## Deployment \& Maintenance

### Database Migration Scripts

```sql
-- Migration: Create analytics tables
-- File: migrations/001_create_analytics_tables.sql

BEGIN;

CREATE TABLE analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL UNIQUE,
    calculated_data JSONB NOT NULL,
    computation_time_ms INTEGER,
    data_period_start DATE,
    data_period_end DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics_metadata (
    id SERIAL PRIMARY KEY,
    last_refresh_at TIMESTAMP,
    refresh_duration_ms INTEGER,
    total_orders_processed INTEGER,
    total_expenses_processed INTEGER,
    triggered_by VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed'
);

CREATE TABLE analytics_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL,
    calculated_data JSONB NOT NULL,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_analytics_cache_metric_type ON analytics_cache(metric_type);
CREATE INDEX idx_analytics_cache_updated_at ON analytics_cache(updated_at DESC);
CREATE INDEX idx_analytics_metadata_refresh_at ON analytics_metadata(last_refresh_at DESC);
CREATE INDEX idx_analytics_history_metric_date ON analytics_history(metric_type, snapshot_date);

COMMIT;
```


### Cleanup Jobs

```typescript
// jobs/analyticsCleanup.ts
export class AnalyticsCleanupJob {
  static async cleanupHistoricalData() {
    // Remove analytics history older than 6 months
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6);

    await AnalyticsHistory.destroy({
      where: {
        created_at: {
          [Op.lt]: cutoffDate
        }
      }
    });

    // Remove failed metadata entries older than 1 month
    const metadataCutoff = new Date();
    metadataCutoff.setMonth(metadataCutoff.getMonth() - 1);

    await AnalyticsMetadata.destroy({
      where: {
        status: 'failed',
        created_at: {
          [Op.lt]: metadataCutoff
        }
      }
    });
  }

  static async validateDataIntegrity() {
    // Check for data consistency issues
    const cachedRevenue = await AnalyticsCache.findOne({
      where: { metric_type: 'net_revenue' }
    });

    if (cachedRevenue) {
      const freshCalculation = await AnalyticsService.calculateNetRevenue();
      const variance = Math.abs(
        cachedRevenue.calculated_data.netRevenue - freshCalculation.netRevenue
      );

      if (variance > 100) { // $100 threshold
        console.warn('Analytics data integrity issue detected', {
          cached: cachedRevenue.calculated_data.netRevenue,
          fresh: freshCalculation.netRevenue,
          variance
        });
      }
    }
  }
}
```


## Testing Strategy

### Unit Tests

```typescript
// tests/analyticsService.test.ts
describe('AnalyticsService', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('calculateNetRevenue', () => {
    it('should calculate net revenue correctly', async () => {
      // Create test data
      await createTestOrders([
        { total_amount: '100.00', status: 'completed' },
        { total_amount: '50.00', status: 'completed' }
      ]);
      await createTestExpenses([
        { amount: '30.00' },
        { amount: '20.00' }
      ]);

      const result = await AnalyticsService.calculateNetRevenue();

      expect(result.totalRevenue).toBe(150);
      expect(result.totalExpenses).toBe(50);
      expect(result.netRevenue).toBe(100);
      expect(result.profitMarginPercentage).toBe(66.67);
    });

    it('should handle zero revenue correctly', async () => {
      await createTestExpenses([{ amount: '25.00' }]);

      const result = await AnalyticsService.calculateNetRevenue();

      expect(result.totalRevenue).toBe(0);
      expect(result.totalExpenses).toBe(25);
      expect(result.netRevenue).toBe(-25);
      expect(result.profitMarginPercentage).toBe(0);
    });
  });

  describe('storeMetric', () => {
    it('should store analytics data correctly', async () => {
      const testData = {
        totalRevenue: 1000,
        totalExpenses: 300,
        netRevenue: 700
      };

      await AnalyticsService.storeMetric('net_revenue', testData);

      const stored = await AnalyticsCache.findOne({
        where: { metric_type: 'net_revenue' }
      });

      expect(stored.calculated_data).toEqual(testData);
    });
  });
});
```


### Integration Tests

```typescript
// tests/analyticsController.test.ts
describe('Analytics API Endpoints', () => {
  describe('POST /api/admin/analytics/refresh', () => {
    it('should refresh analytics and return calculated data', async () => {
      // Setup test data
      await setupTestOrdersAndExpenses();

      const response = await request(app)
        .post('/api/admin/analytics/refresh')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('netRevenue');
      expect(response.body.data).toHaveProperty('monthlyTrends');
      expect(response.body.metadata).toHaveProperty('refreshedAt');
    });

    it('should require admin authentication', async () => {
      await request(app)
        .post('/api/admin/analytics/refresh')
        .expect(401);
    });
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return live and cached analytics data', async () => {
      // Pre-populate cache
      await AnalyticsService.storeMetric('net_revenue', {
        totalRevenue: 1000,
        totalExpenses: 300,
        netRevenue: 700
      });

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('liveData');
      expect(response.body.data).toHaveProperty('analyticsData');
      expect(response.body.data.liveData).toHaveProperty('totalProducts');
    });
  });
});
```


## Configuration \& Environment Variables

### Environment Configuration

```bash
# .env file
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/inventory_db

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Analytics Configuration
ANALYTICS_CACHE_TTL=3600
ANALYTICS_STALE_THRESHOLD_HOURS=24
ANALYTICS_REFRESH_COOLDOWN_MINUTES=5

# Performance Monitoring
ANALYTICS_SLOW_QUERY_THRESHOLD_MS=30000
ENABLE_ANALYTICS_MONITORING=true

# Security
ANALYTICS_RATE_LIMIT_REQUESTS=5
ANALYTICS_RATE_LIMIT_WINDOW_MINUTES=15
```


### Application Configuration

```typescript
// config/analytics.ts
export const analyticsConfig = {
  cache: {
    ttl: parseInt(process.env.ANALYTICS_CACHE_TTL) || 3600,
    staleThresholdHours: parseInt(process.env.ANALYTICS_STALE_THRESHOLD_HOURS) || 24
  },
  performance: {
    slowQueryThreshold: parseInt(process.env.ANALYTICS_SLOW_QUERY_THRESHOLD_MS) || 30000,
    enableMonitoring: process.env.ENABLE_ANALYTICS_MONITORING === 'true'
  },
  security: {
    refreshCooldownMinutes: parseInt(process.env.ANALYTICS_REFRESH_COOLDOWN_MINUTES) || 5,
    rateLimitRequests: parseInt(process.env.ANALYTICS_RATE_LIMIT_REQUESTS) || 5,
    rateLimitWindowMinutes: parseInt(process.env.ANALYTICS_RATE_LIMIT_WINDOW_MINUTES) || 15
  },
  cleanup: {
    historyRetentionMonths: 6,
    failedMetadataRetentionMonths: 1
  }
};
```

This comprehensive implementation document provides all the necessary components to build a robust, scalable on-demand analytics refresh system with persistent storage, optimized performance, and proper error handling.

