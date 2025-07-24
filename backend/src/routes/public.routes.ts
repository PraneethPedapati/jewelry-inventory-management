import { createOrder } from '../controllers/public/order.controller.js';
import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from 'zod-express-middleware';
import { asyncHandler } from '../middleware/error-handler.middleware.js';
import { orderRateLimit, publicApiRateLimit } from '../middleware/rate-limit.middleware.js';
import {
  getProducts,
  getProductById,
  getProductSpecifications,
  getProductTypes
} from '../controllers/public/product.controller.js';

const router = Router();

// Apply general rate limiting to all public routes
router.use(publicApiRateLimit);

// Public routes for customers
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.get('/products/:id/specifications', getProductSpecifications);
router.get('/product-types', getProductTypes);

// Order creation with stricter rate limiting and CAPTCHA
router.post('/orders', orderRateLimit, createOrder);

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
            accent: '#EC4899'
          }
        }
      ],
      message: 'Color themes available'
    }
  });
});

export default router; 
