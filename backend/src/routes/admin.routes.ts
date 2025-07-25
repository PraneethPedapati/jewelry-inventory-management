import { Router } from 'express';
import { login, getProfile, changePassword } from '../controllers/admin/auth.controller.js';
import { getDashboardStats } from '../controllers/admin/dashboard.controller.js';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories
} from '../controllers/admin/product.controller.js';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderStats,
  exportOrders,
  approveOrder,
  sendPaymentQR,
  confirmPayment,
  sendWhatsAppMessage
} from '../controllers/admin/order.controller.js';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  getExpenseStats
} from '../controllers/admin/expense.controller.js';
import { getAnalytics, refreshAnalytics, getAnalyticsStatus } from '../controllers/admin/analytics.controller.js';
import { authenticateAdmin, authRateLimit } from '../middleware/auth.middleware.js';

const router = Router();

// Auth routes
router.post('/auth/login', authRateLimit, login);
router.get('/auth/profile', authenticateAdmin, getProfile);
router.post('/auth/change-password', authenticateAdmin, changePassword);

// Dashboard routes
router.get('/dashboard', authenticateAdmin, getDashboardStats);

// Product routes
router.get('/products', getProducts);
router.get('/products/categories', getProductCategories);
router.get('/products/:id', getProductById);
router.post('/products', authenticateAdmin, createProduct);
router.put('/products/:id', authenticateAdmin, updateProduct);
router.delete('/products/:id', authenticateAdmin, deleteProduct);

// Order routes
router.get('/orders', authenticateAdmin, getOrders);
router.get('/orders/stats', authenticateAdmin, getOrderStats);
router.get('/orders/export', authenticateAdmin, exportOrders);
router.get('/orders/:id', authenticateAdmin, getOrderById);
router.post('/orders', authenticateAdmin, createOrder);
router.put('/orders/:id', authenticateAdmin, updateOrder);
router.delete('/orders/:id', authenticateAdmin, deleteOrder);

// Order management routes with new hybrid functionality
router.post('/orders/:id/approve', authenticateAdmin, approveOrder);
router.post('/orders/:id/send-payment-qr', authenticateAdmin, sendPaymentQR);
router.post('/orders/:id/confirm-payment', authenticateAdmin, confirmPayment);
router.post('/orders/:id/send-whatsapp', authenticateAdmin, sendWhatsAppMessage);

// Expense routes
router.get('/expenses', getExpenses);
router.get('/expenses/categories', getExpenseCategories);
router.get('/expenses/stats', getExpenseStats);
router.get('/expenses/:id', getExpenseById);
router.post('/expenses', authenticateAdmin, createExpense);
router.put('/expenses/:id', authenticateAdmin, updateExpense);
router.delete('/expenses/:id', authenticateAdmin, deleteExpense);

// Analytics routes
router.get('/analytics', authenticateAdmin, getAnalytics);
router.post('/analytics/refresh', authenticateAdmin, refreshAnalytics);
router.get('/analytics/status', authenticateAdmin, getAnalyticsStatus);

export default router; 
