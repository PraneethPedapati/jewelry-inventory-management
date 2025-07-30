import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import rateLimit from 'express-rate-limit';
import { db } from '../db/connection';
import { admins } from '../db/schema';
import { eq } from 'drizzle-orm';
import { config } from '../config/app';
import { UnauthorizedError, ForbiddenError, RateLimitError } from '../utils/errors';
import { addSpanAttributes } from '../utils/tracing';

// Extend Request interface for TypeScript
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        role: string;
        name: string;
      };
    }
  }
}

// JWT Authentication middleware
export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token required');
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new UnauthorizedError('Authentication token required');
    }

    // Verify JWT token
    const secret = new TextEncoder().encode(config.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new UnauthorizedError('Invalid token payload');
    }

    // Verify admin still exists and is active
    const [admin] = await db
      .select({
        id: admins.id,
        email: admins.email,
        role: admins.role,
        name: admins.name,
      })
      .from(admins)
      .where(eq(admins.id, payload.sub))
      .limit(1);

    if (!admin) {
      throw new UnauthorizedError('Admin account not found');
    }

    // Add admin info to request
    req.admin = {
      id: admin.id,
      email: admin.email,
      role: admin.role || 'admin', // Provide default role if null
      name: admin.name,
    };

    // Add tracing attributes if enabled
    if (config.ENABLE_TRACING) {
      addSpanAttributes({
        'user.id': admin.id,
        'user.email': admin.email,
        'user.role': admin.role || 'admin',
      });
    }

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid authentication token'));
    }
  }
};

// Role-based authorization middleware
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.admin.role !== requiredRole && req.admin.role !== 'super_admin') {
      throw new ForbiddenError(`${requiredRole} role required`);
    }

    next();
  };
};

// Optional authentication (for endpoints that work with or without auth)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      // Try to authenticate but don't fail if invalid
      await authenticateAdmin(req, res, next);
    } else {
      next();
    }
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

// Rate limiting configurations
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    error: 'Too many login attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    next(new RateLimitError(Math.ceil(options.windowMs / 1000)));
  }
});

export const apiRateLimit = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many requests, please slow down',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    next(new RateLimitError(Math.ceil(options.windowMs / 1000)));
  }
});

// Stricter rate limit for admin operations
export const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // 100 requests per 5 minutes for admin operations
  message: {
    success: false,
    error: 'Too many admin requests, please slow down',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    next(new RateLimitError(Math.ceil(options.windowMs / 1000)));
  }
});

// File upload rate limiting
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  message: {
    success: false,
    error: 'Too many file uploads, please slow down',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    next(new RateLimitError(Math.ceil(options.windowMs / 1000)));
  }
});

// WhatsApp operation rate limiting
export const whatsappRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 WhatsApp operations per 10 minutes
  message: {
    success: false,
    error: 'Too many WhatsApp operations, please slow down',
    code: 'WHATSAPP_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    next(new RateLimitError(Math.ceil(options.windowMs / 1000)));
  }
});

// IP-based blocking for suspected attacks
export const createIpRateLimit = (windowMs: number, max: number, blockDurationMs: number = 60 * 60 * 1000) => {
  const blockedIPs = new Map<string, number>();

  return rateLimit({
    windowMs,
    max,
    handler: (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();

      // Block IP temporarily
      blockedIPs.set(clientIP, now + blockDurationMs);

      // Clean up old blocked IPs
      for (const [ip, blockUntil] of blockedIPs.entries()) {
        if (now > blockUntil) {
          blockedIPs.delete(ip);
        }
      }

      next(new RateLimitError(Math.ceil(blockDurationMs / 1000)));
    },
    skip: (req) => {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const blockUntil = blockedIPs.get(clientIP);

      if (blockUntil && Date.now() < blockUntil) {
        return false; // Don't skip, IP is blocked
      }

      return false; // Process normally
    }
  });
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // API-specific headers
  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }

  next();
}; 
