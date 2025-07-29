import { Request, Response, NextFunction } from 'express';

/**
 * Helper function to ensure async controller functions return a value
 * This fixes the TypeScript error "Not all code paths return a value"
 */
export const ensureReturn = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await fn(req, res, next);
      return result;
    } catch (error) {
      next(error);
      return;
    }
  };
};

/**
 * Helper function to wrap traceApiCall to ensure it returns a value
 */
export const traceApiCallWithReturn = (
  method: string,
  path: string,
  fn: () => Promise<any>
) => {
  return async () => {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      console.error(`API call failed: ${method} ${path}`, error);
      throw error;
    }
  };
};
