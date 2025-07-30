import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/error-handler.middleware';
import { DashboardWidgetService } from '../../services/dashboard-widget.service';

/**
 * Get all dashboard widgets data
 * GET /api/admin/dashboard/widgets
 */
export const getDashboardWidgets = asyncHandler(async (req: Request, res: Response) => {
  try {
    const widgetsData = await DashboardWidgetService.getAllWidgets();

    res.json({
      success: true,
      data: widgetsData,
      message: 'Dashboard widgets data retrieved successfully'
    });
  } catch (error) {
    console.error('Failed to get dashboard widgets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard widgets data'
    });
  }
});

/**
 * Refresh all cached widgets
 * POST /api/admin/dashboard/widgets/refresh
 */
export const refreshDashboardWidgets = asyncHandler(async (req: Request, res: Response) => {
  try {
    await DashboardWidgetService.refreshAllCachedWidgets();

    // Get fresh data after refresh
    const widgetsData = await DashboardWidgetService.getAllWidgets();

    res.json({
      success: true,
      data: widgetsData,
      message: 'Dashboard widgets refreshed successfully'
    });
  } catch (error) {
    console.error('Failed to refresh dashboard widgets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh dashboard widgets'
    });
  }
});

/**
 * Debug endpoint to test average product value
 * GET /api/admin/dashboard/debug/aov
 */
export const debugAverageProductValue = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Clear cache first
    await DashboardWidgetService.clearCache();

    // Test the calculation
    const result = await DashboardWidgetService.getAverageProductValue();

    res.json({
      success: true,
      data: result,
      message: 'Average product value calculated successfully'
    });
  } catch (error) {
    console.error('Failed to calculate average product value:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate average product value'
    });
  }
}); 
