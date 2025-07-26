<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Adding Auto-Generated User-Friendly Product Codes

Great idea! Adding user-friendly product codes will make it easier for customers and admins to reference products. Let me show you how to implement automatic product code generation for your jewelry inventory system.

## Updated Product Structure

### Enhanced Product Fields

```typescript
interface Product {
  id: string;                    // UUID (auto-generated) - Internal use
  productCode: string;           // User-friendly code (auto-generated) - Customer facing
  name: string;                  
  description: string;           
  productType: 'chain' | 'bracelet' | 'anklet';
  price: number;                 
  discountedPrice?: number;      
  images: string[];              
  isActive: boolean;             
  createdAt: Date;               
  updatedAt: Date;               
}
```


## Database Schema Updates

### Updated PostgreSQL Table

```sql
-- Updated products table with product_code
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code VARCHAR(20) UNIQUE NOT NULL, -- Auto-generated user-friendly code
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('chain', 'bracelet', 'anklet')),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    discounted_price DECIMAL(10,2) CHECK (discounted_price > 0 AND discounted_price < price),
    images JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast product code lookups
CREATE INDEX idx_products_code ON products(product_code);

-- Sequence table for generating unique numbers per product type
CREATE TABLE product_code_sequences (
    product_type VARCHAR(20) PRIMARY KEY,
    current_sequence INTEGER DEFAULT 0
);

-- Initialize sequences for each product type
INSERT INTO product_code_sequences (product_type, current_sequence) VALUES
('chain', 0),
('bracelet', 0),
('anklet', 0);
```


### Sample Data with Product Codes

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "product_code": "CH001",  // Auto-generated
  "name": "Butterfly Chain Necklace",
  "description": "Beautiful butterfly charm with sterling silver chain",
  "product_type": "chain",
  "price": 45.00,
  "discounted_price": 39.99,
  "images": ["https://i.ibb.co/abc123/butterfly-main.jpg"],
  "is_active": true,
  "created_at": "2025-07-26T11:20:00Z",
  "updated_at": "2025-07-26T11:20:00Z"
}
```


## Product Code Generation Service

### Code Generation Strategy Options

```typescript
// src/services/product-code.service.ts
import { db } from '../db/connection';
import { products, productCodeSequences } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

type ProductType = 'chain' | 'bracelet' | 'anklet';

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
      bracelet: 'BR',
      anklet: 'AN'
    };

    return `${prefixes[productType]}${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Prefixed format: JEW-CH-001, JEW-BR-002
   */
  private static generatePrefixedCode(productType: ProductType, sequence: number): string {
    const prefixes = {
      chain: 'CH',
      bracelet: 'BR',
      anklet: 'AN'
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
      bracelet: 'BR',
      anklet: 'AN'
    };

    return `${currentYear}-${prefixes[productType]}-${sequence.toString().padStart(3, '0')}`;
  }

  /**
   * Validate product code format
   */
  static validateProductCode(code: string): boolean {
    const patterns = {
      simple: /^(CH|BR|AN)\d{3}$/,
      prefixed: /^JEW-(CH|BR|AN)-\d{3}$/,
      yearly: /^\d{4}-(CH|BR|AN)-\d{3}$/
    };

    return patterns[this.CODE_CONFIG.strategy].test(code);
  }
}
```


## Updated Product Service

### Enhanced Product Creation with Auto Code Generation

```typescript
// src/services/product.service.ts (updated)
import { db } from '../db/connection';
import { products } from '../db/schema';
import { ImgBBService } from './imgbb.service';
import { ProductCodeService } from './product-code.service';

interface CreateProductRequest {
  name: string;
  description: string;
  productType: 'chain' | 'bracelet' | 'anklet';
  price: number;
  discountedPrice?: number;
  isActive?: boolean;
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
      // 1. Generate unique product code
      const productCode = await ProductCodeService.generateProductCode(productData.productType);
      console.log(`✅ Generated product code: ${productCode}`);

      // 2. Upload images to ImgBB
      let imageUrls: string[] = [];
      
      if (imageFiles && imageFiles.length > 0) {
        const uploadResults = await ImgBBService.uploadMultipleImages(
          imageFiles.map(file => file.buffer),
          imageFiles.map(file => `${productCode}-${file.originalname}`) // Use product code in filename
        );
        
        imageUrls = uploadResults.map(result => result.url);
        console.log(`✅ Uploaded ${imageUrls.length} images to ImgBB`);
      }

      // 3. Save product to database with generated code
      const newProduct = await db.insert(products).values({
        productCode, // Auto-generated code
        name: productData.name,
        description: productData.description,
        productType: productData.productType,
        price: productData.price,
        discountedPrice: productData.discountedPrice,
        images: imageUrls,
        isActive: productData.isActive ?? true
      }).returning();

      console.log(`✅ Product created with code: ${productCode}, ID: ${newProduct[0].id}`);
      return newProduct[0];
      
    } catch (error) {
      console.error('❌ Product creation failed:', error);
      throw new Error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
          like(products.name, `%${query}%`)
        )
      )
      .where(eq(products.isActive, true));
  }
}
```


## Updated Controller

### Enhanced Product Controller with Code Generation

```typescript
// src/controllers/admin/products.controller.ts (updated)
import { Request, Response } from 'express';
import multer from 'multer';
import { ProductService } from '../../services/product.service';
import { z } from 'zod';

// Same multer configuration...
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
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

// Updated validation schema (removed productCode as it's auto-generated)
const CreateProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(10).max(1000),
  productType: z.enum(['chain', 'bracelet', 'anklet']),
  price: z.number().positive(),
  discountedPrice: z.number().positive().optional(),
  isActive: z.boolean().optional()
});

/**
 * Create new product with auto-generated product code
 * POST /api/admin/products
 */
export const createProduct = [
  upload.array('images', 5),
  async (req: Request, res: Response) => {
    try {
      // Validate request data (no productCode needed)
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
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one product image is required'
        });
      }

      // Create product (code will be auto-generated)
      const product = await ProductService.createProduct(validatedData, files);

      // Return success with generated product code
      res.status(201).json({
        success: true,
        message: `Product created successfully with code: ${product.productCode}`,
        data: {
          product: {
            ...product,
            imageCount: product.images.length
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
  }
];

/**
 * Get product by code
 * GET /api/products/:code
 */
export const getProductByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
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
  } catch (error) {
    console.error('Get product by code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
};

/**
 * Search products
 * GET /api/products/search?q=CH001
 */
export const searchProducts = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
};
```


## Updated Frontend Components

### Enhanced Product Creation Form

```typescript
// src/components/admin/CreateProduct.tsx (updated)
import React, { useState } from 'react';

interface CreateProductFormData {
  name: string;
  description: string;
  productType: 'chain' | 'bracelet' | 'anklet';
  price: number;
  discountedPrice?: number;
  isActive: boolean;
  images: File[];
}

export const CreateProduct: React.FC = () => {
  const [formData, setFormData] = useState<CreateProductFormData>({
    name: '',
    description: '',
    productType: 'chain',
    price: 0,
    discountedPrice: undefined,
    isActive: true,
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string>(''); // Show generated code

  // Preview what the product code will look like
  const getPreviewCode = () => {
    const prefixes = {
      chain: 'CH',
      bracelet: 'BR',
      anklet: 'AN'
    };
    return `${prefixes[formData.productType]}XXX (Auto-generated)`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add text fields (no productCode needed)
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('productType', formData.productType);
      formDataToSend.append('price', formData.price.toString());
      
      if (formData.discountedPrice) {
        formDataToSend.append('discountedPrice', formData.discountedPrice.toString());
      }
      
      formDataToSend.append('isActive', formData.isActive.toString());

      // Add image files
      formData.images.forEach(image => {
        formDataToSend.append('images', image);
      });

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formDataToSend
      });

      const result = await response.json();

      if (result.success) {
        const productCode = result.data.product.productCode;
        setGeneratedCode(productCode);
        
        alert(`Product created successfully!\nProduct Code: ${productCode}`);
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          productType: 'chain',
          price: 0,
          discountedPrice: undefined,
          isActive: true,
          images: []
        });
        setPreviewImages([]);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Product creation error:', error);
      alert('Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Create New Product</h2>

      {/* Product Code Preview */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Product Code (Auto-Generated)
            </label>
            <div className="text-lg font-mono text-blue-900">
              {getPreviewCode()}
            </div>
          </div>
          <div className="text-xs text-blue-600">
            ✨ Generated automatically
          </div>
        </div>
      </div>

      {/* Show generated code after creation */}
      {generatedCode && (
        <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center">
            <div className="text-green-600 mr-2">✅</div>
            <div>
              <span className="text-sm font-medium text-green-700">Created with code:</span>
              <div className="text-lg font-mono text-green-900">{generatedCode}</div>
            </div>
          </div>
        </div>
      )}

      {/* Product Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Butterfly Chain Necklace"
        />
      </div>

      {/* Product Type - affects code preview */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Type * (Affects Code Generation)
        </label>
        <select
          value={formData.productType}
          onChange={(e) => setFormData(prev => ({ ...prev, productType: e.target.value as any }))}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="chain">Chain (CH###)</option>
          <option value="bracelet">Bracelet (BR###)</option>
          <option value="anklet">Anklet (AN###)</option>
        </select>
      </div>

      {/* Rest of the form remains the same... */}
      {/* Description, Price, Images, etc. */}
      
      {/* Submit Button - updated text */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Creating Product & Generating Code...' : 'Create Product'}
      </button>
    </form>
  );
};
```


### Product Display Component

```typescript
// src/components/customer/ProductCard.tsx (updated)
import React from 'react';

interface Product {
  id: string;
  productCode: string; // New field
  name: string;
  description: string;
  productType: string;
  price: number;
  discountedPrice?: number;
  images: string[];
  isActive: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Product Image */}
      <div className="aspect-square relative">
        <img 
          src={product.images[0] || '/placeholder-jewelry.jpg'}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Product Code Badge */}
        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-mono">
          {product.productCode}
        </div>
        
        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
            SALE
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg">{product.name}</h3>
          <div className="text-xs text-gray-500 font-mono">
            #{product.productCode}
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Price Display */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {hasDiscount ? (
              <>
                <span className="text-lg font-bold text-red-600">
                  ${product.discountedPrice?.toFixed(2)}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  ${product.price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        {onAddToCart && (
          <button
            onClick={() => onAddToCart(product.id)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};
```


## API Routes Updates

### Enhanced Routes with Code Lookups

```typescript
// src/routes/public.routes.ts (updated)
import express from 'express';
import { getProducts, getProductByCode, searchProducts } from '../controllers/products.controller';

const router = express.Router();

// Product routes
router.get('/products', getProducts);
router.get('/products/search', searchProducts); // Search by code or name
router.get('/products/:code', getProductByCode); // Lookup by product code

export default router;
```


## Benefits of Auto-Generated Product Codes

### For Customers

- ✅ **Easy Reference**: "I want product CH001"
- ✅ **Search Friendly**: Quick product lookup
- ✅ **Professional**: Looks more business-like
- ✅ **WhatsApp Orders**: Easy to mention in messages


### For Admin

- ✅ **Inventory Management**: Quick product identification
- ✅ **Order Processing**: Clear product references
- ✅ **Analytics**: Easy product tracking
- ✅ **No Duplicates**: System ensures uniqueness


### For System

- ✅ **Database Efficiency**: Indexed for fast lookups
- ✅ **Scalable**: Handles growth automatically
- ✅ **Consistent**: Follows predictable pattern
- ✅ **User-Friendly**: Short and memorable


## Sample Product Codes Generated

```
Chain Products:     CH001, CH002, CH003, ...
Bracelet Products:  BR001, BR002, BR003, ...
Anklet Products:    AN001, AN002, AN003, ...

Or with business prefix:
JEW-CH-001, JEW-BR-002, JEW-AN-003, ...

Or with year:
2025-CH-001, 2025-BR-002, 2025-AN-003, ...
```

This implementation automatically generates user-friendly product codes when creating products, making your jewelry inventory system more professional and easier to manage for both customers and administrators!

