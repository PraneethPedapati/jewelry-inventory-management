import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { systemConfigs } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { asyncHandler } from '../middleware/error-handler.middleware.js';

// Validation schema for brand configuration
const BrandConfigSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyShortName: z.string().min(1, 'Short name is required'),
  logoUrl: z.string().url('Valid logo URL is required'),
  logoAlt: z.string().min(1, 'Logo alt text is required'),
  faviconUrl: z.string().url('Valid favicon URL is required'),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Valid hex color is required'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Valid hex color is required'),
  description: z.string().min(1, 'Description is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().min(1, 'Contact phone is required'),
  website: z.string().url('Valid website URL is required')
});

/**
 * Get brand configuration
 * GET /api/config/brand
 */
export const getBrandConfig = asyncHandler(async (req: Request, res: Response) => {
  const brandConfigs = await db
    .select()
    .from(systemConfigs)
    .where(eq(systemConfigs.key, 'brand_config'));

  if (brandConfigs.length === 0) {
    // Return default configuration if none exists
    const defaultConfig = {
      companyName: 'Elegant Jewelry Store',
      companyShortName: 'EJS',
      logoUrl: '/logo.png',
      logoAlt: 'Elegant Jewelry Store Logo',
      faviconUrl: '/favicon.ico',
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      description: 'Premium jewelry collection with elegant designs',
      contactEmail: 'info@elegantjewelry.com',
      contactPhone: '+91-9876543210',
      website: 'https://elegantjewelry.com'
    };

    return res.json(defaultConfig);
  }

  const config = JSON.parse(brandConfigs[0]?.value as string);
  res.json(config);
});

/**
 * Update brand configuration
 * POST /api/config/brand
 */
export const updateBrandConfig = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = BrandConfigSchema.parse(req.body);

  // Check if brand config already exists
  const existingConfig = await db
    .select()
    .from(systemConfigs)
    .where(eq(systemConfigs.key, 'brand_config'));

  if (existingConfig.length > 0) {
    // Update existing configuration
    await db
      .update(systemConfigs)
      .set({
        value: JSON.stringify(validatedData),
        updatedAt: new Date()
      })
      .where(eq(systemConfigs.key, 'brand_config'));
  } else {
    // Create new configuration
    await db.insert(systemConfigs).values({
      key: 'brand_config',
      value: JSON.stringify(validatedData),
      description: 'Brand configuration for the jewelry store'
    });
  }

  res.json({
    message: 'Brand configuration updated successfully',
    config: validatedData
  });
});

/**
 * Reset brand configuration to default
 * DELETE /api/config/brand
 */
export const resetBrandConfig = asyncHandler(async (req: Request, res: Response) => {
  const defaultConfig = {
    companyName: 'Elegant Jewelry Store',
    companyShortName: 'EJS',
    logoUrl: '/logo.png',
    logoAlt: 'Elegant Jewelry Store Logo',
    faviconUrl: '/favicon.ico',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    description: 'Premium jewelry collection with elegant designs',
    contactEmail: 'info@elegantjewelry.com',
    contactPhone: '+91-9876543210',
    website: 'https://elegantjewelry.com'
  };

  // Check if brand config exists
  const existingConfig = await db
    .select()
    .from(systemConfigs)
    .where(eq(systemConfigs.key, 'brand_config'));

  if (existingConfig.length > 0) {
    // Update to default
    await db
      .update(systemConfigs)
      .set({
        value: JSON.stringify(defaultConfig),
        updatedAt: new Date()
      })
      .where(eq(systemConfigs.key, 'brand_config'));
  } else {
    // Create default configuration
    await db.insert(systemConfigs).values({
      key: 'brand_config',
      value: JSON.stringify(defaultConfig),
      description: 'Brand configuration for the jewelry store'
    });
  }

  res.json({
    message: 'Brand configuration reset to default',
    config: defaultConfig
  });
}); 
