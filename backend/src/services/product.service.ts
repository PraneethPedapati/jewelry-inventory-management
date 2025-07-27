import { db } from '../db/connection.js';
import { products } from '../db/schema.js';
import { ImgBBService } from './imgbb.service.js';
import { ProductCodeService } from './product-code.service.js';
import { eq, or, like, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

interface CreateProductRequest {
  name: string;
  description: string;
  productType: 'chain' | 'bracelet-anklet';
  price: number;
  discountedPrice?: number | undefined;
  isActive?: boolean | undefined;
}

export class ProductService {
  /**
   * Create product with auto-generated product code and images
   */
  static async createProduct(
    productData: CreateProductRequest,
    imageFiles: Express.Multer.File[]
  ) {
    try {
      console.log('🚀 Starting product creation...');
      console.log('📝 Product data:', productData);
      console.log('🖼️ Image files count:', imageFiles?.length || 0);

      // 1. Generate unique product code
      console.log('🔢 Generating product code...');
      const productCode = await ProductCodeService.generateProductCode(productData.productType);
      console.log(`✅ Generated product code: ${productCode}`);

      // 2. Handle images (simplified for now)
      let imageUrls: string[] = [];
      console.log('📷 Image upload disabled for now, creating product without images');

      // 3. Save product to database with generated code
      const newProduct = await db.insert(products).values({
        productCode, // Auto-generated code
        name: productData.name,
        description: productData.description,
        productType: productData.productType,
        price: productData.price.toString(),
        discountedPrice: productData.discountedPrice ? productData.discountedPrice.toString() : null,
        images: imageUrls,
        isActive: productData.isActive ?? true
      }).returning();

      console.log(`✅ Product created with code: ${productCode}, ID: ${newProduct[0]?.id}`);
      return newProduct[0] || null;

    } catch (error) {
      console.error('❌ Product creation failed:', error);
      throw new Error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all products with pagination and filtering
   */
  static async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    productType?: string;
    isActive?: boolean | undefined;
  } = {}) {
    const { page = 1, limit = 10, search, productType, isActive } = params;
    const offset = (page - 1) * limit;

    let query = db.select().from(products);

    // Apply filters
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(products.name, `%${search}%`),
          like(products.description, `%${search}%`),
          like(products.productCode, `%${search}%`)
        )
      );
    }

    if (productType) {
      conditions.push(eq(products.productType, productType));
    }

    if (isActive !== undefined) {
      conditions.push(eq(products.isActive, isActive));
    }

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : conditions.reduce((acc, condition) => acc && condition));
    }

    // Get total count for pagination
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(products);
    if (conditions.length > 0) {
      countQuery = countQuery.where(conditions.length === 1 ? conditions[0] : conditions.reduce((acc, condition) => acc && condition));
    }
    const countResult = await countQuery;
    const count = countResult[0]?.count || 0;

    // Get paginated results
    const results = await query
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      products: results,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: string) {
    const product = await db.select().from(products)
      .where(eq(products.id, id))
      .limit(1);
    return product[0] || null;
  }

  /**
   * Get product by product code (user-friendly lookup)
   */
  static async getProductByCode(productCode: string) {
    const product = await db.select().from(products)
      .where(eq(products.productCode, productCode))
      .limit(1);
    return product[0] || null;
  }

  /**
   * Search products by code or name
   */
  static async searchProducts(query: string) {
    return await db.select().from(products)
      .where(
        or(
          like(products.productCode, `%${query}%`),
          like(products.name, `%${query}%`),
          like(products.description, `%${query}%`)
        )
      )
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt));
  }

  /**
   * Update product
   */
  static async updateProduct(id: string, updates: Partial<CreateProductRequest> & { [key: string]: any }) {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.productType !== undefined) updateData.productType = updates.productType;
    if (updates.price !== undefined) updateData.price = updates.price.toString();
    if (updates.discountedPrice !== undefined) updateData.discountedPrice = updates.discountedPrice?.toString() || null;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    updateData.updatedAt = new Date();

    const updatedProduct = await db.update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    return updatedProduct[0] || null;
  }

  /**
   * Delete product
   */
  static async deleteProduct(id: string) {
    const deletedProduct = await db.delete(products)
      .where(eq(products.id, id))
      .returning();

    return deletedProduct[0] || null;
  }

  /**
   * Get product statistics
   */
  static async getProductStats() {
    const [totalProducts] = await db.select({ count: sql<number>`count(*)` }).from(products);
    const [activeProducts] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isActive, true));
    const [chainProducts] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.productType, 'chain'));
    const [braceletProducts] = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.productType, 'bracelet-anklet'));

    return {
      total: totalProducts?.count || 0,
      active: activeProducts?.count || 0,
      chain: chainProducts?.count || 0,
      bracelet: braceletProducts?.count || 0
    };
  }
} 
