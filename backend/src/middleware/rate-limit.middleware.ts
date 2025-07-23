import rateLimit from 'express-rate-limit';

// Rate limit for order creation - 5 orders per hour per IP
export const orderRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Maximum 5 orders per hour per IP
  message: {
    success: false,
    error: 'Too many orders from this IP. Please try again after an hour.',
    resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, not just failed ones
  skip: (req) => {
    // Skip rate limiting for admin routes or if explicitly disabled
    return process.env.NODE_ENV === 'development' && req.headers['x-skip-rate-limit'] === 'true';
  }
});

// General rate limit for public APIs - 100 requests per 15 minutes
export const publicApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum 100 requests per 15 minutes per IP
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again later.',
    resetTime: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limit for sensitive operations - 3 attempts per 5 minutes
export const strictRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Maximum 3 attempts per 5 minutes per IP
  message: {
    success: false,
    error: 'Too many attempts. Please try again in 5 minutes.',
    resetTime: new Date(Date.now() + 5 * 60 * 1000).toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
}); 
