import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../../services/auth.service.js';
import { asyncHandler } from '../../middleware/error-handler.middleware.js';


// Validation schemas
const LoginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(1, 'Password is required'),
  })
});

const ChangePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  })
});

const CreateAdminSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    role: z.enum(['admin', 'super_admin']).optional(),
  })
});

const UpdateAdminSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(['admin', 'super_admin']).optional(),
  }),
  params: z.object({
    id: z.string().uuid('Valid admin ID is required'),
  })
});

/**
 * Admin login
 * POST /api/admin/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { body } = LoginSchema.parse({ body: req.body });

    const result = await AuthService.login(body);

    res.json({
      success: true,
      data: result,
      message: 'Login successful'
    });
});

/**
 * Get current admin profile
 * GET /api/admin/auth/profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.admin?.id;
    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const admin = await AuthService.getAdminById(adminId);

    res.json({
      success: true,
      data: admin
    });
});

/**
 * Change admin password
 * PUT /api/admin/auth/password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.admin?.id;
    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { body } = ChangePasswordSchema.parse({ body: req.body });

    // Validate new password strength
    const passwordValidation = AuthService.validatePasswordStrength(body.newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      });
    }

    await AuthService.changePassword(adminId, body.currentPassword, body.newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
});

/**
 * Create new admin user (super admin only)
 * POST /api/admin/auth/create-admin
 */
export const createAdmin = asyncHandler(async (req: Request, res: Response) => {
  // Check if current user is super admin
    if (req.admin?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Super admin privileges required'
      });
    }

    const { body } = CreateAdminSchema.parse({ body: req.body });

    // Validate password strength
    const passwordValidation = AuthService.validatePasswordStrength(body.password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      });
    }

    const newAdmin = await AuthService.createAdmin({
      ...body,
      role: body.role || 'admin'
    });

    res.status(201).json({
      success: true,
      data: newAdmin,
      message: 'Admin created successfully'
    });
});

/**
 * Update admin profile (super admin only)
 * PUT /api/admin/auth/admin/:id
 */
export const updateAdmin = asyncHandler(async (req: Request, res: Response) => {
  // Check if current user is super admin
    if (req.admin?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Super admin privileges required'
      });
    }

    const { body, params } = UpdateAdminSchema.parse({
      body: req.body,
      params: req.params
    });

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.role !== undefined) updateData.role = body.role;

    const updatedAdmin = await AuthService.updateAdmin(params.id, updateData);

    res.json({
      success: true,
      data: updatedAdmin,
      message: 'Admin updated successfully'
    });
});

/**
 * Validate password strength
 * POST /api/admin/auth/validate-password
 */
export const validatePassword = asyncHandler(async (req: Request, res: Response) => {
  const { password } = z.object({
      password: z.string()
    }).parse(req.body);

    const validation = AuthService.validatePasswordStrength(password);

    res.json({
      success: true,
      data: validation
    });
});

/**
 * Request password reset (for future implementation)
 * POST /api/admin/auth/request-reset
 */
export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
  const { email } = z.object({
      email: z.string().email()
    }).parse(req.body);

    const resetToken = await AuthService.generatePasswordResetToken(email);

    // In a real implementation, you would send this token via email
    // For now, we'll just return success (don't expose the token)
    res.json({
      success: true,
      message: 'Password reset instructions sent to email (if account exists)'
    });
});

/**
 * Logout (client-side token removal)
 * POST /api/admin/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Since we're using stateless JWT tokens, logout is handled client-side
    // In a more complex implementation, you might maintain a token blacklist

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
}); 
