import { config } from '@/config/app.js';
import { Order, OrderItem } from '@/types/api.js';
import { traceWhatsAppOperation } from '@/utils/tracing.js';

export class WhatsAppService {
  private static readonly BUSINESS_PHONE = config.WHATSAPP_BUSINESS_PHONE;

  /**
   * Generate WhatsApp URL for new order message
   */
  static async generateOrderMessage(order: Order): Promise<{ url: string; message: string }> {
    return traceWhatsAppOperation('generate_order_message', order.id, async () => {
      const message = this.formatOrderMessage(order);
      const encodedMessage = encodeURIComponent(message);
      const url = `https://wa.me/${this.BUSINESS_PHONE}?text=${encodedMessage}`;

      return { url, message };
    });
  }

  /**
   * Generate WhatsApp URL for status update message to customer
   */
  static async generateStatusMessage(
    order: Order,
    customMessage?: string
  ): Promise<{ url: string; message: string }> {
    return traceWhatsAppOperation('generate_status_message', order.id, async () => {
      const message = customMessage || this.formatStatusMessage(order);
      const encodedMessage = encodeURIComponent(message);
      const url = `https://wa.me/${order.customerPhone}?text=${encodedMessage}`;

      return { url, message };
    });
  }

  /**
   * Format complete order message for jewelry store
   */
  private static formatOrderMessage(order: Order): string {
    const items = order.items.map(item => {
      const spec = this.getSpecificationDisplay(item);
      return `• ${item.productSnapshot.name}${spec ? ` (${spec})` : ''} × ${item.quantity} - $${item.totalPrice.toFixed(2)}`;
    }).join('\n');

    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `💎 *New Jewelry Order*

*Order #:* ${order.orderNumber}
*Date:* ${orderDate}

*Customer Details:*
👤 Name: ${order.customerName}
📧 Email: ${order.customerEmail}
📱 Phone: ${order.customerPhone}
🏠 Address: ${order.customerAddress}

*Jewelry Items Ordered:*
${items}

*💰 Total Amount: $${order.totalAmount.toFixed(2)}*

Thank you for choosing our jewelry! We'll send you the payment QR code shortly. ✨

_This is an automated message from our jewelry inventory system._`;
  }

  /**
   * Format status update message for customers
   */
  private static formatStatusMessage(order: Order): string {
    const statusMessages = {
      pending: '⏳ Your jewelry order has been received and is being reviewed by our team.',
      confirmed: '✅ Your order has been confirmed! We\'re carefully preparing your beautiful jewelry pieces.',
      processing: '🔨 Your jewelry is being crafted with love and attention to detail by our skilled artisans.',
      shipped: '📦 Your jewelry order has been shipped! You\'ll receive tracking details soon. Almost there! ✨',
      delivered: '🎉 Your jewelry order has been delivered! We hope you absolutely love your new pieces! 💎',
      cancelled: '❌ Your order has been cancelled. Please contact us if you have any questions about this decision.'
    };

    const itemsList = order.items.map(item => {
      const spec = this.getSpecificationDisplay(item);
      return `• ${item.productSnapshot.name}${spec ? ` (${spec})` : ''} × ${item.quantity}`;
    }).join('\n');

    const statusEmoji = {
      pending: '⏳',
      confirmed: '✅',
      processing: '🔨',
      shipped: '📦',
      delivered: '🎉',
      cancelled: '❌'
    };

    return `${statusEmoji[order.status]} *Order Update - #${order.orderNumber}*

Hi ${order.customerName}! 👋

${statusMessages[order.status]}

*Your Jewelry Order:*
${itemsList}

*Total: $${order.totalAmount.toFixed(2)}*
*Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}*

Need help or have questions? Just reply to this message! We're here to help. 💫

_Your Jewelry Store Team_`;
  }

  /**
   * Get formatted specification display for order items
   */
  private static getSpecificationDisplay(item: OrderItem): string {
    // Extract specification info from product snapshot
    const product = item.productSnapshot;

    // Try to determine the specification type from the product
    if (product.productType?.specificationType === 'size') {
      // For bracelets/anklets - show size
      return `Size: S/M/L`; // This would be replaced with actual spec data
    } else if (product.productType?.specificationType === 'layer') {
      // For chains - show layer
      return `Layers: Single/Double/Triple`; // This would be replaced with actual spec data
    }

    return '';
  }

  /**
   * Generate payment request message
   */
  static generatePaymentMessage(order: Order, paymentMethod: 'qr' | 'bank_transfer' = 'qr'): string {
    const paymentMessages = {
      qr: '📱 Please scan the QR code I\'m sending next to complete your payment.',
      bank_transfer: '🏦 Bank transfer details will be shared with you shortly.'
    };

    return `💳 *Payment Request - Order #${order.orderNumber}*

Hello ${order.customerName}!

Your jewelry order is confirmed and ready for payment.

*Order Total: $${order.totalAmount.toFixed(2)}*

${paymentMessages[paymentMethod]}

Once payment is received, we'll immediately begin crafting your beautiful jewelry pieces! ✨

Thank you for choosing us! 💎`;
  }

  /**
   * Generate delivery confirmation message
   */
  static generateDeliveryMessage(order: Order, trackingNumber?: string): string {
    let trackingInfo = '';
    if (trackingNumber) {
      trackingInfo = `\n*Tracking Number:* ${trackingNumber}\n`;
    }

    return `🚚 *Shipping Confirmation - Order #${order.orderNumber}*

Great news ${order.customerName}!

Your jewelry order is on its way to you! 📦✨
${trackingInfo}
*Delivery Address:*
${order.customerAddress}

*What to expect:*
• Secure packaging to protect your jewelry
• Estimated delivery: 2-3 business days
• You'll receive delivery notifications

We can't wait for you to see your beautiful new jewelry pieces! 💎

Questions? Just reply to this message!

_Your Jewelry Store Team_`;
  }

  /**
   * Generate custom promotional message
   */
  static generatePromotionalMessage(
    customerName: string,
    promoTitle: string,
    promoDetails: string,
    validUntil?: string
  ): string {
    let validityInfo = '';
    if (validUntil) {
      validityInfo = `\n⏰ *Valid until:* ${validUntil}\n`;
    }

    return `🎉 *${promoTitle}*

Hi ${customerName}!

${promoDetails}
${validityInfo}
Don't miss out on these stunning jewelry pieces! ✨

Visit our store or reply to this message to place your order.

_Your Jewelry Store Team_ 💎`;
  }

  /**
   * Generate low stock alert for admin
   */
  static generateLowStockAlert(productName: string, currentStock: number, threshold: number): string {
    return `⚠️ *Low Stock Alert*

Product: ${productName}
Current Stock: ${currentStock}
Alert Threshold: ${threshold}

Please restock this popular jewelry item soon!

_Jewelry Inventory System_`;
  }

  /**
   * Validate phone number format for WhatsApp
   */
  static validatePhoneNumber(phone: string): { isValid: boolean; formatted?: string; error?: string } {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    // Check if it's a valid length (7-15 digits according to E.164)
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      return {
        isValid: false,
        error: 'Phone number must be between 7 and 15 digits'
      };
    }

    // Format with country code if missing
    let formattedPhone = cleanPhone;
    if (!cleanPhone.startsWith('1') && cleanPhone.length === 10) {
      // Assume US number if 10 digits
      formattedPhone = '1' + cleanPhone;
    }

    return {
      isValid: true,
      formatted: formattedPhone
    };
  }

  /**
   * Generate order summary for admin notifications
   */
  static generateAdminOrderSummary(order: Order): string {
    const items = order.items.map(item =>
      `• ${item.productSnapshot.name} × ${item.quantity}`
    ).join('\n');

    return `📋 *New Order Summary*

Order: #${order.orderNumber}
Customer: ${order.customerName}
Phone: ${order.customerPhone}
Total: $${order.totalAmount.toFixed(2)}

Items:
${items}

WhatsApp sent to customer ✅`;
  }
} 
