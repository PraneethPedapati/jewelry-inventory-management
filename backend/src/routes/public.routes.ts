import { createOrder } from '../controllers/public/order.controller.js';
import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from 'zod-express-middleware';
import { asyncHandler } from '../middleware/error-handler.middleware.js';
import { orderRateLimit, publicApiRateLimit } from '../middleware/rate-limit.middleware.js';
import {
  getProducts,
  getProductById,
  getProductTypes
} from '../controllers/public/product.controller.js';
import { getBrandConfig } from '../services/brand.service.js';

const router = Router();

// Apply general rate limiting to all public routes
router.use(publicApiRateLimit);

// Public routes for customers
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.get('/product-types', getProductTypes);

// Order creation with stricter rate limiting and CAPTCHA
router.post('/orders', orderRateLimit, createOrder);

// Brand configuration endpoint
router.get('/brand-config', (req, res) => {
  const brandConfig = getBrandConfig();
  res.json(brandConfig);
});

router.get('/themes', (req, res) => {
  res.json({
    success: true,
    data: {
      themes: [
        {
          id: 'default',
          name: 'default',
          displayName: 'Default Jewelry Theme',
          isActive: true,
          colors: {
            primary: '#8B5CF6',
            secondary: '#F59E0B',
            accent: '#EC4899',
            background: '#FFFFFF',
            foreground: '#1F2937',
            card: '#F9FAFB',
            cardForeground: '#111827',
            border: '#E5E7EB',
            input: '#FFFFFF',
            ring: '#8B5CF6',
            muted: '#F3F4F6',
            mutedForeground: '#6B7280',
            destructive: '#EF4444',
            destructiveForeground: '#FFFFFF',
            success: '#10B981',
            successForeground: '#FFFFFF',
            warning: '#F59E0B',
            warningForeground: '#FFFFFF'
          }
        }
      ],
      message: 'Color themes available'
    }
  });
});

export default router;
