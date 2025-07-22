import { Router } from 'express';
import { login, getProfile, changePassword } from '@/controllers/admin/auth.controller.js';
import { authenticateAdmin, authRateLimit } from '@/middleware/auth.middleware.js';

const router = Router();

// Auth routes
router.post('/auth/login', authRateLimit, login);
router.get('/auth/profile', authenticateAdmin, getProfile);
router.put('/auth/password', authenticateAdmin, changePassword);

// Placeholder for other admin routes
router.get('/dashboard', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Admin dashboard - implementation in progress',
      admin: req.admin
    }
  });
});

export default router; 
