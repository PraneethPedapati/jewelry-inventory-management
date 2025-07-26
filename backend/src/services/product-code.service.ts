import { db } from '../db/connection.js';
import { products, productCodeSequences } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

type ProductType = 'chain' | 'bracelet-anklet';

interface ProductCodeOptions {
  strategy: 'simple' | 'prefixed' | 'yearly';
  businessPrefix?: string;
}

export class ProductCodeService {
  private static readonly CODE_CONFIG: ProductCodeOptions = {
    strategy: 'simple', // or 'prefixed' or 'yearly'
    businessPrefix: 'JEW' // Your business prefix
  };

  /**
   * Generate unique product code based on product type
   */
  static async generateProductCode(productType: ProductType): Promise<string> {
    return await db.transaction(async (tx) => {
      // Get and increment sequence for this product type
      const [sequenceRecord] = await tx
        .update(productCodeSequences)
        .set({
          currentSequence: sql`current_sequence + 1`
        })
        .where(eq(productCodeSequences.productType, productType))
        .returning();

      const nextNumber = sequenceRecord.currentSequence;

      // Generate code based on strategy
      let productCode = '';

      switch (this.CODE_CONFIG.strategy) {
        case 'simple':
          productCode = this.generateSimpleCode(productType, nextNumber);
          break;
        case 'prefixed':
          productCode = this.generatePrefixedCode(productType, nextNumber);
          break;
        case 'yearly':
          productCode = this.generateYearlyCode(productType, nextNumber);
          break;
        default:
          productCode = this.generateSimpleCode(productType, nextNumber);
      }

      // Ensure uniqueness (extra safety check)
      const existingProduct = await tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.productCode, productCode))
        .limit(1);

      if (existingProduct.length > 0) {
        // If collision (very rare), retry with next number
        return await this.generateProductCode(productType);
      }

      return productCode;
    });
  }

  /**
   * Simple format: CH001, BR002, AN003
   */
  private static generateSimpleCode(productType: ProductType, sequence: number): string {
    const prefixes = {
      chain: 'CH',
      'bracelet-anklet': 'BR'
    };

    return `${prefixes[productType]}${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Prefixed format: JEW-CH-001, JEW-BR-002
   */
  private static generatePrefixedCode(productType: ProductType, sequence: number): string {
    const prefixes = {
      chain: 'CH',
      'bracelet-anklet': 'BR'
    };

    return `${this.CODE_CONFIG.businessPrefix}-${prefixes[productType]}-${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Yearly format: 2025-CH-001, 2025-BR-002
   */
  private static generateYearlyCode(productType: ProductType, sequence: number): string {
    const currentYear = new Date().getFullYear();
    const prefixes = {
      chain: 'CH',
      'bracelet-anklet': 'BR'
    };

    return `${currentYear}-${prefixes[productType]}-${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Validate product code format
   */
  static validateProductCode(code: string): boolean {
    const patterns = {
      simple: /^(CH|BR)\d{3}$/,
      prefixed: /^JEW-(CH|BR)-\d{3}$/,
      yearly: /^\d{4}-(CH|BR)-\d{3}$/
    };

    return patterns[this.CODE_CONFIG.strategy].test(code);
  }
} 
