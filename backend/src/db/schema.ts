import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp, jsonb, unique, check, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Admin Authentication
export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).default('admin'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastLogin: timestamp('last_login', { withTimezone: true }),
});

// Color Themes for Configurable Palettes
export const colorThemes = pgTable('color_themes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(false),
  isDefault: boolean('is_default').default(false),
  colors: jsonb('colors').notNull(), // {primary: "#hex", secondary: "#hex", accent: "#hex", etc.}
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Product Types (chain, bracelet, anklet)
export const productTypes = pgTable('product_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  specificationType: varchar('specification_type', { length: 20 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  checkSpecType: check('specification_type_check', sql`${table.specificationType} IN ('layer', 'size')`),
}));

// Complete Jewelry Products (Charm + Chain combinations)
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  charmDescription: text('charm_description').notNull(),
  chainDescription: text('chain_description').notNull(),
  productTypeId: uuid('product_type_id').notNull().references(() => productTypes.id),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  sku: varchar('sku', { length: 50 }).unique(),
  images: jsonb('images').default(sql`'[]'::jsonb`),
  isActive: boolean('is_active').default(true),
  stockAlertThreshold: integer('stock_alert_threshold').default(5),
  metaDescription: text('meta_description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  // Search vector will be added via raw SQL in migrations
});

// Product Specifications (Sizes or Layers)
export const productSpecifications = pgTable('product_specifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  specType: varchar('spec_type', { length: 20 }).notNull(),
  specValue: varchar('spec_value', { length: 20 }).notNull(),
  displayName: varchar('display_name', { length: 50 }).notNull(),
  priceModifier: decimal('price_modifier', { precision: 10, scale: 2 }).default('0.00'),
  stockQuantity: integer('stock_quantity').default(0),
  isAvailable: boolean('is_available').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueProductSpec: unique().on(table.productId, table.specType, table.specValue),
  checkSpecType: check('spec_type_check', sql`${table.specType} IN ('size', 'layer')`),
  checkStockQuantity: check('stock_quantity_check', sql`${table.stockQuantity} >= 0`),
}));

// Customer Orders
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: varchar('order_number', { length: 20 }).notNull().unique(),
  customerName: varchar('customer_name', { length: 100 }).notNull(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
  customerAddress: text('customer_address').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  whatsappMessageSent: boolean('whatsapp_message_sent').default(false),
  paymentReceived: boolean('payment_received').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  checkStatus: check('status_check', sql`${table.status} IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')`),
  checkTotalAmount: check('total_amount_check', sql`${table.totalAmount} > 0`),
}));

// Order Items with Specifications
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  specificationId: uuid('specification_id').notNull().references(() => productSpecifications.id),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).generatedAlwaysAs(sql`${sql.identifier('quantity')} * ${sql.identifier('unit_price')}`),
  productSnapshot: jsonb('product_snapshot').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  checkQuantity: check('quantity_check', sql`${table.quantity} > 0`),
  checkUnitPrice: check('unit_price_check', sql`${table.unitPrice} > 0`),
}));

// Order Status History
export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  oldStatus: varchar('old_status', { length: 20 }),
  newStatus: varchar('new_status', { length: 20 }).notNull(),
  changedBy: uuid('changed_by').references(() => admins.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Expense Categories
export const expenseCategories = pgTable('expense_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Expenses
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  categoryId: uuid('category_id').notNull().references(() => expenseCategories.id),
  expenseDate: timestamp('expense_date', { withTimezone: true }).notNull(),
  receipt: varchar('receipt', { length: 500 }), // URL to receipt image
  addedBy: uuid('added_by').notNull().references(() => admins.id),
  tags: jsonb('tags').default(sql`'[]'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  checkAmount: check('amount_check', sql`${table.amount} > 0`),
}));

// System Configurations
export const systemConfigs = pgTable('system_configs', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Analytics Cache Table
export const analyticsCache = pgTable('analytics_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  metricType: varchar('metric_type', { length: 50 }).notNull().unique(),
  calculatedData: jsonb('calculated_data').notNull(),
  computationTimeMs: integer('computation_time_ms'),
  dataPeriodStart: timestamp('data_period_start', { withTimezone: true }),
  dataPeriodEnd: timestamp('data_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Analytics Metadata Table
export const analyticsMetadata = pgTable('analytics_metadata', {
  id: serial('id').primaryKey(),
  lastRefreshAt: timestamp('last_refresh_at', { withTimezone: true }),
  refreshDurationMs: integer('refresh_duration_ms'),
  totalOrdersProcessed: integer('total_orders_processed'),
  totalExpensesProcessed: integer('total_expenses_processed'),
  triggeredBy: varchar('triggered_by', { length: 100 }),
  status: varchar('status', { length: 20 }).default('completed'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Analytics History Table
export const analyticsHistory = pgTable('analytics_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  metricType: varchar('metric_type', { length: 50 }).notNull(),
  calculatedData: jsonb('calculated_data').notNull(),
  snapshotDate: timestamp('snapshot_date', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Relations
export const adminsRelations = relations(admins, ({ many }) => ({
  statusChanges: many(orderStatusHistory),
  addedExpenses: many(expenses),
}));

export const colorThemesRelations = relations(colorThemes, ({ many }) => ({
  // Can add relations if needed for theme usage tracking
}));

export const productTypesRelations = relations(productTypes, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  productType: one(productTypes, {
    fields: [products.productTypeId],
    references: [productTypes.id],
  }),
  specifications: many(productSpecifications),
  orderItems: many(orderItems),
}));

export const productSpecificationsRelations = relations(productSpecifications, ({ one, many }) => ({
  product: one(products, {
    fields: [productSpecifications.productId],
    references: [products.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  specification: one(productSpecifications, {
    fields: [orderItems.specificationId],
    references: [productSpecifications.id],
  }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
  admin: one(admins, {
    fields: [orderStatusHistory.changedBy],
    references: [admins.id],
  }),
}));

export const expenseCategoriesRelations = relations(expenseCategories, ({ many }) => ({
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  category: one(expenseCategories, {
    fields: [expenses.categoryId],
    references: [expenseCategories.id],
  }),
  addedBy: one(admins, {
    fields: [expenses.addedBy],
    references: [admins.id],
  }),
}));

// Export types for use in other files
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;

export type ColorTheme = typeof colorThemes.$inferSelect;
export type NewColorTheme = typeof colorThemes.$inferInsert;

export type ProductType = typeof productTypes.$inferSelect;
export type NewProductType = typeof productTypes.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductSpecification = typeof productSpecifications.$inferSelect;
export type NewProductSpecification = typeof productSpecifications.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type NewOrderStatusHistory = typeof orderStatusHistory.$inferInsert;

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type NewExpenseCategory = typeof expenseCategories.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type SystemConfig = typeof systemConfigs.$inferSelect;
export type NewSystemConfig = typeof systemConfigs.$inferInsert;

// Analytics Types
export type AnalyticsCache = typeof analyticsCache.$inferSelect;
export type NewAnalyticsCache = typeof analyticsCache.$inferInsert;

export type AnalyticsMetadata = typeof analyticsMetadata.$inferSelect;
export type NewAnalyticsMetadata = typeof analyticsMetadata.$inferInsert;

export type AnalyticsHistory = typeof analyticsHistory.$inferSelect;
export type NewAnalyticsHistory = typeof analyticsHistory.$inferInsert; 
