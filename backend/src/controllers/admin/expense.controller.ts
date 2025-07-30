import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../../db/connection.js';
import { expenses, expenseCategories, admins } from '../../db/schema.js';
import { eq, desc, and, like, or, gte, lte, count } from 'drizzle-orm';
import { asyncHandler } from '../../middleware/error-handler.middleware.js';

// Validation schemas
const CreateExpenseSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    amount: z.number().positive('Amount must be positive'),
    categoryId: z.string().uuid('Valid category ID is required'),
    expenseDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
    receipt: z.string().optional(),
    tags: z.array(z.string()).optional()
  })
});

const UpdateExpenseSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    amount: z.number().positive().optional(),
    categoryId: z.string().uuid().optional(),
    expenseDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
    receipt: z.string().optional(),
    tags: z.array(z.string()).optional()
  }),
  params: z.object({
    id: z.string().uuid('Valid expense ID is required')
  })
});

/**
 * Get all expenses with filters
 * GET /api/admin/expenses
 */
export const getExpenses = asyncHandler(async (req: Request, res: Response) => {
  const {
    search,
    category,
    page = 1,
    limit = 10,
    dateFrom,
    dateTo
  } = req.query;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));
  const offset = (pageNum - 1) * limitNum;

  // Build query conditions
  const conditions = [];

  if (search && typeof search === 'string') {
    conditions.push(
      or(
        like(expenses.title, `%${search}%`),
        like(expenses.description, `%${search}%`)
      )
    );
  }

  if (category && typeof category === 'string') {
    conditions.push(eq(expenses.categoryId, category));
  }

  if (dateFrom && typeof dateFrom === 'string') {
    conditions.push(gte(expenses.expenseDate, new Date(dateFrom)));
  }

  if (dateTo && typeof dateTo === 'string') {
    conditions.push(lte(expenses.expenseDate, new Date(dateTo)));
  }

  // Get expenses with category details
  const expensesQuery = db
    .select({
      id: expenses.id,
      title: expenses.title,
      description: expenses.description,
      amount: expenses.amount,
      expenseDate: expenses.expenseDate,
      receipt: expenses.receipt,
      tags: expenses.tags,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
      category: {
        id: expenseCategories.id,
        name: expenseCategories.name,
        description: expenseCategories.description
      },
      addedBy: {
        id: admins.id,
        name: admins.name,
        email: admins.email
      }
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .leftJoin(admins, eq(expenses.addedBy, admins.id))
    .orderBy(desc(expenses.expenseDate))
    .limit(limitNum)
    .offset(offset);

  if (conditions.length > 0) {
    expensesQuery.where(and(...conditions));
  }

  const result = await expensesQuery;

  // Get total count
  const totalQuery = db
    .select({ count: count() })
    .from(expenses);

  if (conditions.length > 0) {
    totalQuery.where(and(...conditions));
  }

  const totalResult = await totalQuery;
  const totalCount = totalResult[0]?.count || 0;

  res.json({
    success: true,
    data: {
      expenses: result,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    },
    message: `Found ${result.length} expenses`
  });
});

/**
 * Get expense by ID
 * GET /api/admin/expenses/:id
 */
export const getExpenseById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Expense ID is required'
    });
  }

  const expense = await db
    .select({
      id: expenses.id,
      title: expenses.title,
      description: expenses.description,
      amount: expenses.amount,
      expenseDate: expenses.expenseDate,
      receipt: expenses.receipt,
      tags: expenses.tags,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
      category: {
        id: expenseCategories.id,
        name: expenseCategories.name,
        description: expenseCategories.description
      },
      addedBy: {
        id: admins.id,
        name: admins.name,
        email: admins.email
      }
    })
    .from(expenses)
    .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
    .leftJoin(admins, eq(expenses.addedBy, admins.id))
    .where(eq(expenses.id, id))
    .limit(1);

  if (!expense.length) {
    return res.status(404).json({
      success: false,
      error: 'Expense not found'
    });
  }

  res.json({
    success: true,
    data: expense[0],
    message: 'Expense retrieved successfully'
  });
});

/**
 * Create new expense
 * POST /api/admin/expenses
 */
export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const { body } = CreateExpenseSchema.parse({ body: req.body });

  // Verify category exists
  const category = await db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.id, body.categoryId))
    .limit(1);

  if (!category.length) {
    return res.status(400).json({
      success: false,
      error: 'Invalid expense category'
    });
  }

  // Get admin ID from authenticated user
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  const adminId = req.admin.id;

  const newExpense = await db
    .insert(expenses)
    .values({
      title: body.title,
      description: body.description || null,
      amount: body.amount.toString(),
      categoryId: body.categoryId,
      expenseDate: new Date(body.expenseDate),
      receipt: body.receipt || null,
      tags: body.tags || [],
      addedBy: adminId
    })
    .returning();

  res.status(201).json({
    success: true,
    data: newExpense[0],
    message: 'Expense created successfully'
  });
});

/**
 * Update expense
 * PUT /api/admin/expenses/:id
 */
export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
  const { body, params } = UpdateExpenseSchema.parse({ body: req.body, params: req.params });

  const existingExpense = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, params.id))
    .limit(1);

  if (!existingExpense.length) {
    return res.status(404).json({
      success: false,
      error: 'Expense not found'
    });
  }

  // Verify category if provided
  if (body.categoryId) {
    const category = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.id, body.categoryId))
      .limit(1);

    if (!category.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid expense category'
      });
    }
  }

  // Build update data
  const updateData: any = {
    updatedAt: new Date()
  };

  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.amount !== undefined) updateData.amount = body.amount.toString();
  if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
  if (body.expenseDate !== undefined) updateData.expenseDate = new Date(body.expenseDate);
  if (body.receipt !== undefined) updateData.receipt = body.receipt;
  if (body.tags !== undefined) updateData.tags = body.tags;

  const updatedExpense = await db
    .update(expenses)
    .set(updateData)
    .where(eq(expenses.id, params.id))
    .returning();

  res.json({
    success: true,
    data: updatedExpense[0],
    message: 'Expense updated successfully'
  });
});

/**
 * Delete expense
 * DELETE /api/admin/expenses/:id
 */
export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Expense ID is required'
    });
  }

  const existingExpense = await db
    .select()
    .from(expenses)
    .where(eq(expenses.id, id))
    .limit(1);

  if (!existingExpense.length) {
    return res.status(404).json({
      success: false,
      error: 'Expense not found'
    });
  }

  await db.delete(expenses).where(eq(expenses.id, id));

  res.json({
    success: true,
    message: 'Expense deleted successfully'
  });
});

/**
 * Get expense categories
 * GET /api/admin/expenses/categories
 */
export const getExpenseCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await db
    .select()
    .from(expenseCategories)
    .where(eq(expenseCategories.isActive, true))
    .orderBy(expenseCategories.name);

  res.json({
    success: true,
    data: categories,
    message: `Found ${categories.length} categories`
  });
});

/**
 * Get expense statistics
 * GET /api/admin/expenses/stats
 */
export const getExpenseStats = asyncHandler(async (req: Request, res: Response) => {
  const { period = 'month' } = req.query;

  // Get total expenses
  const totalExpenses = await db
    .select({
      categoryId: expenses.categoryId,
      amount: expenses.amount,
      expenseDate: expenses.expenseDate
    })
    .from(expenses);

  // Calculate totals by category
  const categoryTotals = totalExpenses.reduce((acc: any, expense) => {
    const categoryId = expense.categoryId;
    const amount = parseFloat(expense.amount);

    if (!acc[categoryId]) {
      acc[categoryId] = 0;
    }
    acc[categoryId] += amount;

    return acc;
  }, {});

  // Get category names
  const categories = await db
    .select()
    .from(expenseCategories);

  const categoryStats = categories.map(category => ({
    categoryId: category.id,
    categoryName: category.name,
    totalAmount: categoryTotals[category.id] || 0
  }));

  const grandTotal = totalExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  res.json({
    success: true,
    data: {
      totalExpenses: grandTotal,
      totalCount: totalExpenses.length,
      categoryBreakdown: categoryStats
    },
    message: 'Expense statistics retrieved successfully'
  });
}); 
