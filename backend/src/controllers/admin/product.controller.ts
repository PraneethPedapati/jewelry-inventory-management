import { Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { ProductService } from '../../services/product.service.js';
import { asyncHandler } from '../../middleware/error-handler.middleware.js';

// Multer configuration for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

// Validation schemas
const CreateProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  productType: z.enum(['chain', 'bracelet-anklet']),
  price: z.number().positive('Price must be positive'),
  discountedPrice: z.number().positive().optional(),
  isActive: z.boolean().optional()
});

const UpdateProductSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  productType: z.enum(['chain', 'bracelet-anklet']).optional(),
  price: z.number().positive().optional(),
  discountedPrice: z.number().positive().optional(),
  isActive: z.boolean().optional()
});

/**
 * Get all products
 * GET /api/admin/products
 */
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search, productType, isActive } = req.query;

  const result = await ProductService.getProducts({
    page: Number(page),
    limit: Number(limit),
    search: search as string,
    productType: productType as string,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
  });

  res.json({
    success: true,
    data: result
  });
});

/**
 * Get product by ID
 * GET /api/admin/products/:id
 */
export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Product ID is required'
    });
  }

  const product = await ProductService.getProductById(id);

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  }

  res.json({
    success: true,
    data: product,
    message: 'Product retrieved successfully'
  });
});

/**
 * Get product by code
 * GET /api/products/:code
 */
export const getProductByCode = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;
  if (!code) {
    return res.status(400).json({
      success: false,
      error: 'Product code is required'
    });
  }
  const product = await ProductService.getProductByCode(code.toUpperCase());

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  }

  res.json({
    success: true,
    data: { product }
  });
});

/**
 * Search products
 * GET /api/products/search?q=CH001
 */
export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }

  const products = await ProductService.searchProducts(q);

  res.json({
    success: true,
    data: {
      products,
      query: q,
      count: products.length
    }
  });
});

/**
 * Create new product with auto-generated product code and image upload
 * POST /api/admin/products
 */
export const createProduct = [
  upload.array('images', 5),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validate request data
      const validatedData = CreateProductSchema.parse({
        name: req.body.name,
        description: req.body.description,
        productType: req.body.productType,
        price: parseFloat(req.body.price),
        discountedPrice: req.body.discountedPrice ? parseFloat(req.body.discountedPrice) : undefined,
        isActive: req.body.isActive === 'true'
      });

      // Validate discounted price
      if (validatedData.discountedPrice && validatedData.discountedPrice >= validatedData.price) {
        return res.status(400).json({
          success: false,
          error: 'Discounted price must be less than original price'
        });
      }

      // Get uploaded files
      const files = req.files as Express.Multer.File[];

      // Make image upload optional for development
      if (!files || files.length === 0) {
        console.warn('⚠️ No images uploaded, creating product without images');
      }

      // Create product (code will be auto-generated)
      const product = await ProductService.createProduct(validatedData, files);

      if (!product) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create product'
        });
      }

      // Return success with generated product code
      res.status(201).json({
        success: true,
        message: `Product created successfully with code: ${product.productCode}`,
        data: {
          product: {
            ...product,
            imageCount: Array.isArray(product.images) ? product.images.length : 0
          }
        }
      });

    } catch (error) {
      console.error('Product creation error:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create product'
      });
    }
  })
];

/**
 * Update product
 * PUT /api/admin/products/:id
 */
export const updateProduct = [
  upload.array('images', 5),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    // Convert FormData string values to proper types before validation
    const validatedData = UpdateProductSchema.parse({
      name: req.body.name,
      description: req.body.description,
      productType: req.body.productType,
      price: req.body.price ? parseFloat(req.body.price) : undefined,
      discountedPrice: req.body.discountedPrice ? parseFloat(req.body.discountedPrice) : undefined,
      isActive: req.body.isActive ? req.body.isActive === 'true' : undefined
    });

    // Get uploaded files
    const files = req.files as Express.Multer.File[];

    const updatedProduct = await ProductService.updateProduct(id, validatedData as any, files);

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });
  })
];

/**
 * Delete product
 * DELETE /api/admin/products/:id
 */
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Product ID is required'
    });
  }

  const deletedProduct = await ProductService.deleteProduct(id);

  if (!deletedProduct) {
    return res.status(404).json({
      success: false,
      error: 'Product not found'
    });
  }

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

/**
 * Get product statistics
 * GET /api/admin/products/stats
 */
export const getProductStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await ProductService.getProductStats();

  res.json({
    success: true,
    data: stats
  });
}); 
