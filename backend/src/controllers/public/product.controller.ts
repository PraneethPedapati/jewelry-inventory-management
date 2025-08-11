import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '@/db/connection';
import { products } from '@/db/schema';
import { eq, desc, and, like, or, count, sql } from 'drizzle-orm';
import { asyncHandler } from '@/middleware/error-handler.middleware';
import { ProductService } from '@/services/product.service';


// Validation schemas
const GetProductsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    productType: z.string().optional(),
    sortBy: z.string().optional(),
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20')
  })
});

const GetProductByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Product ID is required')
  })
});

/**
 * Get all products for public catalog
 * GET /api/products
 */
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { query } = GetProductsSchema.parse({ query: req.query });

  // Use ProductService to get products with sorting support
  const result = await ProductService.getProducts({
    page: parseInt(query.page),
    limit: parseInt(query.limit),
    search: query.search || undefined,
    productType: query.productType || undefined,
    isActive: true, // Only show active products for public
    sortBy: query.sortBy || undefined
  });

  // Transform data for frontend compatibility
  const transformedProducts = result.products.map(product => {
    const price = parseFloat(product.price || '0');
    const discountedPrice = product.discountedPrice ? parseFloat(product.discountedPrice) : null;

    return {
      id: product.id || '',
      name: product.name || '',
      price: price.toString(),
      discountedPrice: discountedPrice ? discountedPrice.toString() : undefined,
      productType: product.productType || '',
      productCode: product.productCode || '',
      description: product.description || '',
      images: product.images || [],
      isActive: product.isActive || false,
      createdAt: product.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: product.updatedAt?.toISOString() || new Date().toISOString()
    };
  });

  res.json({
    success: true,
    data: {
      products: transformedProducts,
      pagination: result.pagination
    },
    message: `Found ${transformedProducts.length} products`
  });
});

/**
 * Get product by ID
 * GET /api/products/:id
 */
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { params } = GetProductByIdSchema.parse({ params: req.params });

  // Get product details
  const product = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      productType: products.productType,
      price: products.price,
      discountedPrice: products.discountedPrice,
      productCode: products.productCode,
      images: products.images,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .where(and(eq(products.id, params.id), eq(products.isActive, true)))
    .limit(1);

  if (!product.length || !product[0]) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  }

  const foundProduct = product[0];

  // Transform for frontend
  const transformedProduct = {
    id: foundProduct.id || '',
    name: foundProduct.name || '',
    price: parseFloat(foundProduct.price || '0'),
    discountedPrice: foundProduct.discountedPrice ? parseFloat(foundProduct.discountedPrice) : null,
    productType: foundProduct.productType || '',
    productCode: foundProduct.productCode || '',
    description: foundProduct.description || '',
    images: (foundProduct.images as string[]) || [],
    isActive: foundProduct.isActive || false,
    createdAt: foundProduct.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: foundProduct.updatedAt?.toISOString() || new Date().toISOString()
  };

  res.json({
    success: true,
    data: transformedProduct,
    message: 'Product retrieved successfully'
  });
});

/**
 * Get available product types
 * GET /api/product-types
 */
export const getProductTypes = asyncHandler(async (req: Request, res: Response) => {
  const types = await db
    .select({
      productType: products.productType,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .groupBy(products.productType);

  const transformedTypes = types.map(type => ({
    value: type.productType,
    label: type.productType === 'chain' ? 'Chains' : 'Bracelets & Anklets'
  }));

  res.json({
    success: true,
    data: transformedTypes,
    message: `Found ${transformedTypes.length} product types`
  });
}); 
