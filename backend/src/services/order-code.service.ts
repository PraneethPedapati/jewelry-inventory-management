import { db } from '../db/connection.js';
import { orders } from '../db/schema.js';
import { desc, eq } from 'drizzle-orm';

/**
 * Service for generating unique order codes
 */
export class OrderCodeService {
  /**
   * Generate the next order code in sequence
   * Format: ORD001, ORD002, ORD010, ORD100, etc.
   */
  static async generateOrderCode(): Promise<string> {
    try {
      // Get the latest order code from the database
      const latestOrder = await db
        .select({ orderCode: orders.orderCode })
        .from(orders)
        .orderBy(desc(orders.orderCode))
        .limit(1);

      let nextNumber = 1;

      if (latestOrder.length > 0 && latestOrder[0].orderCode) {
        // Extract the number from the latest order code (e.g., "ORD123" -> 123)
        const match = latestOrder[0].orderCode.match(/^ORD(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      // Format with zero padding (minimum 3 digits, but can grow)
      const paddedNumber = nextNumber.toString().padStart(3, '0');
      return `ORD${paddedNumber}`;
    } catch (error) {
      console.error('Error generating order code:', error);
      // Fallback: use timestamp-based code if database query fails
      const timestamp = Date.now().toString().slice(-6);
      return `ORD${timestamp}`;
    }
  }

  /**
   * Validate order code format
   */
  static isValidOrderCode(code: string): boolean {
    return /^ORD\d{3,}$/.test(code);
  }

  /**
   * Find order by order code
   */
  static async findOrderByCode(orderCode: string) {
    if (!this.isValidOrderCode(orderCode)) {
      return null;
    }

    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.orderCode, orderCode))
      .limit(1);

    return order.length > 0 ? order[0] : null;
  }
} 
