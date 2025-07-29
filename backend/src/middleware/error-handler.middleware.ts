import { Request, Response, NextFunction } from 'express';
import { AppError, isOperationalError, formatErrorResponse } from '../utils/errors.js';
import { config } from '../config/app.js';
import { addSpanEvent } from '../utils/tracing.js';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details: any = null;

  // Log error with context
  const errorContext = {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  };

  console.error('Error occurred:', errorContext);

  // Add error event to current span if tracing is enabled
  if (config.ENABLE_TRACING) {
    addSpanEvent('error.occurred', {
      'error.type': error.constructor.name,
      'error.message': error.message,
      'http.status_code': statusCode,
    });
  }

  // Handle known application errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
    details = error.details;
  }
  // Handle validation errors (from Zod)
  else if (error.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
    details = (error as any).errors;
  }
  // Handle database errors
  else if (error.name === 'PostgresError') {
    const pgError = error as any;
    switch (pgError.code) {
      case '23505': // Unique violation
        statusCode = 409;
        message = 'Resource already exists';
        code = 'DUPLICATE_RESOURCE';
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Invalid reference to related resource';
        code = 'FOREIGN_KEY_VIOLATION';
        break;
      case '23502': // Not null violation
        statusCode = 400;
        message = 'Required field is missing';
        code = 'NOT_NULL_VIOLATION';
        break;
      case '23514': // Check constraint violation
        statusCode = 400;
        message = 'Data validation failed';
        code = 'CHECK_CONSTRAINT_VIOLATION';
        break;
      default:
        statusCode = 500;
        message = 'Database error occurred';
        code = 'DATABASE_ERROR';
    }
  }
  // Handle JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
    code = 'EXPIRED_TOKEN';
  }
  // Handle rate limiting errors
  else if (error.name === 'TooManyRequestsError') {
    statusCode = 429;
    message = 'Too many requests, please slow down';
    code = 'RATE_LIMIT_EXCEEDED';
  }
  // Handle multer errors (file upload)
  else if (error.name === 'MulterError') {
    statusCode = 400;
    const multerError = error as any;
    switch (multerError.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large';
        code = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        code = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        code = 'UNEXPECTED_FILE';
        break;
      default:
        message = 'File upload error';
        code = 'FILE_UPLOAD_ERROR';
    }
  }
  // Handle network/connection errors
  else if (error.name === 'ECONNREFUSED' || error.name === 'ENOTFOUND') {
    statusCode = 503;
    message = 'External service unavailable';
    code = 'SERVICE_UNAVAILABLE';
  }

  // Don't leak error details in production unless it's an operational error
  const isDevelopment = config.NODE_ENV === 'development';
  const shouldIncludeStack = isDevelopment && isOperationalError(error);

  const response = {
    success: false,
    error: message,
    code,
    ...(details && { details }),
    ...(shouldIncludeStack && { stack: error.stack }),
    ...(isDevelopment && {
      originalError: error.message,
      url: req.url,
      method: req.method
    })
  };

  res.status(statusCode).json(response);
};

/**
 * Wrapper for async route handlers to catch errors
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

// Validation error handler specifically for Zod
export const handleValidationError = (error: any): { statusCode: number; message: string; details: any } => {
  if (error.name === 'ZodError') {
    return {
      statusCode: 400,
      message: 'Validation failed',
      details: error.errors.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    };
  }

  return {
    statusCode: 500,
    message: 'Validation error',
    details: null
  };
}; 
