import { hash, verify } from 'argon2';
import { SignJWT } from 'jose';
import { db } from '@/db/connection.js';
import { admins } from '@/db/schema.js';
import { eq } from 'drizzle-orm';
import { config } from '@/config/app.js';
import {
  InvalidCredentialsError,
  UnauthorizedError,
  NotFoundError
} from '@/utils/errors.js';
import { traceBusinessLogic } from '@/utils/tracing.js';
import type { AdminLoginRequest, AdminLoginResponse, Admin } from '@/types/api.js';

export class AuthService {
  /**
   * Authenticate admin user with email and password
   */
  static async login(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
    return traceBusinessLogic('admin_login', async () => {
      const { email, password } = credentials;

      // Find admin by email
      const [admin] = await db
        .select()
        .from(admins)
        .where(eq(admins.email, email))
        .limit(1);

      if (!admin) {
        throw new InvalidCredentialsError();
      }

      // Verify password
      const isValidPassword = await verify(admin.passwordHash, password);
      if (!isValidPassword) {
        throw new InvalidCredentialsError();
      }

      // Update last login timestamp
      await db
        .update(admins)
        .set({ lastLogin: new Date() })
        .where(eq(admins.id, admin.id));

      // Generate JWT token
      const token = await this.generateToken(admin.id);

      return {
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
        expiresIn: 24 * 60 * 60, // 24 hours in seconds
      };
    });
  }

  /**
   * Generate JWT token for admin
   */
  private static async generateToken(adminId: string): Promise<string> {
    const secret = new TextEncoder().encode(config.JWT_SECRET);

    const token = await new SignJWT({
      type: 'admin_access',
      scope: 'admin'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('jewelry-inventory-api')
      .setSubject(adminId)
      .setExpirationTime(config.JWT_EXPIRATION)
      .sign(secret);

    return token;
  }

  /**
   * Hash password using Argon2
   */
  static async hashPassword(password: string): Promise<string> {
    return hash(password, {
      type: 2, // Argon2id
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await verify(hashedPassword, password);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get admin by ID
   */
  static async getAdminById(adminId: string): Promise<Admin> {
    return traceBusinessLogic('get_admin_by_id', async () => {
      const [admin] = await db
        .select({
          id: admins.id,
          name: admins.name,
          email: admins.email,
          role: admins.role,
        })
        .from(admins)
        .where(eq(admins.id, adminId))
        .limit(1);

      if (!admin) {
        throw new NotFoundError('Admin');
      }

      return admin;
    });
  }

  /**
   * Create new admin user (for super admin functionality)
   */
  static async createAdmin(adminData: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }): Promise<Admin> {
    return traceBusinessLogic('create_admin', async () => {
      const { email, password, name, role = 'admin' } = adminData;

      // Check if admin with email already exists
      const [existingAdmin] = await db
        .select()
        .from(admins)
        .where(eq(admins.email, email))
        .limit(1);

      if (existingAdmin) {
        throw new Error('Admin with this email already exists');
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Create admin
      const [newAdmin] = await db
        .insert(admins)
        .values({
          email,
          passwordHash,
          name,
          role,
        })
        .returning({
          id: admins.id,
          name: admins.name,
          email: admins.email,
          role: admins.role,
        });

      return newAdmin;
    });
  }

  /**
   * Update admin profile
   */
  static async updateAdmin(adminId: string, updates: {
    name?: string;
    email?: string;
    role?: string;
  }): Promise<Admin> {
    return traceBusinessLogic('update_admin', async () => {
      // Check if admin exists
      const existingAdmin = await this.getAdminById(adminId);

      // If email is being updated, check for conflicts
      if (updates.email && updates.email !== existingAdmin.email) {
        const [emailConflict] = await db
          .select()
          .from(admins)
          .where(eq(admins.email, updates.email))
          .limit(1);

        if (emailConflict) {
          throw new Error('Email already in use by another admin');
        }
      }

      // Update admin
      const [updatedAdmin] = await db
        .update(admins)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(admins.id, adminId))
        .returning({
          id: admins.id,
          name: admins.name,
          email: admins.email,
          role: admins.role,
        });

      return updatedAdmin;
    });
  }

  /**
   * Change admin password
   */
  static async changePassword(
    adminId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    return traceBusinessLogic('change_admin_password', async () => {
      // Get current admin
      const [admin] = await db
        .select()
        .from(admins)
        .where(eq(admins.id, adminId))
        .limit(1);

      if (!admin) {
        throw new NotFoundError('Admin');
      }

      // Verify current password
      const isValidPassword = await verify(admin.passwordHash, currentPassword);
      if (!isValidPassword) {
        throw new InvalidCredentialsError();
      }

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update password
      await db
        .update(admins)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(admins.id, adminId));
    });
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate password reset token (for future implementation)
   */
  static async generatePasswordResetToken(email: string): Promise<string> {
    return traceBusinessLogic('generate_password_reset_token', async () => {
      // Check if admin exists
      const [admin] = await db
        .select()
        .from(admins)
        .where(eq(admins.email, email))
        .limit(1);

      if (!admin) {
        throw new NotFoundError('Admin');
      }

      // Generate reset token (expires in 1 hour)
      const secret = new TextEncoder().encode(config.JWT_SECRET);
      const resetToken = await new SignJWT({
        type: 'password_reset',
        email: admin.email
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('jewelry-inventory-api')
        .setSubject(admin.id)
        .setExpirationTime('1h')
        .sign(secret);

      return resetToken;
    });
  }
} 
