import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/connection.js';
import { products, productTypes, productSpecifications } from '../../db/schema.js';
import { eq, desc, and, like, or } from 'drizzle-orm';
import { asyncHandler } from '../../middleware/error-handler.middleware.js';

// Validation schemas
const CreateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    category: z.enum(['chain', 'bracelet', 'anklet']),
    charmDescription: z.string().min(1, 'Charm description is required'),
    chainDescription: z.string().min(1, 'Chain description is required'),
    basePrice: z.number().positive('Price must be positive'),
    images: z.array(z.string()).optional(),
    metaDescription: z.string().optional(),
    stockAlertThreshold: z.number().optional()
  })
});

const UpdateProductSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    charmDescription: z.string().optional(),
    chainDescription: z.string().optional(),
    basePrice: z.number().positive().optional(),
    images: z.array(z.string()).optional(),
    metaDescription: z.string().optional(),
    isActive: z.boolean().optional(),
    stockAlertThreshold: z.number().optional()
  }),
  params: z.object({
    id: z.string().uuid('Valid product ID is required')
  })
});

/**
 * Get all products with filters
 * GET /api/admin/products
 */
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { search, category, status, page = 1, limit = 10 } = req.query;

  let query = db
    .select({
      id: products.id,
      name: products.name,
      charmDescription: products.charmDescription,
      chainDescription: products.chainDescription,
      basePrice: products.basePrice,
      sku: products.sku,
      images: products.images,
      isActive: products.isActive,
      stockAlertThreshold: products.stockAlertThreshold,
      metaDescription: products.metaDescription,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      productType: {
        id: productTypes.id,
        name: productTypes.name,
        displayName: productTypes.displayName,
        specificationType: productTypes.specificationType
      }
    })
    .from(products)
    .leftJoin(productTypes, eq(products.productTypeId, productTypes.id))
    .orderBy(desc(products.createdAt));

  // Apply filters
  const conditions = [];

  // Always filter to only show active products unless explicitly requesting inactive ones
  if (status === 'inactive') {
    conditions.push(eq(products.isActive, false));
  } else {
    // Default to showing only active products
    conditions.push(eq(products.isActive, true));
  }

  if (search) {
    conditions.push(
      or(
        like(products.name, `%${search}%`),
        like(products.charmDescription, `%${search}%`),
        like(products.chainDescription, `%${search}%`)
      )
    );
  }

  if (category) {
    conditions.push(eq(productTypes.name, category as string));
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
  const totalCount = await db
    .select({ count: products.id })
    .from(products)
    .leftJoin(productTypes, eq(products.productTypeId, productTypes.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json({
    success: true,
    data: {
      products: result,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / limitNum)
      }
    },
    message: `Found ${result.length} products`
  });
});

/**
 * Get product by ID
 * GET /api/admin/products/:id
 */
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await db
    .select({
      id: products.id,
      name: products.name,
      charmDescription: products.charmDescription,
      chainDescription: products.chainDescription,
      basePrice: products.basePrice,
      sku: products.sku,
      images: products.images,
      isActive: products.isActive,
      stockAlertThreshold: products.stockAlertThreshold,
      metaDescription: products.metaDescription,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      productType: {
        id: productTypes.id,
        name: productTypes.name,
        displayName: productTypes.displayName,
        specificationType: productTypes.specificationType
      }
    })
    .from(products)
    .leftJoin(productTypes, eq(products.productTypeId, productTypes.id))
    .where(eq(products.id, id))
    .limit(1);

  if (!product.length) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  }

  // Get product specifications
  const specifications = await db
    .select()
    .from(productSpecifications)
    .where(eq(productSpecifications.productId, id));

  res.json({
    success: true,
    data: {
      ...product[0],
      specifications
    },
    message: 'Product retrieved successfully'
  });
});

/**
 * Create new product
 * POST /api/admin/products
 */
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { body } = CreateProductSchema.parse({ body: req.body });

  // Get product type ID
  const productType = await db
    .select()
    .from(productTypes)
    .where(eq(productTypes.name, body.category))
    .limit(1);

  if (!productType.length) {
    return res.status(400).json({
      success: false,
      error: 'Invalid product category'
    });
  }

  // Generate SKU
  const sku = `${body.category.toUpperCase()}-${Date.now().toString().slice(-6)}`;

  const newProduct = await db
    .insert(products)
    .values({
      name: body.name,
      charmDescription: body.charmDescription,
      chainDescription: body.chainDescription,
      productTypeId: productType[0].id,
      basePrice: body.basePrice.toString(),
      sku,
      images: body.images || [],
      metaDescription: body.metaDescription,
      stockAlertThreshold: body.stockAlertThreshold || 5
    })
    .returning();

  res.status(201).json({
    success: true,
    data: newProduct[0],
    message: 'Product created successfully'
  });
});

/**
 * Update product
 * PUT /api/admin/products/:id
 */
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { body, params } = UpdateProductSchema.parse({ body: req.body, params: req.params });

  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.id, params.id))
    .limit(1);

  if (!existingProduct.length) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  }

  const updateData: any = {
    ...body,
    updatedAt: new Date()
  };

  if (body.basePrice) {
    updateData.basePrice = body.basePrice.toString();
  }

  const updatedProduct = await db
    .update(products)
    .set(updateData)
    .where(eq(products.id, params.id))
    .returning();

  res.json({
    success: true,
    data: updatedProduct[0],
    message: 'Product updated successfully'
  });
});

/**
 * Delete product
 * DELETE /api/admin/products/:id
 */
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingProduct = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!existingProduct.length) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  }

  // Soft delete by setting isActive to false
  await db
    .update(products)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(products.id, id));

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

/**
 * Get product categories
 * GET /api/admin/products/categories
 */
export const getProductCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await db
    .select()
    .from(productTypes)
    .where(eq(productTypes.isActive, true));

  res.json({
    success: true,
    data: categories,
    message: `Found ${categories.length} categories`
  });
}); 
