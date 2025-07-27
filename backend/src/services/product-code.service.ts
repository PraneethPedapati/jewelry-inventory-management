import { db } from '../db/connection.js';
import { products, productCodeSequences } from '../db/schema.js';
import { eq } from 'drizzle-orm';

type ProductType = 'chain' | 'bracelet-anklet';

export class ProductCodeService {
  /**
   * Generate unique product code based on product type
   */
  static async generateProductCode(productType: ProductType): Promise<string> {
    try {
      // Get current sequence
      const sequenceResult = await db
        .select()
        .from(productCodeSequences)
        .where(eq(productCodeSequences.productType, productType))
        .limit(1);

      const sequenceRecord = sequenceResult[0];
      if (!sequenceRecord) {
        throw new Error(`No sequence found for product type: ${productType}`);
      }

      const nextNumber = (sequenceRecord.currentSequence || 0) + 1;

      // Update sequence
      await db
        .update(productCodeSequences)
        .set({
          currentSequence: nextNumber
        })
        .where(eq(productCodeSequences.productType, productType));

      // Generate simple code format: CH001, BR002
      const prefixes = {
        chain: 'CH',
        'bracelet-anklet': 'BR'
      };

      const productCode = `${prefixes[productType]}${nextNumber.toString().padStart(3, '0')}`;

      // Ensure uniqueness
      const existingProduct = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.productCode, productCode))
        .limit(1);

      if (existingProduct.length > 0) {
        console.warn(`Product code collision detected: ${productCode}, retrying...`);
        return await this.generateProductCode(productType);
      }

      return productCode;
    } catch (error) {
      console.error('Error generating product code:', error);
      // Fallback to timestamp-based code
      const timestamp = Date.now().toString().slice(-6);
      const prefixes = {
        chain: 'CH',
        'bracelet-anklet': 'BR'
      };
      return `${prefixes[productType]}${timestamp}`;
    }
  }

  /**
   * Validate product code format
   */
  static validateProductCode(code: string): boolean {
    const pattern = /^(CH|BR)\d{3,}$/;
    return pattern.test(code);
  }
} 
