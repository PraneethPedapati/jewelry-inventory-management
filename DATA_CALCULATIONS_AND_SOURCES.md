# Data Calculations and Sources Documentation
## Inventory Management System - Admin Module

### Document Version: 1.0
### Last Updated: 2024-12-19
### Status: DRAFT - Under Review

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Implementation Analysis](#current-implementation-analysis)
3. [Database Schema & Data Sources](#database-schema--data-sources)
4. [Detailed Calculations Breakdown](#detailed-calculations-breakdown)
5. [Missing Implementations](#missing-implementations)
6. [Proposed Calculation Methods](#proposed-calculation-methods)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Data Consistency Issues](#data-consistency-issues)

---

## Executive Summary

This document provides a comprehensive analysis of all data calculations, sources, and metrics displayed across the admin module. It identifies current implementations, gaps, and provides detailed calculation methods for all business metrics.

### Key Findings:
- ✅ **4 endpoints** with backend calculations working
- ❌ **1 critical endpoint** missing (`/api/admin/analytics`)
- 🔄 **3 calculation locations** need standardization (move to backend)
- 📊 **6 business metrics** not implemented (profit, net worth, etc.)

---

## Current Implementation Analysis

### Working Backend Calculations

#### 1. Dashboard Statistics
**Endpoint**: `GET /api/admin/dashboard`  
**Controller**: `backend/src/controllers/admin/dashboard.controller.ts`  
**Status**: ✅ Fully Implemented

#### 2. Order Statistics  
**Endpoint**: `GET /api/admin/orders/stats`  
**Controller**: `backend/src/controllers/admin/order.controller.ts`  
**Status**: ✅ Fully Implemented

#### 3. Expense Statistics
**Endpoint**: `GET /api/admin/expenses/stats`  
**Controller**: `backend/src/controllers/admin/expense.controller.ts`  
**Status**: ✅ Fully Implemented

### Missing Backend Implementations

#### 1. Analytics Data
**Endpoint**: `GET /api/admin/analytics`  
**Status**: ❌ Not Implemented (Frontend calls non-existent endpoint)

#### 2. Product Analytics
**Current**: Frontend calculations only  
**Status**: 🔄 Needs backend implementation

---

## Database Schema & Data Sources

### Core Tables for Calculations

```sql
-- Revenue & Orders Source
orders {
  id: UUID PRIMARY KEY,
  order_number: VARCHAR(20) UNIQUE,
  total_amount: DECIMAL(10,2),
  status: VARCHAR(20), -- pending, confirmed, processing, shipped, delivered, cancelled
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}

-- Order Line Items (for detailed analysis)
order_items {
  id: UUID PRIMARY KEY,
  order_id: UUID REFERENCES orders(id),
  product_id: UUID REFERENCES products(id),
  specification_id: UUID REFERENCES product_specifications(id),
  quantity: INTEGER,
  unit_price: DECIMAL(10,2),
  total_price: DECIMAL(10,2) GENERATED, -- quantity * unit_price
  product_snapshot: JSONB -- stores product data at time of order
}

-- Product Data Source
products {
  id: UUID PRIMARY KEY,
  name: VARCHAR(200),
  base_price: DECIMAL(10,2),
  is_active: BOOLEAN DEFAULT true,
  stock_alert_threshold: INTEGER DEFAULT 5,
  created_at: TIMESTAMP
}

-- Product Specifications (for inventory & pricing)
product_specifications {
  id: UUID PRIMARY KEY,
  product_id: UUID REFERENCES products(id),
  spec_type: VARCHAR(20), -- 'size' or 'layer'
  spec_value: VARCHAR(20),
  price_modifier: DECIMAL(10,2) DEFAULT 0.00,
  stock_quantity: INTEGER DEFAULT 0,
  is_available: BOOLEAN DEFAULT true
}

-- Expense Data Source
expenses {
  id: UUID PRIMARY KEY,
  title: VARCHAR(200),
  amount: DECIMAL(10,2),
  category_id: UUID REFERENCES expense_categories(id),
  expense_date: TIMESTAMP,
  created_at: TIMESTAMP
}

-- Expense Categories
expense_categories {
  id: UUID PRIMARY KEY,
  name: VARCHAR(100) UNIQUE,
  description: TEXT
}
```

---

## Detailed Calculations Breakdown

### 1. Dashboard Metrics

#### Total Revenue
**Source**: `orders.total_amount`  
**Calculation**: 
```sql
SELECT SUM(CAST(total_amount AS DECIMAL)) as total_revenue
FROM orders
WHERE status != 'cancelled';
```
**Current Implementation**: ✅ Working  
**Location**: `backend/src/controllers/admin/dashboard.controller.ts:25-27`

#### Total Products
**Source**: `products` table  
**Calculation**:
```sql
SELECT COUNT(*) as total_products
FROM products
WHERE is_active = true;
```
**Current Implementation**: ✅ Working  
**Location**: `backend/src/controllers/admin/dashboard.controller.ts:13-17`

#### Total Orders
**Source**: `orders` table  
**Calculation**:
```sql
SELECT COUNT(*) as total_orders
FROM orders;
```
**Current Implementation**: ✅ Working  
**Location**: `backend/src/controllers/admin/dashboard.controller.ts:27`

#### Revenue Growth (Month-over-Month)
**Source**: `orders.total_amount` + `orders.created_at`  
**Calculation**:
```sql
-- Current Month Revenue
SELECT SUM(CAST(total_amount AS DECIMAL)) as current_revenue
FROM orders
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
  AND status != 'cancelled';

-- Previous Month Revenue  
SELECT SUM(CAST(total_amount AS DECIMAL)) as previous_revenue
FROM orders
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
  AND created_at < DATE_TRUNC('month', CURRENT_DATE)
  AND status != 'cancelled';

-- Growth Calculation
growth_percentage = ((current_revenue - previous_revenue) / previous_revenue) * 100
```
**Current Implementation**: ✅ Working  
**Location**: `backend/src/controllers/admin/dashboard.controller.ts:30-52`

### 2. Product Analytics (Currently Frontend Only)

#### Products in Stock
**Source**: `products.is_active`  
**Current Calculation** (Frontend):
```javascript
const inStockProducts = products.filter(p => p.isActive).length;
```
**Proposed Backend Calculation**:
```sql
SELECT COUNT(*) as in_stock_count
FROM products
WHERE is_active = true;
```

#### Products Out of Stock
**Source**: `products.is_active`  
**Current Calculation** (Frontend):
```javascript
const outOfStockProducts = products.filter(p => !p.isActive).length;
```
**Proposed Backend Calculation**:
```sql
SELECT COUNT(*) as out_of_stock_count
FROM products
WHERE is_active = false;
```

#### Average Product Price
**Source**: `products.base_price`  
**Current Calculation** (Frontend):
```javascript
const avgPrice = products.reduce((sum, p) => sum + parseFloat(p.basePrice), 0) / products.length;
```
**Proposed Backend Calculation**:
```sql
SELECT AVG(CAST(base_price AS DECIMAL)) as average_price
FROM products
WHERE is_active = true;
```

### 3. Expense Analytics

#### Total Expenses
**Source**: `expenses.amount`  
**Calculation**:
```sql
SELECT SUM(CAST(amount AS DECIMAL)) as total_expenses
FROM expenses;
```
**Current Implementation**: ✅ Working  
**Location**: `backend/src/controllers/admin/expense.controller.ts:380-394`

#### Expense Category Breakdown
**Source**: `expenses` + `expense_categories`  
**Calculation**:
```sql
SELECT 
  ec.name as category_name,
  SUM(CAST(e.amount AS DECIMAL)) as total_amount,
  COUNT(e.id) as expense_count,
  (SUM(CAST(e.amount AS DECIMAL)) / 
   (SELECT SUM(CAST(amount AS DECIMAL)) FROM expenses) * 100) as percentage
FROM expenses e
JOIN expense_categories ec ON e.category_id = ec.id
GROUP BY ec.id, ec.name
ORDER BY total_amount DESC;
```
**Current Implementation**: ✅ Partial (missing percentages)  
**Location**: `backend/src/controllers/admin/expense.controller.ts:375-405`

### 4. Order Analytics

#### Orders by Status
**Source**: `orders.status`  
**Calculation**:
```sql
SELECT 
  status,
  COUNT(*) as count,
  SUM(CAST(total_amount AS DECIMAL)) as total_value
FROM orders
GROUP BY status;
```
**Current Implementation**: ✅ Working  
**Location**: `backend/src/controllers/admin/order.controller.ts:422-435`

---

## Missing Implementations

### 1. Analytics Dashboard Data (CRITICAL)

**Frontend Expectation**: `GET /api/admin/analytics`  
**Status**: ❌ Endpoint doesn't exist

#### Required Analytics Data Structure:
```typescript
interface AnalyticsData {
  revenueData: Array<{
    month: string;           // e.g., "Jan", "Feb"
    revenue: number;         // Total revenue for the month
    expenses: number;        // Total expenses for the month
  }>;
  expenseCategories: Array<{
    name: string;           // Category name
    amount: number;         // Total amount spent
    percentage: number;     // Percentage of total expenses
  }>;
  topSellingProducts: Array<{
    name: string;           // Product name
    sales: number;          // Number of units sold
    revenue: string;        // Total revenue from product
    profit: string;         // Total profit (if cost tracking added)
  }>;
}
```

#### Proposed Calculations:

##### Monthly Revenue vs Expenses
```sql
-- Combined monthly data
WITH monthly_revenue AS (
  SELECT 
    DATE_TRUNC('month', created_at) as month,
    SUM(CAST(total_amount AS DECIMAL)) as revenue
  FROM orders
  WHERE status != 'cancelled'
  GROUP BY DATE_TRUNC('month', created_at)
),
monthly_expenses AS (
  SELECT 
    DATE_TRUNC('month', expense_date) as month,
    SUM(CAST(amount AS DECIMAL)) as expenses
  FROM expenses
  GROUP BY DATE_TRUNC('month', expense_date)
)
SELECT 
  COALESCE(r.month, e.month) as month,
  COALESCE(r.revenue, 0) as revenue,
  COALESCE(e.expenses, 0) as expenses
FROM monthly_revenue r
FULL OUTER JOIN monthly_expenses e ON r.month = e.month
ORDER BY month DESC
LIMIT 12; -- Last 12 months
```

##### Top Selling Products
```sql
SELECT 
  p.name,
  SUM(oi.quantity) as total_quantity_sold,
  COUNT(DISTINCT oi.order_id) as number_of_orders,
  SUM(CAST(oi.total_price AS DECIMAL)) as total_revenue,
  ROUND(AVG(CAST(oi.unit_price AS DECIMAL)), 2) as avg_unit_price
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status != 'cancelled'
  AND o.created_at >= CURRENT_DATE - INTERVAL '6 months' -- Last 6 months
GROUP BY p.id, p.name
ORDER BY total_revenue DESC
LIMIT 10;
```

### 2. Business Intelligence Metrics (Not Implemented)

#### Net Worth Calculation
**Formula**: `Total Revenue - Total Expenses + Inventory Value`
```sql
-- Simple Net Worth (Revenue - Expenses)
WITH totals AS (
  SELECT 
    (SELECT SUM(CAST(total_amount AS DECIMAL)) FROM orders WHERE status != 'cancelled') as total_revenue,
    (SELECT SUM(CAST(amount AS DECIMAL)) FROM expenses) as total_expenses
)
SELECT 
  total_revenue,
  total_expenses,
  (total_revenue - total_expenses) as net_worth
FROM totals;

-- Advanced Net Worth (including inventory)
WITH inventory_value AS (
  SELECT SUM(
    CAST(p.base_price AS DECIMAL) * ps.stock_quantity
  ) as inventory_total
  FROM products p
  JOIN product_specifications ps ON p.id = ps.product_id
  WHERE p.is_active = true AND ps.is_available = true
)
-- Add inventory_total to net worth calculation
```

#### Profit Margin Analysis
**Requirement**: Need `cost_price` field in products table
**Formula**: `(Selling Price - Cost Price) / Selling Price * 100`

**Proposed Schema Addition**:
```sql
ALTER TABLE products ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0;
```

**Calculation**:
```sql
SELECT 
  p.name,
  CAST(p.base_price AS DECIMAL) as selling_price,
  CAST(p.cost_price AS DECIMAL) as cost_price,
  ROUND(
    ((CAST(p.base_price AS DECIMAL) - CAST(p.cost_price AS DECIMAL)) / 
     CAST(p.base_price AS DECIMAL)) * 100, 2
  ) as profit_margin_percentage,
  (CAST(p.base_price AS DECIMAL) - CAST(p.cost_price AS DECIMAL)) as profit_per_unit
FROM products p
WHERE p.is_active = true
ORDER BY profit_margin_percentage DESC;
```

#### Inventory Turnover Rate
**Formula**: `Cost of Goods Sold / Average Inventory Value`
**Requirement**: Cost tracking and inventory movement history

#### Customer Lifetime Value
**Formula**: `Average Order Value × Purchase Frequency × Customer Lifespan`
**Current Limitation**: No customer tracking (orders store names but no customer IDs)

### 3. Advanced Analytics (Future Enhancements)

#### Seasonal Trends
```sql
-- Monthly sales patterns
SELECT 
  EXTRACT(MONTH FROM created_at) as month,
  COUNT(*) as order_count,
  SUM(CAST(total_amount AS DECIMAL)) as revenue,
  AVG(CAST(total_amount AS DECIMAL)) as avg_order_value
FROM orders
WHERE status != 'cancelled'
  AND created_at >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY EXTRACT(MONTH FROM created_at)
ORDER BY month;
```

#### Product Performance Matrix
```sql
-- High revenue vs high volume analysis
WITH product_metrics AS (
  SELECT 
    p.name,
    SUM(oi.quantity) as total_sold,
    SUM(CAST(oi.total_price AS DECIMAL)) as total_revenue,
    COUNT(DISTINCT oi.order_id) as order_frequency
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.status != 'cancelled'
  GROUP BY p.id, p.name
)
SELECT 
  name,
  total_sold,
  total_revenue,
  order_frequency,
  CASE 
    WHEN total_revenue > (SELECT AVG(total_revenue) FROM product_metrics) 
     AND total_sold > (SELECT AVG(total_sold) FROM product_metrics)
    THEN 'Star Product'
    WHEN total_revenue > (SELECT AVG(total_revenue) FROM product_metrics)
    THEN 'High Value'
    WHEN total_sold > (SELECT AVG(total_sold) FROM product_metrics)
    THEN 'High Volume'
    ELSE 'Low Performance'
  END as category
FROM product_metrics
ORDER BY total_revenue DESC;
```

---

## Proposed Calculation Methods

### 1. Analytics Controller Implementation

**File**: `backend/src/controllers/admin/analytics.controller.ts`

```typescript
import { Request, Response } from 'express';
import { eq, desc, count, sql } from 'drizzle-orm';
import { db } from '@/db/connection.js';
import { orders, orderItems, products, expenses, expenseCategories } from '@/db/schema.js';
import { asyncHandler } from '@/middleware/error-handler.middleware.js';

/**
 * Get comprehensive analytics data
 * GET /api/admin/analytics
 */
export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { period = 'last_12_months' } = req.query;

  // 1. Monthly Revenue vs Expenses
  const revenueData = await getMonthlyRevenueExpenses(period as string);
  
  // 2. Expense Category Breakdown with Percentages
  const expenseCategories = await getExpenseCategoryBreakdown();
  
  // 3. Top Selling Products
  const topSellingProducts = await getTopSellingProducts();

  res.json({
    success: true,
    data: {
      revenueData,
      expenseCategories,
      topSellingProducts
    },
    message: 'Analytics data retrieved successfully'
  });
});

/**
 * Get monthly revenue vs expenses comparison
 */
const getMonthlyRevenueExpenses = async (period: string) => {
  // Implementation details for monthly calculations
};

/**
 * Get expense breakdown by category with percentages
 */
const getExpenseCategoryBreakdown = async () => {
  // Implementation details for expense analysis
};

/**
 * Get top selling products with sales metrics
 */
const getTopSellingProducts = async () => {
  // Implementation details for product performance
};
```

### 2. Enhanced Product Statistics

**Endpoint**: `GET /api/admin/products/stats`

```typescript
export const getProductStats = asyncHandler(async (req: Request, res: Response) => {
  // Move frontend calculations to backend
  const stats = await db.execute(sql`
    SELECT 
      COUNT(*) as total_products,
      COUNT(*) FILTER (WHERE is_active = true) as active_products,
      COUNT(*) FILTER (WHERE is_active = false) as inactive_products,
      AVG(CAST(base_price AS DECIMAL)) as average_price,
      MIN(CAST(base_price AS DECIMAL)) as min_price,
      MAX(CAST(base_price AS DECIMAL)) as max_price
    FROM products
  `);

  const inventoryStats = await db.execute(sql`
    SELECT 
      SUM(stock_quantity) as total_stock,
      COUNT(*) as total_specifications,
      COUNT(*) FILTER (WHERE stock_quantity > 0) as in_stock_specs,
      COUNT(*) FILTER (WHERE stock_quantity = 0) as out_of_stock_specs
    FROM product_specifications
    WHERE is_available = true
  `);

  res.json({
    success: true,
    data: {
      products: stats[0],
      inventory: inventoryStats[0]
    }
  });
});
```

### 3. Business Intelligence Endpoints

#### Net Worth Calculation
```typescript
export const getBusinessMetrics = asyncHandler(async (req: Request, res: Response) => {
  const metrics = await db.execute(sql`
    WITH business_totals AS (
      SELECT 
        COALESCE(
          (SELECT SUM(CAST(total_amount AS DECIMAL)) 
           FROM orders WHERE status != 'cancelled'), 0
        ) as total_revenue,
        COALESCE(
          (SELECT SUM(CAST(amount AS DECIMAL)) FROM expenses), 0
        ) as total_expenses
    )
    SELECT 
      total_revenue,
      total_expenses,
      (total_revenue - total_expenses) as net_worth,
      CASE 
        WHEN total_revenue > 0 
        THEN ROUND((total_expenses / total_revenue) * 100, 2)
        ELSE 0 
      END as expense_ratio
    FROM business_totals
  `);

  res.json({
    success: true,
    data: metrics[0]
  });
});
```

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
1. **Create Analytics Controller**
   - Implement `/api/admin/analytics` endpoint
   - Add monthly revenue vs expenses calculation
   - Add expense category breakdown with percentages
   - Add top selling products analysis

2. **Add Analytics Route**
   - Update `backend/src/routes/admin.routes.ts`
   - Add proper authentication middleware

3. **Fix Frontend Analytics Page**
   - Remove hardcoded fallback data
   - Connect to real backend endpoint

### Phase 2: Data Standardization (Week 2)
1. **Product Statistics Backend**
   - Create `/api/admin/products/stats` endpoint
   - Move calculations from frontend to backend
   - Update frontend to use new endpoint

2. **Enhanced Expense Analytics**
   - Add percentage calculations to existing endpoint
   - Add time-based filtering options

### Phase 3: Business Intelligence (Week 3-4)
1. **Net Worth Tracking**
   - Implement business metrics endpoint
   - Add inventory valuation calculations

2. **Profit Tracking Infrastructure**
   - Add `cost_price` field to products table
   - Create profit margin calculations
   - Implement profit analysis endpoints

### Phase 4: Advanced Analytics (Future)
1. **Customer Analytics**
   - Add customer ID tracking
   - Implement customer lifetime value
   - Add customer segmentation

2. **Inventory Intelligence**
   - Implement turnover rate calculations
   - Add reorder point analysis
   - Create demand forecasting

---

## Data Consistency Issues

### Current Problems

1. **Split Calculation Logic**
   - Dashboard: Backend calculations ✅
   - Products: Frontend calculations ❌
   - Analytics: Hardcoded data ❌

2. **Inconsistent Number Formatting**
   - Backend returns raw numbers
   - Frontend applies different formatting
   - Currency display varies across components

3. **Date Range Inconsistencies**
   - Revenue growth: Current vs previous month
   - Analytics: No time filtering
   - Orders: Flexible date ranges

### Proposed Solutions

1. **Centralized Calculation Layer**
   ```typescript
   // All calculations in backend controllers
   // Frontend only displays formatted data
   // Consistent error handling across endpoints
   ```

2. **Standardized Response Format**
   ```typescript
   interface CalculationResponse<T> {
     success: boolean;
     data: T;
     metadata: {
       calculatedAt: string;
       period: string;
       dataPoints: number;
     };
     message: string;
   }
   ```

3. **Unified Date Filtering**
   ```typescript
   interface DateFilter {
     period: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
     from?: string;
     to?: string;
   }
   ```

---

## Testing & Validation Strategy

### 1. Calculation Accuracy Tests
- Verify all SQL calculations against expected results
- Test edge cases (empty data, single records)
- Validate percentage calculations sum to 100%

### 2. Performance Testing
- Monitor query execution times
- Test with large datasets
- Implement caching for expensive calculations

### 3. Data Integrity Checks
- Ensure revenue calculations match order totals
- Verify expense categorization accuracy
- Check for data consistency across endpoints

---

## Next Steps

1. **Review & Approve** this calculation document
2. **Prioritize Implementation** phases based on business needs
3. **Begin Phase 1** with analytics endpoint creation
4. **Test Thoroughly** each calculation before deployment
5. **Monitor Performance** after implementation

---

**Document Status**: DRAFT - Pending Review  
**Expected Implementation Time**: 3-4 weeks for all phases  
**Dependencies**: Database schema updates for profit tracking  
**Risk Assessment**: Low risk for existing functionality, medium risk for new features 
