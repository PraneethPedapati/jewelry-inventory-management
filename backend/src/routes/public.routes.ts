import { Router } from 'express';
import { createOrder } from '@/controllers/public/order.controller.js';
import { orderRateLimit, publicApiRateLimit } from '@/middleware/rate-limit.middleware.js';

const router = Router();

// Apply general rate limiting to all public routes
router.use(publicApiRateLimit);

// Public routes for customers
router.get('/products', (req, res) => {
  res.json({
    success: true,
    data: {
      products: [],
      message: 'Product catalog - implementation in progress'
    }
  });
});

router.get('/products/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      product: null,
      message: `Product ${req.params.id} - implementation in progress`
    }
  });
});

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
