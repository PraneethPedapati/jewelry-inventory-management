import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/connection.js';
import { orders, orderItems, products } from '../../db/schema.js';
import { eq, and, gte } from 'drizzle-orm';
import { asyncHandler } from '../../middleware/error-handler.middleware.js';
import { WhatsAppService } from '../../services/whatsapp.service.js';
import { OrderCodeService } from '../../services/order-code.service.js';


// Validation schema for public order creation
const CreatePublicOrderSchema = z.object({
  body: z.object({
    customerName: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    customerPhone: z.string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(10, 'Phone number must be exactly 10 digits')
      .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
    customerAddress: z.string()
      .min(10, 'Address must be at least 10 characters')
      .max(500, 'Address must be less than 500 characters'),
    customerPincode: z.string()
      .min(6, 'Pincode must be 6 digits')
      .max(6, 'Pincode must be 6 digits')
      .regex(/^\d{6}$/, 'Pincode must be 6 digits'),
    items: z.array(z.object({
      productId: z.string().min(1, 'Product ID is required'),
      quantity: z.number()
        .int('Quantity must be a whole number')
        .min(1, 'Quantity must be at least 1')
        .max(10, 'Maximum 10 items per product')
    })).min(1, 'At least one item is required').max(20, 'Maximum 20 items per order'),
    recaptchaToken: z.string().min(1, 'CAPTCHA verification is required').optional()
  })
});

/**
 * Verify reCAPTCHA v3 token
 */
async function verifyRecaptcha(token: string): Promise<{ success: boolean; score?: number; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY environment variable not set');
    return { success: false, error: 'CAPTCHA verification unavailable' };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`
    });

    const data = await response.json();

    if (data.success && data.score >= 0.5) {
      return { success: true, score: data.score };
    } else {
      console.warn('reCAPTCHA verification failed:', data);
      return { success: false, error: 'CAPTCHA verification failed' };
    }
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, error: 'CAPTCHA verification error' };
  }
}

/**
 * Sanitize input to prevent XSS
 */
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove on* event handlers
    .trim();
}

/**
 * Create new order (Public endpoint) - Payment Pending Flow
 * POST /api/orders
 */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { body } = CreatePublicOrderSchema.parse({ body: req.body });

  // --- TEMPORARY: Skip reCAPTCHA verification for development/testing ---
  const SKIP_RECAPTCHA = true; // Set to false to re-enable reCAPTCHA verification
  let recaptchaResult: { success: boolean; score?: number; error?: string } = { success: true, score: 1 };
  if (!SKIP_RECAPTCHA) {
    if (!body.recaptchaToken) {
      return res.status(400).json({
        success: false,
        error: 'reCAPTCHA token is required'
      });
    }
    recaptchaResult = await verifyRecaptcha(body.recaptchaToken);
    if (!recaptchaResult.success) {
      return res.status(400).json({
        success: false,
        error: recaptchaResult.error || 'CAPTCHA verification failed'
      });
    }
  }
  // --- END SKIP ---

  // Sanitize inputs
  const sanitizedData = {
    customerName: sanitizeInput(body.customerName),
    customerPhone: sanitizeInput(body.customerPhone),
    customerAddress: sanitizeInput(body.customerAddress),
    customerPincode: sanitizeInput(body.customerPincode)
  };

  // Check for duplicate orders (same customer, same items within 5 minutes)
  // const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  // const existingOrder = await db
  //   .select()
  //   .from(orders)
  //   .where(
  //     and(
  //       eq(orders.customerPhone, sanitizedData.customerPhone),
  //       gte(orders.createdAt, fiveMinutesAgo),
  //       eq(orders.status, 'draft')
  //     )
  //   )
  //   .limit(1);

  // if (existingOrder.length > 0) {
  //   return res.status(400).json({
  //     success: false,
  //     error: 'You have already placed a similar order recently. Please wait 5 minutes before placing another order.'
  //   });
  // }

  // Generate order number and order code
  const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;
  const orderCode = await OrderCodeService.generateOrderCode();

  // Calculate total amount and validate products
  let totalAmount = 0;
  const orderItemsData: Array<{
    productId: string;
    quantity: number;
    unitPrice: string;
    productSnapshot: any;
  }> = [];

  for (const item of body.items) {
    // Get product details
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);

    if (!product.length || !product[0]) {
      console.error(`Product lookup failed - ProductID: ${item.productId}`);
      return res.status(400).json({
        success: false,
        error: 'One or more products are no longer available. Please ensure you are using valid product IDs from the backend API.'
      });
    }

    // Use discounted price if available, otherwise base price
    const productPrice = product[0].discountedPrice
      ? parseFloat(product[0].discountedPrice)
      : parseFloat(product[0].price);

    const unitPrice = productPrice;
    const itemTotal = unitPrice * item.quantity;
    totalAmount += itemTotal;

    orderItemsData.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: unitPrice.toString(),
      productSnapshot: product[0]
    });
  }

  // Create order in database with payment_pending status
  const newOrder = await db
    .insert(orders)
    .values({
      orderNumber,
      orderCode,
      customerName: sanitizedData.customerName,
      customerPhone: sanitizedData.customerPhone,
      customerAddress: `${sanitizedData.customerAddress}, PIN: ${sanitizedData.customerPincode}`,
      totalAmount: totalAmount.toString(),
      status: 'payment_pending', // Start with payment_pending status
      notes: null // No default notes - only admin can add notes
    })
    .returning();

  if (!newOrder.length || !newOrder[0]) {
    return res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }

  // Create order items
  if (!newOrder || !newOrder[0] || typeof newOrder[0].id === 'undefined') {
    return res.status(500).json({
      success: false,
      error: 'Order creation failed: missing order ID.'
    });
  }

  // Add orderId to each order item and insert into the database, with type safety and error handling
  if (!Array.isArray(orderItemsData) || orderItemsData.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No order items to insert.'
    });
  }

  const orderId = newOrder[0]?.id;
  if (typeof orderId === 'undefined' || orderId === null) {
    return res.status(500).json({
      success: false,
      error: 'Order ID is missing for order items insertion.'
    });
  }

  const orderItemsWithOrderId = orderItemsData.map(item => ({
    ...item,
    orderId
  }));

  try {
    await db.insert(orderItems).values(orderItemsWithOrderId);
  } catch (err) {
    // Log error and return a 500 response
    console.error('Failed to insert order items:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to insert order items.'
    });
  }

  // Create complete order object for WhatsApp service
  const completeOrder = {
    id: newOrder[0]!.id,
    orderNumber: newOrder[0]!.orderNumber || '',
    orderCode: newOrder[0]!.orderCode || '',
    customerName: newOrder[0]!.customerName || '',
    customerPhone: newOrder[0]!.customerPhone || '',
    customerAddress: newOrder[0]!.customerAddress || '',
    totalAmount: parseFloat(newOrder[0]!.totalAmount),
    status: (newOrder[0]!.status as 'payment_pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled') || 'payment_pending',
    whatsappMessageSent: newOrder[0]!.whatsappMessageSent || false,
    paymentReceived: newOrder[0]!.paymentReceived || false,
    notes: newOrder[0]!.notes || '',
    createdAt: newOrder[0]!.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: newOrder[0]!.updatedAt?.toISOString() || new Date().toISOString(),
    items: orderItemsWithOrderId!.map((item, index) => {
      if (!item) return {
        id: '',
        productId: '',
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
        productSnapshot: {},
        createdAt: new Date().toISOString()
      };
      return {
        id: '',
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseFloat(item.unitPrice) * item.quantity,
        productSnapshot: (orderItemsData[index] && orderItemsData[index].productSnapshot) || {},
        createdAt: new Date().toISOString()
      };
    })
  };

  res.status(201).json({
    success: true,
    data: {
      orderNumber: newOrder[0].orderNumber,
      orderCode: newOrder[0].orderCode,
      totalAmount: totalAmount,
      estimatedDelivery: '5-7 business days',
      status: 'payment_pending'
    },
    message: 'Order created successfully! We will contact you soon with payment details.'
  });
}); 
