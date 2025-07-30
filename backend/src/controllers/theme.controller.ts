import { Request, Response } from 'express';
import { db } from '../db/connection';
import { colorThemes } from '../db/schema';
import { eq } from 'drizzle-orm';
import { asyncHandler } from '../middleware/error-handler.middleware';

/**
 * Get all color themes
 * GET /api/themes
 */
export const getThemes = asyncHandler(async (req: Request, res: Response) => {
  try {
    const themes = await db.select().from(colorThemes);

    res.json({
      success: true,
      data: themes,
      message: `Found ${themes.length} color themes`
    });
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch themes',
      message: 'Database connection error'
    });
  }
});

/**
 * Get active theme
 * GET /api/themes/active
 */
export const getActiveTheme = asyncHandler(async (req: Request, res: Response) => {
  try {
    const activeTheme = await db.select()
      .from(colorThemes)
      .where(eq(colorThemes.isActive, true))
      .limit(1);

    if (activeTheme.length === 0) {
      // Fallback to default theme
      const defaultTheme = await db.select()
        .from(colorThemes)
        .where(eq(colorThemes.isDefault, true))
        .limit(1);

      res.json({
        success: true,
        data: defaultTheme[0] || null,
        message: 'Using default theme (no active theme found)'
      });
      return;
    }

    res.json({
      success: true,
      data: activeTheme[0],
      message: 'Active theme retrieved'
    });
  } catch (error) {
    console.error('Error fetching active theme:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active theme'
    });
  }
});

/**
 * Set active theme
 * POST /api/themes/activate
 */
export const setActiveTheme = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { themeId } = req.body;

    if (!themeId) {
      res.status(400).json({
        success: false,
        error: 'Theme ID is required'
      });
      return;
    }

    // First, deactivate all themes
    await db.update(colorThemes)
      .set({ isActive: false });

    // Then activate the selected theme
    const updatedTheme = await db.update(colorThemes)
      .set({ isActive: true })
      .where(eq(colorThemes.id, themeId))
      .returning();

    if (updatedTheme.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Theme not found'
      });
      return;
    }

    res.json({
      success: true,
      data: updatedTheme[0],
      message: `Theme "${updatedTheme[0]?.displayName || 'Unknown'}" activated successfully`
    });
  } catch (error) {
    console.error('Error setting active theme:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set active theme'
    });
  }
}); 
