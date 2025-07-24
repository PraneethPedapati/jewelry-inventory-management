import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '@/db/connection.js';
import { orders, orderItems, products, productSpecifications } from '@/db/schema.js';
import { eq, desc, and, like, or, gte, lte, count } from 'drizzle-orm';
import { asyncHandler } from '@/middleware/error-handler.middleware.js';
import { WhatsAppService } from '@/services/whatsapp.service.js';

// Validation schemas
const CreateOrderSchema = z.object({
  body: z.object({
    customerName: z.string().min(1, 'Customer name is required'),
    customerEmail: z.string().email('Valid email is required'),
    customerPhone: z.string().min(1, 'Phone number is required'),
    customerAddress: z.string().min(1, 'Address is required'),
    items: z.array(z.object({
      productId: z.string().min(1, 'Product ID is required'),
      specificationId: z.string().min(1, 'Specification ID is required'),
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

// New validation schemas for hybrid flow
const ApproveOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid order ID is required')
  }),
  body: z.object({
    upiId: z.string().optional().default('yourstore@paytm'),
    sendPaymentQR: z.boolean().optional().default(true),
    customMessage: z.string().optional()
  })
});

const SendPaymentQRSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid order ID is required')
  }),
  body: z.object({
    upiId: z.string().optional().default('yourstore@paytm'),
    customMessage: z.string().optional()
  })
});

const ConfirmPaymentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid order ID is required')
  }),
  body: z.object({
    paymentReference: z.string().optional(),
    notes: z.string().optional()
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

  // Build query with proper structure
  const baseQuery = db
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
    .from(orders);

  const query = conditions.length > 0
    ? baseQuery.where(and(...conditions)).orderBy(desc(orders.createdAt))
    : baseQuery.orderBy(desc(orders.createdAt));

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
      console.error(`Product lookup failed - ProductID: ${item.productId}, SpecificationID: ${item.specificationId}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid product or specification. Please ensure you are using valid product and specification IDs from the database.'
      });
    }

    const productData = product[0];
    const specData = specification[0];

    if (!productData || !specData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product or specification data'
      });
    }

    const basePrice = productData.basePrice ? parseFloat(productData.basePrice) : 0;
    const priceModifier = specData.priceModifier ? parseFloat(specData.priceModifier) : 0;
    const unitPrice = basePrice + priceModifier;
    const itemTotal = unitPrice * item.quantity;
    totalAmount += itemTotal;

    orderItemsData.push({
      productId: item.productId,
      specificationId: item.specificationId,
      quantity: item.quantity,
      unitPrice: unitPrice.toString(),
      productSnapshot: {
        product: productData,
        specification: specData
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

  if (!newOrder.length || !newOrder[0]) {
    return res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }

  const createdOrder = newOrder[0];

  // Create order items
  const orderItemsWithOrderId = orderItemsData.map(item => ({
    ...item,
    orderId: createdOrder.id
  }));

  await db.insert(orderItems).values(orderItemsWithOrderId);

  res.status(201).json({
    success: true,
    data: createdOrder,
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

  if (!updatedOrder.length || !updatedOrder[0]) {
    return res.status(500).json({
      success: false,
      error: 'Failed to update order'
    });
  }

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
    const status = order.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
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

  // Apply date filters
  const conditions = [];
  if (dateFrom && typeof dateFrom === 'string') {
    conditions.push(gte(orders.createdAt, new Date(dateFrom)));
  }
  if (dateTo && typeof dateTo === 'string') {
    conditions.push(lte(orders.createdAt, new Date(dateTo)));
  }

  const baseQuery = db
    .select()
    .from(orders);

  const query = conditions.length > 0
    ? baseQuery.where(and(...conditions)).orderBy(desc(orders.createdAt))
    : baseQuery.orderBy(desc(orders.createdAt));

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
        order.createdAt ? order.createdAt.toISOString().split('T')[0] : 'N/A'
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

/**
 * Approve order and optionally send payment QR
 * POST /api/admin/orders/:id/approve
 */
export const approveOrder = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = ApproveOrderSchema.parse({ params: req.params, body: req.body });

  // Get order with items
  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, params.id))
    .limit(1);

  if (!order.length) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  const currentOrder = order[0];
  if (!currentOrder) {
    return res.status(404).json({
      success: false,
      error: 'Order data not found'
    });
  }

  if (currentOrder.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: `Order is already ${currentOrder.status}. Can only approve pending orders.`
    });
  }

  // Get order items
  const items = await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice,
      productSnapshot: orderItems.productSnapshot
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, params.id));

  const completeOrder = {
    id: currentOrder.id,
    orderNumber: currentOrder.orderNumber || '',
    customerName: currentOrder.customerName || '',
    customerEmail: currentOrder.customerEmail || '',
    customerPhone: currentOrder.customerPhone || '',
    customerAddress: currentOrder.customerAddress || '',
    totalAmount: parseFloat(currentOrder.totalAmount),
    status: (currentOrder.status as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled') || 'pending',
    whatsappMessageSent: currentOrder.whatsappMessageSent || false,
    paymentReceived: currentOrder.paymentReceived || false,
    notes: currentOrder.notes || '',
    createdAt: currentOrder.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: currentOrder.updatedAt?.toISOString() || new Date().toISOString(),
    items: items.map(item => ({
      ...item,
      unitPrice: parseFloat(item.unitPrice),
      totalPrice: parseFloat(item.totalPrice || '0'),
      productSnapshot: item.productSnapshot as any
    }))
  };

  // Update order status to confirmed
  await db
    .update(orders)
    .set({
      status: 'confirmed',
      updatedAt: new Date(),
      notes: `${currentOrder.notes || ''}\nOrder approved by admin.`
    })
    .where(eq(orders.id, params.id));

  let paymentQR = '';
  let whatsappUrl = '';
  let message = 'Order approved successfully';

  if (body.sendPaymentQR) {
    try {
      // Generate payment QR
      paymentQR = WhatsAppService.generatePaymentQR(completeOrder as any, body.upiId);

      // Generate approval message with payment QR
      const approvalMessage = body.customMessage ||
        WhatsAppService.generateOrderApprovalMessage(completeOrder as any, paymentQR);

      // Create WhatsApp URL for sending to customer
      const encodedMessage = encodeURIComponent(approvalMessage);
      whatsappUrl = `https://wa.me/${completeOrder.customerPhone}?text=${encodedMessage}`;

      message = 'Order approved and payment QR generated successfully';
    } catch (error) {
      console.error('Failed to generate payment QR:', error);
      message = 'Order approved, but failed to generate payment QR';
    }
  }

  res.json({
    success: true,
    data: {
      order: completeOrder,
      paymentQR: paymentQR,
      whatsappUrl: whatsappUrl,
      actions: {
        sendPaymentQR: body.sendPaymentQR,
        paymentPending: true
      }
    },
    message
  });
});

/**
 * Send payment QR to customer
 * POST /api/admin/orders/:id/send-payment-qr
 */
export const sendPaymentQR = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = SendPaymentQRSchema.parse({ params: req.params, body: req.body });

  // Get order
  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, params.id))
    .limit(1);

  if (!order.length) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  const currentOrder = order[0];
  if (!currentOrder) {
    return res.status(404).json({
      success: false,
      error: 'Order data not found'
    });
  }

  if (currentOrder.paymentReceived) {
    return res.status(400).json({
      success: false,
      error: 'Payment already received for this order'
    });
  }

  // Get order items
  const items = await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice,
      productSnapshot: orderItems.productSnapshot
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, params.id));

  const completeOrder = {
    id: currentOrder.id,
    orderNumber: currentOrder.orderNumber || '',
    customerName: currentOrder.customerName || '',
    customerEmail: currentOrder.customerEmail || '',
    customerPhone: currentOrder.customerPhone || '',
    customerAddress: currentOrder.customerAddress || '',
    totalAmount: parseFloat(currentOrder.totalAmount),
    status: currentOrder.status || 'pending',
    whatsappMessageSent: currentOrder.whatsappMessageSent || false,
    paymentReceived: currentOrder.paymentReceived || false,
    notes: currentOrder.notes || '',
    createdAt: currentOrder.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: currentOrder.updatedAt?.toISOString() || new Date().toISOString(),
    items: items.map(item => ({
      ...item,
      unitPrice: parseFloat(item.unitPrice),
      totalPrice: parseFloat(item.totalPrice || '0'),
      productSnapshot: item.productSnapshot as any
    }))
  };

  try {
    // Generate payment request message
    const paymentMessage = body.customMessage ||
      WhatsAppService.generatePaymentRequestMessage(completeOrder as any, body.upiId);

    const paymentQR = WhatsAppService.generatePaymentQR(completeOrder as any, body.upiId);

    // Create WhatsApp URL
    const encodedMessage = encodeURIComponent(paymentMessage);
    const whatsappUrl = `https://wa.me/${completeOrder.customerPhone}?text=${encodedMessage}`;

    res.json({
      success: true,
      data: {
        paymentQR: paymentQR,
        whatsappUrl: whatsappUrl,
        upiId: body.upiId,
        amount: parseFloat(currentOrder.totalAmount),
        orderNumber: currentOrder.orderNumber
      },
      message: 'Payment QR generated successfully'
    });

  } catch (error) {
    console.error('Failed to generate payment QR:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate payment QR'
    });
  }
});

/**
 * Confirm payment received
 * POST /api/admin/orders/:id/confirm-payment
 */
export const confirmPayment = asyncHandler(async (req: Request, res: Response) => {
  const { params, body } = ConfirmPaymentSchema.parse({ params: req.params, body: req.body });

  // Get order
  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, params.id))
    .limit(1);

  if (!order.length) {
    return res.status(404).json({
      success: false,
      error: 'Order not found'
    });
  }

  const currentOrder = order[0];
  if (!currentOrder) {
    return res.status(404).json({
      success: false,
      error: 'Order data not found'
    });
  }

  if (currentOrder.paymentReceived) {
    return res.status(400).json({
      success: false,
      error: 'Payment already confirmed for this order'
    });
  }

  // Get order items
  const items = await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice,
      productSnapshot: orderItems.productSnapshot
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, params.id));

  const completeOrder = {
    id: currentOrder.id,
    orderNumber: currentOrder.orderNumber || '',
    customerName: currentOrder.customerName || '',
    customerEmail: currentOrder.customerEmail || '',
    customerPhone: currentOrder.customerPhone || '',
    customerAddress: currentOrder.customerAddress || '',
    totalAmount: parseFloat(currentOrder.totalAmount),
    status: currentOrder.status || 'pending',
    whatsappMessageSent: currentOrder.whatsappMessageSent || false,
    paymentReceived: currentOrder.paymentReceived || false,
    notes: currentOrder.notes || '',
    createdAt: currentOrder.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: currentOrder.updatedAt?.toISOString() || new Date().toISOString(),
    items: items.map(item => ({
      ...item,
      unitPrice: parseFloat(item.unitPrice),
      totalPrice: parseFloat(item.totalPrice || '0'),
      productSnapshot: item.productSnapshot as any
    }))
  };

  // Update order - mark payment received and status as processing
  const updateNotes = `${currentOrder.notes || ''}\nPayment confirmed by admin.`;
  const updateNotesWithRef = body.paymentReference
    ? `${updateNotes} Reference: ${body.paymentReference}`
    : updateNotes;

  await db
    .update(orders)
    .set({
      paymentReceived: true,
      status: 'processing',
      updatedAt: new Date(),
      notes: updateNotesWithRef
    })
    .where(eq(orders.id, params.id));

  let whatsappUrl = '';
  try {
    // Generate payment confirmation message
    const confirmationMessage = WhatsAppService.generatePaymentConfirmationMessage(completeOrder as any);

    // Create WhatsApp URL for sending confirmation to customer
    const encodedMessage = encodeURIComponent(confirmationMessage);
    whatsappUrl = `https://wa.me/${completeOrder.customerPhone}?text=${encodedMessage}`;

  } catch (error) {
    console.error('Failed to generate confirmation message:', error);
  }

  res.json({
    success: true,
    data: {
      order: {
        ...completeOrder,
        paymentReceived: true,
        status: 'processing'
      },
      whatsappUrl: whatsappUrl,
      paymentReference: body.paymentReference,
      actions: {
        paymentConfirmed: true,
        orderInProduction: true
      }
    },
    message: 'Payment confirmed successfully. Order moved to processing.'
  });
});

/**
 * Send custom WhatsApp message to customer
 * POST /api/admin/orders/:id/send-whatsapp
 */
export const sendWhatsAppMessage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { message, messageType = 'custom' } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Order ID is required'
    });
  }

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Message content is required'
    });
  }

  // Get order
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

  const currentOrder = order[0];
  if (!currentOrder) {
    return res.status(404).json({
      success: false,
      error: 'Order data not found'
    });
  }

  const customerPhone = currentOrder.customerPhone || '';

  if (!customerPhone) {
    return res.status(400).json({
      success: false,
      error: 'Customer phone number not available'
    });
  }

  try {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${customerPhone}?text=${encodedMessage}`;

    // Log the WhatsApp message in order notes
    await db
      .update(orders)
      .set({
        notes: `${currentOrder.notes || ''}\nWhatsApp message sent: ${messageType}`,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id));

    res.json({
      success: true,
      data: {
        whatsappUrl: whatsappUrl,
        messageType: messageType,
        customerPhone: customerPhone,
        orderNumber: currentOrder.orderNumber
      },
      message: 'WhatsApp message URL generated successfully'
    });

  } catch (error) {
    console.error('Failed to generate WhatsApp message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate WhatsApp message'
    });
  }
}); 
