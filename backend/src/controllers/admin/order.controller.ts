import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '@/db/connection.js';
import { orders, orderItems, products, productSpecifications } from '@/db/schema.js';
import { eq, desc, and, like, or, gte, lte, count } from 'drizzle-orm';
import { asyncHandler } from '@/middleware/error-handler.middleware.js';

// Validation schemas
const CreateOrderSchema = z.object({
  body: z.object({
    customerName: z.string().min(1, 'Customer name is required'),
    customerEmail: z.string().email('Valid email is required'),
    customerPhone: z.string().min(1, 'Phone number is required'),
    customerAddress: z.string().min(1, 'Address is required'),
    items: z.array(z.object({
      productId: z.string().uuid(),
      specificationId: z.string().uuid(),
      quantity: z.number().positive()
    })).min(1, 'At least one item is required'),
    notes: z.string().optional()
  })
});

const UpdateOrderSchema = z.object({
  body: z.object({
    customerName: z.string().optional(),
    customerEmail: z.string().email().optional(),
    customerPhone: z.string().optional(),
    customerAddress: z.string().optional(),
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
    whatsappMessageSent: z.boolean().optional(),
    paymentReceived: z.boolean().optional(),
    notes: z.string().optional()
  }),
  params: z.object({
    id: z.string().uuid('Valid order ID is required')
  })
});

/**
 * Get all orders with filters
 * GET /api/admin/orders
 */
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    status,
    page = 1,
    limit = 10,
    dateFrom,
    dateTo
  } = req.query;

  let query = db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      customerPhone: orders.customerPhone,
      customerAddress: orders.customerAddress,
      totalAmount: orders.totalAmount,
      status: orders.status,
      whatsappMessageSent: orders.whatsappMessageSent,
      paymentReceived: orders.paymentReceived,
      notes: orders.notes,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt
    })
    .from(orders)
    .orderBy(desc(orders.createdAt));

  // Apply filters
  const conditions = [];

  if (search && typeof search === 'string') {
    conditions.push(
      or(
        like(orders.orderNumber, `%${search}%`),
        like(orders.customerName, `%${search}%`),
        like(orders.customerEmail, `%${search}%`)
      )
    );
  }

  if (status && status !== 'All' && typeof status === 'string') {
    conditions.push(eq(orders.status, status));
  }

  if (dateFrom && typeof dateFrom === 'string') {
    conditions.push(gte(orders.createdAt, new Date(dateFrom)));
  }

  if (dateTo && typeof dateTo === 'string') {
    conditions.push(lte(orders.createdAt, new Date(dateTo)));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // Pagination
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  const result = await query.limit(limitNum).offset(offset);

  // Get total count for pagination
  const totalCountResult = await db
    .select({ count: count() })
    .from(orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const totalCount = totalCountResult[0]?.count || 0;

  res.json({
    success: true,
    data: {
      orders: result,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    },
    message: `Found ${result.length} orders`
  });
});

/**
 * Get order by ID
 * GET /api/admin/orders/:id
 */
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Order ID is required'
    });
  }

  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!order.length) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  // Get order items with product details
  const items = await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice,
      productSnapshot: orderItems.productSnapshot,
      product: {
        id: products.id,
        name: products.name,
        charmDescription: products.charmDescription,
        chainDescription: products.chainDescription
      },
      specification: {
        id: productSpecifications.id,
        specType: productSpecifications.specType,
        specValue: productSpecifications.specValue,
        displayName: productSpecifications.displayName
      }
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(productSpecifications, eq(orderItems.specificationId, productSpecifications.id))
    .where(eq(orderItems.orderId, id));

  res.json({
    success: true,
    data: {
      ...order[0],
      items
    },
    message: 'Order retrieved successfully'
  });
});

/**
 * Create new order
 * POST /api/admin/orders
 */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { body } = CreateOrderSchema.parse({ body: req.body });

  // Generate order number
  const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;

  // Calculate total amount
  let totalAmount = 0;
  const orderItemsData = [];

  for (const item of body.items) {
    // Get product and specification details
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);

    const specification = await db
      .select()
      .from(productSpecifications)
      .where(eq(productSpecifications.id, item.specificationId))
      .limit(1);

    if (!product.length || !specification.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product or specification'
      });
    }

    const unitPrice = parseFloat(product[0].basePrice) + parseFloat(specification[0].priceModifier);
    const itemTotal = unitPrice * item.quantity;
    totalAmount += itemTotal;

    orderItemsData.push({
      productId: item.productId,
      specificationId: item.specificationId,
      quantity: item.quantity,
      unitPrice: unitPrice.toString(),
      productSnapshot: {
        product: product[0],
        specification: specification[0]
      }
    });
  }

  // Create order
  const newOrder = await db
    .insert(orders)
    .values({
      orderNumber,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      totalAmount: totalAmount.toString(),
      notes: body.notes || null
    })
    .returning();

  // Create order items
  const orderItemsWithOrderId = orderItemsData.map(item => ({
    ...item,
    orderId: newOrder[0].id
  }));

  await db.insert(orderItems).values(orderItemsWithOrderId);

  res.status(201).json({
    success: true,
    data: newOrder[0],
    message: 'Order created successfully'
  });
});

/**
 * Update order
 * PUT /api/admin/orders/:id
 */
export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  const { body, params } = UpdateOrderSchema.parse({ body: req.body, params: req.params });

  const existingOrder = await db
    .select()
    .from(orders)
    .where(eq(orders.id, params.id))
    .limit(1);

  if (!existingOrder.length) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  // Filter out undefined values
  const updateData: any = {
    updatedAt: new Date()
  };

  if (body.customerName !== undefined) updateData.customerName = body.customerName;
  if (body.customerEmail !== undefined) updateData.customerEmail = body.customerEmail;
  if (body.customerPhone !== undefined) updateData.customerPhone = body.customerPhone;
  if (body.customerAddress !== undefined) updateData.customerAddress = body.customerAddress;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.whatsappMessageSent !== undefined) updateData.whatsappMessageSent = body.whatsappMessageSent;
  if (body.paymentReceived !== undefined) updateData.paymentReceived = body.paymentReceived;
  if (body.notes !== undefined) updateData.notes = body.notes;

  const updatedOrder = await db
    .update(orders)
    .set(updateData)
    .where(eq(orders.id, params.id))
    .returning();

  res.json({
    success: true,
    data: updatedOrder[0],
    message: 'Order updated successfully'
  });
});

/**
 * Delete order
 * DELETE /api/admin/orders/:id
 */
export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Order ID is required'
    });
  }

  const existingOrder = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!existingOrder.length) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  // Delete order (cascade will handle order items)
  await db.delete(orders).where(eq(orders.id, id));

  res.json({
    success: true,
    message: 'Order deleted successfully'
  });
});

/**
 * Get order statistics
 * GET /api/admin/orders/stats
 */
export const getOrderStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await db
    .select({
      status: orders.status,
      totalAmount: orders.totalAmount
    })
    .from(orders);

  const statusCounts = stats.reduce((acc: any, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const totalRevenue = stats.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  res.json({
    success: true,
    data: {
      statusCounts,
      totalRevenue,
      totalOrders: stats.length
    },
    message: 'Order statistics retrieved successfully'
  });
});

/**
 * Export orders
 * GET /api/admin/orders/export
 */
export const exportOrders = asyncHandler(async (req: Request, res: Response) => {
  const { format = 'csv', dateFrom, dateTo } = req.query;

  let query = db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt));

  // Apply date filters
  const conditions = [];
  if (dateFrom && typeof dateFrom === 'string') {
    conditions.push(gte(orders.createdAt, new Date(dateFrom)));
  }
  if (dateTo && typeof dateTo === 'string') {
    conditions.push(lte(orders.createdAt, new Date(dateTo)));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const ordersData = await query;

  if (format === 'csv') {
    const csvData = [
      ['Order Number', 'Customer Name', 'Email', 'Phone', 'Amount', 'Status', 'Date'].join(','),
      ...ordersData.map(order => [
        order.orderNumber,
        `"${order.customerName}"`,
        order.customerEmail,
        order.customerPhone,
        order.totalAmount,
        order.status,
        order.createdAt.toISOString().split('T')[0]
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvData);
  } else {
    res.json({
      success: true,
      data: ordersData,
      message: 'Orders exported successfully'
    });
  }
}); 
