import { db } from '../db/connection';
import { products } from '../db/schema';
import { ImgBBService } from './imgbb.service';
import { ProductCodeService } from './product-code.service';
import { eq, or, like, desc, and } from 'drizzle-orm';
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

      // 2. Upload images to ImgBB (if configured)
      let imageUrls: string[] = [];

      if (imageFiles && imageFiles.length > 0) {
        try {
          const uploadResults = await ImgBBService.uploadMultipleImages(
            imageFiles.map(file => file.buffer),
            imageFiles.map(file => `${productCode}-${file.originalname}`) // Use product code in filename
          );

          imageUrls = uploadResults.map(result => result.url);
          console.log(`✅ Uploaded ${imageUrls.length} images to ImgBB`);
        } catch (uploadError) {
          console.warn('⚠️ Image upload failed, creating product without images:', uploadError);
          // Continue without images if upload fails
          imageUrls = [];
        }
      } else {
        console.log('📷 No images provided, creating product without images');
      }

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

    // Apply conditions if any exist
    if (conditions.length > 0) {
      query = query.where(
        conditions.length === 1
          ? conditions[0]
          : and(...conditions)
      ) as typeof query;
    }

    // Get total count for pagination
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(products);

    if (conditions.length > 0) {
      countQuery = countQuery.where(
        conditions.length === 1
          ? conditions[0]
          : and(...conditions)
      ) as typeof countQuery;
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

  static async getProductById(id: string): Promise<typeof products.$inferSelect | null> {
    if (!id) {
      throw new Error("Product ID is required");
    }
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    // Return the first product if found, otherwise null
    return result[0] ?? null;
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
        and(
          or(
            like(products.productCode, `%${query}%`),
            like(products.name, `%${query}%`),
            like(products.description, `%${query}%`)
          ),
          eq(products.isActive, true)
        )
      )
      .orderBy(desc(products.createdAt));
  }

  /**
   * Update product
   */
  static async updateProduct(id: string, updates: Partial<CreateProductRequest> & { [key: string]: any }, imageFiles?: Express.Multer.File[]) {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.productType !== undefined) updateData.productType = updates.productType;
    if (updates.price !== undefined) updateData.price = updates.price.toString();
    if (updates.discountedPrice !== undefined) updateData.discountedPrice = updates.discountedPrice?.toString() || null;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    // Handle image updates
    if (imageFiles && imageFiles.length > 0) {
      try {
        // Get existing product to use its code for image naming
        const existingProduct = await this.getProductById(id);
        if (existingProduct) {
          // Clean up old images from ImgBB if they exist
          if (Array.isArray(existingProduct.images) && existingProduct.images.length > 0) {
            try {
              console.log(`🗑️ Cleaning up ${existingProduct.images.length} old images for product ${existingProduct.productCode}`);
              const deleteResults = await ImgBBService.deleteMultipleImages(existingProduct.images);

              const successfulDeletions = deleteResults.filter(result => result.success);
              const failedDeletions = deleteResults.filter(result => !result.success);

              console.log(`✅ Successfully deleted ${successfulDeletions.length} old images from ImgBB`);
              if (failedDeletions.length > 0) {
                console.warn(`⚠️ Failed to delete ${failedDeletions.length} old images:`, failedDeletions);
              }
            } catch (cleanupError) {
              console.warn('⚠️ Failed to clean up old images:', cleanupError);
              // Continue with upload even if cleanup fails
            }
          }

          // Upload new images
          const uploadResults = await ImgBBService.uploadMultipleImages(
            imageFiles.map(file => file.buffer),
            imageFiles.map(file => `${existingProduct.productCode}-${file.originalname}`)
          );

          const imageUrls = uploadResults.map(result => result.url);
          updateData.images = imageUrls;
          console.log(`✅ Uploaded ${imageUrls.length} new images for product update`);
        }
      } catch (uploadError) {
        console.warn('⚠️ Image upload failed during update:', uploadError);
        // Continue without updating images
      }
    }

    updateData.updatedAt = new Date();

    const updatedProduct = await db.update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    return updatedProduct[0] || null;
  }

  /**
   * Delete product and clean up associated images
   */
  static async deleteProduct(id: string) {
    try {
      // First get the product to access its images
      const product = await this.getProductById(id);
      if (!product) {
        throw new Error('Product not found');
      }

      // Delete images from ImgBB if they exist
      if (Array.isArray(product.images) && product.images.length > 0) {
        try {
          console.log(`🗑️ Cleaning up ${product.images.length} images for product ${product.productCode}`);

          // Delete all images from ImgBB
          const deleteResults = await ImgBBService.deleteMultipleImages(product.images);

          // Log results
          const successfulDeletions = deleteResults.filter(result => result.success);
          const failedDeletions = deleteResults.filter(result => !result.success);

          console.log(`✅ Successfully deleted ${successfulDeletions.length} images from ImgBB`);
          if (failedDeletions.length > 0) {
            console.warn(`⚠️ Failed to delete ${failedDeletions.length} images:`, failedDeletions);
          }

          console.log(`✅ Image cleanup completed for product ${product.productCode}`);
        } catch (imageError) {
          console.warn('⚠️ Failed to clean up images:', imageError);
          // Continue with product deletion even if image cleanup fails
        }
      }

      // Delete the product from database
      const deletedProduct = await db.delete(products)
        .where(eq(products.id, id))
        .returning();

      console.log(`✅ Product ${product.productCode} deleted successfully`);
      return deletedProduct[0] || null;
    } catch (error) {
      console.error('❌ Failed to delete product:', error);
      throw error;
    }
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
