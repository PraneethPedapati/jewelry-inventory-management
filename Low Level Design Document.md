<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Low Level Design Document

## Jewelry Inventory Management Application

**Document Version:** 1.0
**Date:** July 22, 2025
**Project:** Jewelry Inventory Management System
**Author:** Development Team
**Reference:** HLD v2.0

## Table of Contents

1. [Database Design](#1-database-design)
2. [API Specification](#2-api-specification)
3. [Component Architecture](#3-component-architecture)
4. [Security Implementation](#4-security-implementation)
5. [Error Handling Strategy](#5-error-handling-strategy)
6. [Data Flow Implementation](#6-data-flow-implementation)
7. [Code Structure \& Patterns](#7-code-structure--patterns)
8. [Testing Strategy](#8-testing-strategy)
9. [Performance Optimization](#9-performance-optimization)
10. [Configuration Management](#10-configuration-management)

## 1. Database Design

### 1.1 Complete Database Schema

```sql
-- PostgreSQL 16 Schema for Complete Jewelry Products

-- Admin Authentication
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Product Types (chain, bracelet, anklet)
CREATE TABLE product_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL, -- 'chain', 'bracelet', 'anklet'
    display_name VARCHAR(100) NOT NULL,
    specification_type VARCHAR(20) NOT NULL, -- 'layer' or 'size'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complete Jewelry Products (Charm + Chain combinations)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    charm_description TEXT NOT NULL,
    chain_description TEXT NOT NULL,
    product_type_id UUID NOT NULL REFERENCES product_types(id),
    base_price DECIMAL(10,2) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    images JSONB DEFAULT '[]', -- Array of image URLs
    is_active BOOLEAN DEFAULT true,
    stock_alert_threshold INTEGER DEFAULT 5,
    meta_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Search optimization
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', name || ' ' || charm_description || ' ' || chain_description)
    ) STORED
);

-- Product Specifications (Sizes or Layers)
CREATE TABLE product_specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    spec_type VARCHAR(20) NOT NULL, -- 'size' or 'layer'
    spec_value VARCHAR(20) NOT NULL, -- 'S', 'M', 'L' or 'single', 'double', 'triple'
    display_name VARCHAR(50) NOT NULL,
    price_modifier DECIMAL(10,2) DEFAULT 0.00,
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_product_spec UNIQUE(product_id, spec_type, spec_value)
);

-- Customer Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
    whatsapp_message_sent BOOLEAN DEFAULT false,
    payment_received BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'))
);

-- Order Items with Specifications
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    specification_id UUID NOT NULL REFERENCES product_specifications(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    product_snapshot JSONB NOT NULL, -- Snapshot of product at time of order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT positive_price CHECK (unit_price > 0)
);

-- Order Status History
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES admins(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Configurations
CREATE TABLE system_configs (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```


### 1.2 Database Indexes \& Performance

```sql
-- Performance Indexes
CREATE INDEX idx_products_type_active ON products(product_type_id, is_active);
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
CREATE INDEX idx_products_created ON products(created_at DESC);

CREATE INDEX idx_specifications_product ON product_specifications(product_id);
CREATE INDEX idx_specifications_available ON product_specifications(is_available, stock_quantity);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Composite indexes for analytics
CREATE INDEX idx_orders_analytics ON orders(status, created_at) WHERE status IN ('confirmed', 'delivered');
CREATE INDEX idx_order_items_analytics ON order_items(product_id, created_at);
```


### 1.3 Database Seed Data

```sql
-- Insert Product Types
INSERT INTO product_types (name, display_name, specification_type) VALUES
('chain', 'Chain', 'layer'),
('bracelet', 'Bracelet', 'size'),
('anklet', 'Anklet', 'size');

-- Insert Sample Complete Products
INSERT INTO products (name, charm_description, chain_description, product_type_id, base_price, sku) VALUES
('Butterfly Dream Chain', 'Delicate butterfly charm with crystal accents', 'Sterling silver curb chain', 
 (SELECT id FROM product_types WHERE name = 'chain'), 45.00, 'BDC001'),
('Heart Lock Bracelet', 'Heart-shaped lock charm with key detail', 'Rose gold plated cable chain', 
 (SELECT id FROM product_types WHERE name = 'bracelet'), 35.00, 'HLB001');

-- Insert Specifications
INSERT INTO product_specifications (product_id, spec_type, spec_value, display_name, price_modifier, stock_quantity) VALUES
-- Butterfly Chain specifications
((SELECT id FROM products WHERE sku = 'BDC001'), 'layer', 'single', 'Single Layer', 0.00, 10),
((SELECT id FROM products WHERE sku = 'BDC001'), 'layer', 'double', 'Double Layer', 15.00, 8),
((SELECT id FROM products WHERE sku = 'BDC001'), 'layer', 'triple', 'Triple Layer', 25.00, 5),
-- Heart Bracelet specifications
((SELECT id FROM products WHERE sku = 'HLB001'), 'size', 'S', 'Small (6-7 inches)', 0.00, 12),
((SELECT id FROM products WHERE sku = 'HLB001'), 'size', 'M', 'Medium (7-8 inches)', 5.00, 15),
((SELECT id FROM products WHERE sku = 'HLB001'), 'size', 'L', 'Large (8-9 inches)', 8.00, 10);
```


## 2. API Specification

### 2.1 TypeScript API Interfaces

```typescript
// src/types/api.ts

// Product Types
interface ProductType {
  id: string;
  name: 'chain' | 'bracelet' | 'anklet';
  displayName: string;
  specificationType: 'layer' | 'size';
  isActive: boolean;
  createdAt: string;
}

interface ProductSpecification {
  id: string;
  productId: string;
  specType: 'size' | 'layer';
  specValue: string;
  displayName: string;
  priceModifier: number;
  stockQuantity: number;
  isAvailable: boolean;
}

interface CompleteProduct {
  id: string;
  name: string;
  charmDescription: string;
  chainDescription: string;
  productType: ProductType;
  basePrice: number;
  sku: string;
  images: string[];
  isActive: boolean;
  specifications: ProductSpecification[];
  createdAt: string;
  updatedAt: string;
}

// Order Types
interface OrderItem {
  id: string;
  productId: string;
  specificationId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productSnapshot: CompleteProduct;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  whatsappMessageSent: boolean;
  paymentReceived: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    productId: string;
    specificationId: string;
    quantity: number;
  }[];
}

interface WhatsAppMessageRequest {
  orderId: string;
  messageType: 'order' | 'status';
  customMessage?: string;
}

interface WhatsAppMessageResponse {
  whatsappUrl: string;
  message: string;
  success: boolean;
}
```


### 2.2 Detailed API Endpoints

#### 2.2.1 Public Customer API

```typescript
// GET /api/products
interface ProductsResponse {
  products: CompleteProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    types: ProductType[];
    priceRange: { min: number; max: number };
  };
}

// GET /api/products/:id
interface ProductDetailResponse {
  product: CompleteProduct;
  relatedProducts: CompleteProduct[];
}

// POST /api/orders
interface CreateOrderResponse {
  order: Order;
  whatsappUrl: string;
  message: string;
}

// POST /api/whatsapp/generate-message
interface GenerateWhatsAppMessageResponse {
  whatsappUrl: string;
  message: string;
  orderId?: string;
}
```


#### 2.2.2 Protected Admin API

```typescript
// POST /api/admin/auth/login
interface AdminLoginRequest {
  email: string;
  password: string;
}

interface AdminLoginResponse {
  token: string;
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  expiresIn: number;
}

// GET /api/admin/dashboard
interface DashboardResponse {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    activeProducts: number;
    lowStockAlerts: number;
  };
  recentOrders: Order[];
  popularSpecifications: {
    productId: string;
    productName: string;
    specificationId: string;
    specificationName: string;
    orderCount: number;
  }[];
  salesChart: {
    date: string;
    orders: number;
    revenue: number;
  }[];
}

// GET /api/admin/orders
interface AdminOrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statusCounts: Record<string, number>;
}

// PUT /api/admin/orders/:id/status
interface UpdateOrderStatusRequest {
  status: Order['status'];
  notes?: string;
  notifyCustomer?: boolean;
}
```


### 2.3 API Implementation Examples

```typescript
// src/controllers/products.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { ProductService } from '../services/product.service';
import { asyncHandler } from '../middleware/async-handler';

const GetProductsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => parseInt(val || '1')),
    limit: z.string().optional().transform(val => parseInt(val || '12')),
    type: z.enum(['chain', 'bracelet', 'anklet']).optional(),
    search: z.string().optional(),
    minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
    maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  })
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { query } = GetProductsSchema.parse({ query: req.query });
  
  const result = await ProductService.getProducts({
    page: query.page,
    limit: query.limit,
    filters: {
      type: query.type,
      search: query.search,
      priceRange: query.minPrice && query.maxPrice ? {
        min: query.minPrice,
        max: query.maxPrice
      } : undefined
    }
  });

  res.json({
    success: true,
    data: result
  });
});

// src/controllers/orders.controller.ts
const CreateOrderSchema = z.object({
  body: z.object({
    customerName: z.string().min(2).max(100),
    customerEmail: z.string().email(),
    customerPhone: z.string().regex(/^\+?[\d\s-()]+$/),
    customerAddress: z.string().min(10).max(500),
    items: z.array(z.object({
      productId: z.string().uuid(),
      specificationId: z.string().uuid(),
      quantity: z.number().int().positive().max(10)
    })).min(1).max(20)
  })
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { body } = CreateOrderSchema.parse({ body: req.body });
  
  const orderResult = await OrderService.createOrder(body);
  const whatsappUrl = WhatsAppService.generateOrderMessage(orderResult.order);

  res.status(201).json({
    success: true,
    data: {
      order: orderResult.order,
      whatsappUrl: whatsappUrl.url,
      message: whatsappUrl.message
    }
  });
});
```


## 3. Component Architecture

### 3.1 Frontend Component Structure

```typescript
// src/components/customer/ProductCard.tsx
import React from 'react';
import { CompleteProduct } from '../../types/api';
import { formatPrice } from '../../utils/format';

interface ProductCardProps {
  product: CompleteProduct;
  onAddToCart: (productId: string, specificationId: string) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  className = '' 
}) => {
  const [selectedSpec, setSelectedSpec] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleAddToCart = async () => {
    if (!selectedSpec) return;
    
    setIsLoading(true);
    try {
      await onAddToCart(product.id, selectedSpec);
    } finally {
      setIsLoading(false);
    }
  };

  const getSpecificationPrice = (specId: string) => {
    const spec = product.specifications.find(s => s.id === specId);
    return product.basePrice + (spec?.priceModifier || 0);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Product Image */}
      <div className="aspect-square relative">
        <img 
          src={product.images[0] || '/placeholder-jewelry.jpg'}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {product.specifications.some(s => s.stockQuantity < 5) && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
            Low Stock
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
        
        <div className="space-y-2 mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Charm:</span> {product.charmDescription}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Chain:</span> {product.chainDescription}
          </p>
        </div>

        {/* Specifications */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Choose {product.productType.specificationType === 'layer' ? 'Layers' : 'Size'}:
          </label>
          <select
            value={selectedSpec}
            onChange={(e) => setSelectedSpec(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            {product.specifications
              .filter(spec => spec.isAvailable && spec.stockQuantity > 0)
              .map(spec => (
                <option key={spec.id} value={spec.id}>
                  {spec.displayName} - {formatPrice(product.basePrice + spec.priceModifier)}
                </option>
              ))}
          </select>
        </div>

        {/* Price Display */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-lg font-bold text-gray-900">
              {selectedSpec 
                ? formatPrice(getSpecificationPrice(selectedSpec))
                : `From ${formatPrice(product.basePrice)}`
              }
            </span>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!selectedSpec || isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};
```

```typescript
// src/components/admin/OrderManagement.tsx
import React from 'react';
import { Order } from '../../types/api';
import { useOrders, useUpdateOrderStatus } from '../../hooks/admin';
import { WhatsAppService } from '../../services/whatsapp.service';

interface OrderManagementProps {
  className?: string;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ className = '' }) => {
  const { data: orders, isLoading, refetch } = useOrders();
  const updateStatusMutation = useUpdateOrderStatus();

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: newStatus,
        notifyCustomer: true
      });
      refetch();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleSendWhatsApp = (order: Order) => {
    const whatsappUrl = WhatsAppService.generateStatusMessage(order);
    window.open(whatsappUrl.url, '_blank');
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading orders...</div>;
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold">Order Management</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders?.orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {order.orderNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {order.customerName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.customerPhone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    {order.items.map(item => (
                      <div key={item.id} className="mb-1">
                        {item.productSnapshot.name} × {item.quantity}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  ${order.totalAmount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleSendWhatsApp(order)}
                    className="text-green-600 hover:text-green-800 mr-3"
                  >
                    📱 WhatsApp
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```


### 3.2 Backend Service Layer

```typescript
// src/services/product.service.ts
import { db } from '../db/connection';
import { products, productTypes, productSpecifications } from '../db/schema';
import { eq, and, like, gte, lte, desc } from 'drizzle-orm';
import type { CompleteProduct, ProductFilters } from '../types/api';

export class ProductService {
  static async getProducts(params: {
    page: number;
    limit: number;
    filters?: ProductFilters;
  }): Promise<{
    products: CompleteProduct[];
    pagination: any;
    filters: any;
  }> {
    const { page, limit, filters } = params;
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [eq(products.isActive, true)];
    
    if (filters?.type) {
      const typeId = await db
        .select({ id: productTypes.id })
        .from(productTypes)
        .where(eq(productTypes.name, filters.type))
        .limit(1);
      
      if (typeId[0]) {
        conditions.push(eq(products.productTypeId, typeId[0].id));
      }
    }

    if (filters?.search) {
      conditions.push(
        like(products.searchVector, `%${filters.search}%`)
      );
    }

    if (filters?.priceRange) {
      conditions.push(
        and(
          gte(products.basePrice, filters.priceRange.min),
          lte(products.basePrice, filters.priceRange.max)
        )
      );
    }

    // Execute query with joins
    const productResults = await db
      .select()
      .from(products)
      .leftJoin(productTypes, eq(products.productTypeId, productTypes.id))
      .leftJoin(productSpecifications, eq(productSpecifications.productId, products.id))
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform and group results
    const productsMap = new Map<string, CompleteProduct>();
    
    productResults.forEach(row => {
      const product = row.products;
      const type = row.product_types;
      const spec = row.product_specifications;

      if (!productsMap.has(product.id)) {
        productsMap.set(product.id, {
          ...product,
          productType: type!,
          specifications: []
        } as CompleteProduct);
      }

      if (spec) {
        productsMap.get(product.id)!.specifications.push(spec);
      }
    });

    return {
      products: Array.from(productsMap.values()),
      pagination: {
        page,
        limit,
        total: productsMap.size, // This should be a separate count query
        totalPages: Math.ceil(productsMap.size / limit)
      },
      filters: await this.getAvailableFilters()
    };
  }

  private static async getAvailableFilters() {
    const types = await db.select().from(productTypes).where(eq(productTypes.isActive, true));
    const priceRange = await db
      .select({
        min: sql`MIN(${products.basePrice})`,
        max: sql`MAX(${products.basePrice})`
      })
      .from(products)
      .where(eq(products.isActive, true));

    return {
      types,
      priceRange: priceRange[0] || { min: 0, max: 1000 }
    };
  }
}
```

```typescript
// src/services/order.service.ts
import { db } from '../db/connection';
import { orders, orderItems, products, productSpecifications } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { CreateOrderRequest, Order } from '../types/api';
import { generateOrderNumber } from '../utils/order-utils';

export class OrderService {
  static async createOrder(orderData: CreateOrderRequest): Promise<{ order: Order }> {
    return await db.transaction(async (tx) => {
      // Validate products and calculate totals
      let totalAmount = 0;
      const validatedItems = [];

      for (const item of orderData.items) {
        const product = await tx
          .select()
          .from(products)
          .leftJoin(productSpecifications, eq(productSpecifications.id, item.specificationId))
          .where(eq(products.id, item.productId))
          .limit(1);

        if (!product[0] || !product[0].product_specifications) {
          throw new Error(`Invalid product or specification: ${item.productId}`);
        }

        const spec = product[0].product_specifications;
        if (spec.stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product[0].products.name}`);
        }

        const unitPrice = product[0].products.basePrice + spec.priceModifier;
        const itemTotal = unitPrice * item.quantity;
        totalAmount += itemTotal;

        validatedItems.push({
          ...item,
          unitPrice,
          totalPrice: itemTotal,
          productSnapshot: product[0].products
        });

        // Update stock
        await tx
          .update(productSpecifications)
          .set({
            stockQuantity: spec.stockQuantity - item.quantity
          })
          .where(eq(productSpecifications.id, spec.id));
      }

      // Create order
      const orderNumber = generateOrderNumber();
      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          customerAddress: orderData.customerAddress,
          totalAmount,
          status: 'pending'
        })
        .returning();

      // Create order items
      const orderItemsData = validatedItems.map(item => ({
        orderId: newOrder.id,
        productId: item.productId,
        specificationId: item.specificationId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        productSnapshot: item.productSnapshot
      }));

      const createdItems = await tx
        .insert(orderItems)
        .values(orderItemsData)
        .returning();

      return {
        order: {
          ...newOrder,
          items: createdItems.map((item, index) => ({
            ...item,
            productSnapshot: validatedItems[index].productSnapshot
          }))
        } as Order
      };
    });
  }

  static async updateOrderStatus(
    orderId: string, 
    status: Order['status'], 
    adminId: string,
    notes?: string
  ): Promise<Order> {
    return await db.transaction(async (tx) => {
      // Get current order
      const [currentOrder] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!currentOrder) {
        throw new Error('Order not found');
      }

      // Update order
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId))
        .returning();

      // Record status change
      await tx.insert(orderStatusHistory).values({
        orderId,
        oldStatus: currentOrder.status,
        newStatus: status,
        changedBy: adminId,
        notes
      });

      return updatedOrder as Order;
    });
  }
}
```


### 3.3 WhatsApp Integration Service

```typescript
// src/services/whatsapp.service.ts
import type { Order } from '../types/api';

export class WhatsAppService {
  private static readonly BUSINESS_PHONE = process.env.WHATSAPP_BUSINESS_PHONE || '1234567890';
  
  static generateOrderMessage(order: Order): { url: string; message: string } {
    const message = this.formatOrderMessage(order);
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${this.BUSINESS_PHONE}?text=${encodedMessage}`;

    return { url, message };
  }

  static generateStatusMessage(order: Order, customMessage?: string): { url: string; message: string } {
    const message = customMessage || this.formatStatusMessage(order);
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${order.customerPhone}?text=${encodedMessage}`;

    return { url, message };
  }

  private static formatOrderMessage(order: Order): string {
    const items = order.items.map(item => 
      `• ${item.productSnapshot.name} (${this.getSpecificationName(item)}) × ${item.quantity} - $${item.totalPrice.toFixed(2)}`
    ).join('\n');

    return `🛍️ *New Jewelry Order*

*Order #:* ${order.orderNumber}
*Date:* ${new Date(order.createdAt).toLocaleDateString()}

*Customer Details:*
Name: ${order.customerName}
Email: ${order.customerEmail}
Phone: ${order.customerPhone}
Address: ${order.customerAddress}

*Items Ordered:*
${items}

*Total Amount: $${order.totalAmount.toFixed(2)}*

Thank you for your order! We'll send you the payment QR code shortly.`;
  }

  private static formatStatusMessage(order: Order): string {
    const statusMessages = {
      pending: '⏳ Your order has been received and is being reviewed.',
      confirmed: '✅ Your order has been confirmed! We\'re preparing your jewelry.',
      processing: '🔨 Your jewelry is being crafted with care.',
      shipped: '📦 Your order has been shipped! You\'ll receive tracking details soon.',
      delivered: '🎉 Your order has been delivered! We hope you love your new jewelry.',
      cancelled: '❌ Your order has been cancelled. Please contact us if you have questions.'
    };

    return `*Order Update - #${order.orderNumber}*

Hi ${order.customerName}!

${statusMessages[order.status]}

*Order Details:*
${order.items.map(item => 
  `• ${item.productSnapshot.name} × ${item.quantity}`
).join('\n')}

*Total: $${order.totalAmount.toFixed(2)}*

Need help? Just reply to this message! 💎`;
  }

  private static getSpecificationName(item: any): string {
    // This would need to be enhanced based on your specification structure
    return 'Specification'; // Placeholder
  }
}
```


## 4. Security Implementation

### 4.1 Authentication \& Authorization

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verify } from 'jose';
import { db } from '../db/connection';
import { admins } from '../db/schema';
import { eq } from 'drizzle-orm';

interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateAdmin = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    
    const { payload } = await verify(token, secret);
    
    // Verify admin still exists and is active
    const [admin] = await db
      .select({
        id: admins.id,
        email: admins.email,
        role: admins.role
      })
      .from(admins)
      .where(eq(admins.id, payload.sub as string))
      .limit(1);

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Rate limiting
import rateLimit from 'express-rate-limit';

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many login attempts, please try again later'
  }
});

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please slow down'
  }
});
```


### 4.2 Input Validation \& Sanitization

```typescript
// src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize inputs
      req.body = sanitizeObject(req.body);
      req.query = sanitizeObject(req.query);
      req.params = sanitizeObject(req.params);

      // Validate with Zod
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });

      // Replace request data with validated data
      req.body = validated.body || {};
      req.query = validated.query || {};
      req.params = validated.params || {};

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      }
      next(error);
    }
  };
};

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// Common validation schemas
export const ProductValidation = {
  create: z.object({
    body: z.object({
      name: z.string().min(2).max(200),
      charmDescription: z.string().min(10).max(1000),
      chainDescription: z.string().min(10).max(1000),
      productTypeId: z.string().uuid(),
      basePrice: z.number().positive(),
      sku: z.string().optional(),
      images: z.array(z.string().url()).optional(),
      stockAlertThreshold: z.number().int().positive().optional()
    })
  })
};
```


## 5. Error Handling Strategy

### 5.1 Custom Error Classes

```typescript
// src/utils/errors.ts
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class InsufficientStockError extends AppError {
  constructor(productName: string, available: number) {
    super(
      `Insufficient stock for ${productName}. Only ${available} items available.`,
      409,
      'INSUFFICIENT_STOCK'
    );
  }
}
```


### 5.2 Global Error Handler

```typescript
// src/middleware/error-handler.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details: any = null;

  // Log error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle known errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
    details = (error as any).details;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
    details = error.message;
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  } else if (error.code === '23505') { // PostgreSQL unique violation
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_RESOURCE';
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(details && { details }),
    ...(isDevelopment && { stack: error.stack })
  });
};

// Async wrapper to catch async errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```


## 6. Data Flow Implementation

### 6.1 OpenTelemetry Integration

```typescript
// src/utils/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'jewelry-inventory-api',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter: jaegerExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

export const initializeTracing = () => {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_TRACING === 'true') {
    sdk.start();
    console.log('OpenTelemetry started successfully');
  }
};

// Custom tracing utilities
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('jewelry-inventory', '1.0.0');

export const createSpan = (name: string, fn: Function) => {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      span.end();
    }
  });
};
```


### 6.2 Caching Strategy

```typescript
// src/utils/cache.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds: number = 300): Promise<boolean> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  static async del(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }

  // Product-specific cache methods
  static getProductCacheKey(productId?: string, filters?: any): string {
    if (productId) {
      return `product:${productId}`;
    }
    const filterHash = filters ? Buffer.from(JSON.stringify(filters)).toString('base64') : 'all';
    return `products:${filterHash}`;
  }

  static async cacheProduct(product: any, ttl: number = 600): Promise<void> {
    await this.set(this.getProductCacheKey(product.id), product, ttl);
  }

  static async getCachedProduct(productId: string) {
    return await this.get(this.getProductCacheKey(productId));
  }

  static async invalidateProductCache(productId?: string): Promise<void> {
    if (productId) {
      await this.del(this.getProductCacheKey(productId));
      await this.invalidatePattern('products:*'); // Invalidate product listings
    } else {
      await this.invalidatePattern('product:*');
      await this.invalidatePattern('products:*');
    }
  }
}
```


## 7. Code Structure \& Patterns

### 7.1 Project Structure

```
src/
├── controllers/          # Request handlers
│   ├── admin/
│   │   ├── auth.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── orders.controller.ts
│   │   └── products.controller.ts
│   └── customer/
│       ├── orders.controller.ts
│       └── products.controller.ts
├── services/             # Business logic
│   ├── admin.service.ts
│   ├── order.service.ts
│   ├── product.service.ts
│   └── whatsapp.service.ts
├── db/                   # Database layer
│   ├── connection.ts
│   ├── migrations/
│   └── schema.ts
├── middleware/           # Express middleware
│   ├── auth.middleware.ts
│   ├── error-handler.middleware.ts
│   ├── rate-limit.middleware.ts
│   └── validation.middleware.ts
├── routes/               # API routes
│   ├── admin.routes.ts
│   └── public.routes.ts
├── types/                # TypeScript definitions
│   ├── api.ts
│   ├── database.ts
│   └── common.ts
├── utils/                # Utility functions
│   ├── cache.ts
│   ├── constants.ts
│   ├── errors.ts
│   ├── format.ts
│   ├── logger.ts
│   ├── order-utils.ts
│   ├── tracing.ts
│   └── validation.ts
├── config/               # Configuration
│   ├── database.ts
│   ├── redis.ts
│   └── app.ts
└── app.ts               # Application entry point
```


### 7.2 Configuration Management

```typescript
// src/config/app.ts
import { z } from 'zod';

const ConfigSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val)).default('3000'),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRATION: z.string().default('24h'),
  
  // Redis (optional)
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().transform(val => parseInt(val)).optional(),
  REDIS_PASSWORD: z.string().optional(),
  
  // WhatsApp
  WHATSAPP_BUSINESS_PHONE: z.string(),
  
  // File Upload
  MAX_FILE_SIZE: z.string().transform(val => parseInt(val)).default('5242880'), // 5MB
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/webp'),
  
  // External APIs
  IMGUR_CLIENT_ID: z.string().optional(),
  
  // Monitoring
  ENABLE_TRACING: z.string().transform(val => val === 'true').default('false'),
  JAEGER_ENDPOINT: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val)).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(val => parseInt(val)).default('100'),
});

export type Config = z.infer<typeof ConfigSchema>;

export const config: Config = ConfigSchema.parse(process.env);

// Validate critical configuration
export const validateConfig = () => {
  try {
    ConfigSchema.parse(process.env);
    console.log('✅ Configuration validated successfully');
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    process.exit(1);
  }
};
```


### 7.3 Application Bootstrap

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config, validateConfig } from './config/app';
import { initializeTracing } from './utils/tracing';
import { connectDatabase } from './db/connection';
import { errorHandler } from './middleware/error-handler.middleware';
import { apiRateLimit } from './middleware/auth.middleware';
import adminRoutes from './routes/admin.routes';
import publicRoutes from './routes/public.routes';

// Initialize tracing before importing other modules
initializeTracing();

class Application {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.validateConfiguration();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private validateConfiguration(): void {
    validateConfig();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:", "http:"],
          connectSrc: ["'self'", "https://api.imgur.com"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.NODE_ENV === 'production' 
        ? ['https://your-domain.vercel.app'] 
        : true,
      credentials: true,
      optionsSuccessStatus: 200
    }));

    // General middleware
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.app.use('/api', apiRateLimit);

    // Request logging in development
    if (config.NODE_ENV === 'development') {
      this.app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`, {
          body: req.body,
          query: req.query,
          params: req.params
        });
        next();
      });
    }
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API routes
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api', publicRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();
      
      // Start server
      this.app.listen(config.PORT, () => {
        console.log(`🚀 Server running on port ${config.PORT}`);
        console.log(`📊 Environment: ${config.NODE_ENV}`);
        console.log(`🔧 Tracing: ${config.ENABLE_TRACING ? 'enabled' : 'disabled'}`);
      });
    } catch (error) {
      console.error('Failed to start application:', error);
      process.exit(1);
    }
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start application
const application = new Application();
application.start();

export default application.app;
```


## 8. Testing Strategy

### 8.1 Test Structure \& Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

```typescript
// tests/setup.ts
import { beforeAll, afterAll, afterEach } from 'vitest';
import { connectTestDatabase, closeTestDatabase, cleanupTestDatabase } from './helpers/database';

beforeAll(async () => {
  await connectTestDatabase();
});

afterEach(async () => {
  await cleanupTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});

// Mock WhatsApp service for tests
vi.mock('@/services/whatsapp.service', () => ({
  WhatsAppService: {
    generateOrderMessage: vi.fn().mockReturnValue({
      url: 'https://wa.me/1234567890?text=test',
      message: 'test message'
    }),
    generateStatusMessage: vi.fn().mockReturnValue({
      url: 'https://wa.me/1234567890?text=status',
      message: 'status message'
    })
  }
}));
```


### 8.2 Unit Tests

```typescript
// tests/services/product.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ProductService } from '@/services/product.service';
import { createTestProduct, createTestProductType } from '../helpers/factories';

describe('ProductService', () => {
  beforeEach(async () => {
    // Setup test data
    await createTestProductType({
      name: 'chain',
      displayName: 'Chain',
      specificationType: 'layer'
    });
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      // Arrange
      await createTestProduct({
        name: 'Test Chain',
        charmDescription: 'Beautiful charm',
        chainDescription: 'Sterling silver chain',
        basePrice: 50.00
      });

      // Act
      const result = await ProductService.getProducts({
        page: 1,
        limit: 10
      });

      // Assert
      expect(result.products).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBe(1);
      expect(result.products[0].name).toBe('Test Chain');
    });

    it('should filter products by type', async () => {
      // Arrange
      const chainType = await createTestProductType({
        name: 'chain',
        displayName: 'Chain',
        specificationType: 'layer'
      });
      
      const braceletType = await createTestProductType({
        name: 'bracelet',
        displayName: 'Bracelet',
        specificationType: 'size'
      });

      await createTestProduct({ productTypeId: chainType.id, name: 'Chain Product' });
      await createTestProduct({ productTypeId: braceletType.id, name: 'Bracelet Product' });

      // Act
      const result = await ProductService.getProducts({
        page: 1,
        limit: 10,
        filters: { type: 'chain' }
      });

      // Assert
      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('Chain Product');
    });

    it('should handle search functionality', async () => {
      // Arrange
      await createTestProduct({
        name: 'Butterfly Chain',
        charmDescription: 'Delicate butterfly charm'
      });
      
      await createTestProduct({
        name: 'Heart Bracelet',
        charmDescription: 'Heart shaped charm'
      });

      // Act
      const result = await ProductService.getProducts({
        page: 1,
        limit: 10,
        filters: { search: 'butterfly' }
      });

      // Assert
      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('Butterfly Chain');
    });
  });

  describe('getProductById', () => {
    it('should return product with specifications', async () => {
      // Arrange
      const product = await createTestProduct();
      
      // Act
      const result = await ProductService.getProductById(product.id);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(product.id);
      expect(result?.specifications).toBeDefined();
    });

    it('should return null for non-existent product', async () => {
      // Act
      const result = await ProductService.getProductById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });
});
```


### 8.3 Integration Tests

```typescript
// tests/controllers/orders.controller.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '@/app';
import { createTestProduct, createTestSpecification } from '../helpers/factories';

describe('Orders Controller', () => {
  describe('POST /api/orders', () => {
    it('should create order successfully', async () => {
      // Arrange
      const product = await createTestProduct();
      const specification = await createTestSpecification({
        productId: product.id,
        specType: 'layer',
        specValue: 'single',
        stockQuantity: 10
      });

      const orderData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+1234567890',
        customerAddress: '123 Main St, City, State',
        items: [{
          productId: product.id,
          specificationId: specification.id,
          quantity: 2
        }]
      };

      // Act
      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.order).toBeDefined();
      expect(response.body.data.order.customerName).toBe('John Doe');
      expect(response.body.data.order.items).toHaveLength(1);
      expect(response.body.data.whatsappUrl).toContain('wa.me');
    });

    it('should fail with insufficient stock', async () => {
      // Arrange
      const product = await createTestProduct();
      const specification = await createTestSpecification({
        productId: product.id,
        stockQuantity: 1
      });

      const orderData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+1234567890',
        customerAddress: '123 Main St',
        items: [{
          productId: product.id,
          specificationId: specification.id,
          quantity: 5 // More than available stock
        }]
      };

      // Act
      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(409);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient stock');
    });

    it('should validate required fields', async () => {
      // Act
      const response = await request(app)
        .post('/api/orders')
        .send({})
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });
});
```


### 8.4 E2E Tests with Playwright

```typescript
// tests/e2e/customer-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Customer Order Flow', () => {
  test('should complete full order process', async ({ page }) => {
    // Navigate to products page
    await page.goto('/');
    
    // Browse products
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
    
    // Select a product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    
    // Select specification
    await page.selectOption('[data-testid="specification-select"]', { index: 1 });
    
    // Add to cart
    await page.click('[data-testid="add-to-cart"]');
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
    
    // Go to cart
    await page.click('[data-testid="cart-button"]');
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
    
    // Proceed to checkout
    await page.click('[data-testid="checkout-button"]');
    
    // Fill customer details
    await page.fill('[data-testid="customer-name"]', 'John Doe');
    await page.fill('[data-testid="customer-email"]', 'john@example.com');
    await page.fill('[data-testid="customer-phone"]', '+1234567890');
    await page.fill('[data-testid="customer-address"]', '123 Main St, City, State');
    
    // Submit order
    await page.click('[data-testid="submit-order"]');
    
    // Verify WhatsApp redirect
    await expect(page.locator('[data-testid="whatsapp-redirect"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-success-message"]')).toBeVisible();
  });

  test('should handle mobile viewport correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check mobile-specific elements
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });
});
```


## 9. Performance Optimization

### 9.1 Database Optimization

```typescript
// src/utils/database-optimization.ts
import { db } from '@/db/connection';

export class DatabaseOptimizer {
  static async analyzeQuery(query: string): Promise<any> {
    if (process.env.NODE_ENV === 'development') {
      const result = await db.execute(`EXPLAIN ANALYZE ${query}`);
      console.log('Query Analysis:', result);
      return result;
    }
  }

  static async createOptimizedIndexes(): Promise<void> {
    const indexes = [
      // Composite indexes for common queries
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_type_price ON products(product_type_id, base_price) WHERE is_active = true',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_created_active ON products(created_at DESC, is_active) WHERE is_active = true',
      
      // Specification queries
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_specs_product_available ON product_specifications(product_id, is_available) WHERE is_available = true',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_specs_stock ON product_specifications(stock_quantity) WHERE stock_quantity > 0',
      
      // Order analytics
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_date ON orders(status, created_at) WHERE status IN (\'confirmed\', \'delivered\')',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_analytics ON order_items(created_at, product_id)',
      
      // Search optimization
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search_gin ON products USING gin(search_vector)'
    ];

    for (const index of indexes) {
      try {
        await db.execute(index);
        console.log(`✅ Index created: ${index.split(' ON ')[1]?.split('(')[0]}`);
      } catch (error) {
        console.warn(`⚠️  Index creation skipped (may already exist): ${error}`);
      }
    }
  }
}

// Connection pool optimization
export const optimizeConnectionPool = () => {
  return {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: process.env.NODE_ENV === 'production',
    max: parseInt(process.env.DB_POOL_MAX || '10'), // Maximum pool size
    min: parseInt(process.env.DB_POOL_MIN || '2'),  // Minimum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    acquireTimeoutMillis: 60000,
  };
};
```


### 9.2 API Response Optimization

```typescript
// src/middleware/compression.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { CacheService } from '@/utils/cache';

export const smartCaching = (ttlSeconds: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `api:${req.path}:${JSON.stringify(req.query)}`;
    
    try {
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          CacheService.set(cacheKey, data, ttlSeconds).catch(console.error);
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Response optimization
export const optimizeResponse = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Enable compression
    res.set('Content-Encoding', 'gzip');
    
    // Set cache headers for static content
    if (req.path.includes('/api/products') && req.method === 'GET') {
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    }
    
    // Set security headers
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    
    next();
  };
};
```


### 9.3 Image Optimization

```typescript
// src/services/image-optimization.service.ts
import sharp from 'sharp';

export class ImageOptimizationService {
  static async optimizeForWeb(imageBuffer: Buffer): Promise<{
    webp: Buffer;
    jpeg: Buffer;
    thumbnail: Buffer;
  }> {
    const [webp, jpeg, thumbnail] = await Promise.all([
      // WebP version for modern browsers
      sharp(imageBuffer)
        .webp({ quality: 85 })
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .toBuffer(),
      
      // JPEG fallback
      sharp(imageBuffer)
        .jpeg({ quality: 85, progressive: true })
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .toBuffer(),
      
      // Thumbnail
      sharp(imageBuffer)
        .jpeg({ quality: 70 })
        .resize(200, 200, { fit: 'cover' })
        .toBuffer()
    ]);

    return { webp, jpeg, thumbnail };
  }

  static async uploadOptimizedImages(originalBuffer: Buffer): Promise<{
    original: string;
    webp: string;
    thumbnail: string;
  }> {
    const optimized = await this.optimizeForWeb(originalBuffer);
    
    // Upload to Imgur (or your preferred service)
    const [originalUrl, webpUrl, thumbnailUrl] = await Promise.all([
      this.uploadToImgur(originalBuffer),
      this.uploadToImgur(optimized.webp),
      this.uploadToImgur(optimized.thumbnail)
    ]);

    return {
      original: originalUrl,
      webp: webpUrl,
      thumbnail: thumbnailUrl
    };
  }

  private static async uploadToImgur(buffer: Buffer): Promise<string> {
    // Implementation depends on your image storage solution
    // This is a simplified example
    const formData = new FormData();
    formData.append('image', buffer.toString('base64'));
    
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
      },
      body: formData
    });

    const data = await response.json();
    return data.data.link;
  }
}
```


## 10. Configuration Management

### 10.1 Environment-Specific Configurations

```typescript
// src/config/environments.ts
import { Config } from './app';

type Environment = 'development' | 'production' | 'test';

interface EnvironmentConfig {
  database: {
    ssl: boolean;
    pool: {
      min: number;
      max: number;
    };
  };
  cache: {
    enabled: boolean;
    defaultTtl: number;
  };
  logging: {
    level: string;
    format: string;
  };
  performance: {
    enableTracing: boolean;
    enableProfiling: boolean;
  };
}

const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    database: {
      ssl: false,
      pool: { min: 2, max: 5 }
    },
    cache: {
      enabled: false,
      defaultTtl: 60
    },
    logging: {
      level: 'debug',
      format: 'pretty'
    },
    performance: {
      enableTracing: true,
      enableProfiling: false
    }
  },
  
  production: {
    database: {
      ssl: true,
      pool: { min: 5, max: 20 }
    },
    cache: {
      enabled: true,
      defaultTtl: 300
    },
    logging: {
      level: 'info',
      format: 'json'
    },
    performance: {
      enableTracing: true,
      enableProfiling: true
    }
  },
  
  test: {
    database: {
      ssl: false,
      pool: { min: 1, max: 3 }
    },
    cache: {
      enabled: false,
      defaultTtl: 1
    },
    logging: {
      level: 'error',
      format: 'simple'
    },
    performance: {
      enableTracing: false,
      enableProfiling: false
    }
  }
};

export const getEnvironmentConfig = (env: Environment): EnvironmentConfig => {
  return environments[env];
};
```


### 10.2 Feature Flags

```typescript
// src/utils/feature-flags.ts
interface FeatureFlags {
  whatsappIntegration: boolean;
  advancedAnalytics: boolean;
  realTimeInventory: boolean;
  imageOptimization: boolean;
  pushNotifications: boolean;
}

class FeatureFlagService {
  private flags: FeatureFlags;

  constructor() {
    this.flags = {
      whatsappIntegration: process.env.FEATURE_WHATSAPP === 'true',
      advancedAnalytics: process.env.FEATURE_ANALYTICS === 'true',
      realTimeInventory: process.env.FEATURE_REALTIME_INVENTORY === 'true',
      imageOptimization: process.env.FEATURE_IMAGE_OPTIMIZATION === 'true',
      pushNotifications: process.env.FEATURE_PUSH_NOTIFICATIONS === 'true',
    };
  }

  isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature] || false;
  }

  updateFlag(feature: keyof FeatureFlags, enabled: boolean): void {
    this.flags[feature] = enabled;
  }

  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }
}

export const featureFlags = new FeatureFlagService();

// Middleware to expose feature flags to frontend
export const exposeFeatureFlags = (req: Request, res: Response, next: NextFunction) => {
  res.locals.featureFlags = featureFlags.getAllFlags();
  next();
};
```


### 10.3 Deployment Configuration

```yaml
# docker-compose.yml (for local development)
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@db:5432/jewelry_inventory
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - db
      - redis
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=jewelry_inventory
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      - COLLECTOR_OTLP_ENABLED=true

volumes:
  postgres_data:
  redis_data:
```

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

EXPOSE 3000

USER node

CMD ["npm", "start"]
```


## Conclusion

This Low Level Design document provides comprehensive technical specifications for implementing the Jewelry Inventory Management Application. The design emphasizes:

1. **Type Safety**: Full TypeScript implementation with strict typing
2. **Modern Standards**: Latest Node.js 20 LTS with current best practices
3. **Scalability**: Caching, database optimization, and horizontal scaling considerations
4. **Observability**: OpenTelemetry integration for monitoring and debugging
5. **Security**: Comprehensive input validation, authentication, and rate limiting
6. **Testing**: Complete testing strategy with unit, integration, and E2E tests
7. **Performance**: Image optimization, response caching, and database indexing
8. **Maintainability**: Clear code structure, error handling, and configuration management

The implementation follows industry best practices while maintaining the specific requirements for jewelry product management and WhatsApp integration. The architecture supports both immediate development needs and future scaling requirements.

**Implementation Priority:**

1. Core API and database implementation
2. Authentication and security layers
3. Product management and order processing
4. WhatsApp integration
5. Admin dashboard and analytics
6. Performance optimization and monitoring
7. Testing suite completion
8. Production deployment and monitoring setup
