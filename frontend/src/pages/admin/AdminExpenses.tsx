import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Search, Edit, Trash2, TrendingUp, DollarSign, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { expenseService, type Expense, type ExpenseCategory, type CreateExpenseRequest } from '@/services/api';
import { toast } from 'sonner';

const AdminExpenses: React.FC = () => {
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // API state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [expenseStats, setExpenseStats] = useState<{
    totalExpenses: number;
    monthlyExpenses: number;
    categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  } | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage] = useState(10);

  // Load expenses from API
  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const params: {
        search?: string;
        category?: string;
        page?: number;
        limit?: number;
      } = {
        page: currentPage,
        limit: itemsPerPage
      };

      if (searchTerm) params.search = searchTerm;
      // if (filterCategory !== 'All') params.category = filterCategory; // This line was removed

      const data = await expenseService.getExpenses(params);
      setExpenses(data.expenses);
      setTotalPages(data.pagination.totalPages);
      // setTotalExpenses(data.pagination.total); // This line was removed
    } catch (error) {
      console.error('Failed to load expenses:', error);
      toast.error('Failed to load expenses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load expense categories
  const loadExpenseCategories = async () => {
    try {
      const categories = await expenseService.getExpenseCategories();
      setExpenseCategories(categories);
    } catch (error) {
      console.error('Failed to load expense categories:', error);
      toast.error('Failed to load expense categories.');
    }
  };

  // Load expense statistics
  const loadExpenseStats = async () => {
    try {
      const stats = await expenseService.getExpenseStats();
      setExpenseStats(stats);
    } catch (error) {
      console.error('Failed to load expense statistics:', error);
      toast.error('Failed to load expense statistics.');
    }
  };

  // Load expenses on component mount and when filters change
  useEffect(() => {
    loadExpenses();
  }, [searchTerm, currentPage]); // Removed filterCategory from dependency array

  // Load categories and statistics on component mount
  useEffect(() => {
    loadExpenseCategories();
    loadExpenseStats();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm]); // Removed filterCategory from dependency array

  const handleCreateExpense = async (expenseData: { description: string; amount: string; category: string; date: string }) => {
    try {
      setCreating(true);
      const createData: CreateExpenseRequest = {
        title: expenseData.description,
        description: expenseData.description,
        amount: parseFloat(expenseData.amount),
        categoryId: expenseData.category,
        expenseDate: expenseData.date
      };

      await expenseService.createExpense(createData);
      toast.success('Expense created successfully!');
      setShowForm(false);
      await Promise.all([loadExpenses(), loadExpenseStats()]); // Refresh the list and stats
    } catch (error) {
      console.error('Failed to create expense:', error);
      toast.error('Failed to create expense. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    // setFormData({ // This line was removed
    //   description: expense.title || '',
    //   amount: expense.amount,
    //   category: expense.categoryId,
    //   date: expense.expenseDate
    // });
    setShowForm(true);
  };

  const handleUpdateExpense = async (expenseData: { description: string; amount: string; category: string; date: string }) => {
    if (!editingExpense) return;

    try {
      setUpdating(true);
      const updateData: Partial<CreateExpenseRequest> = {
        title: expenseData.description,
        description: expenseData.description,
        amount: parseFloat(expenseData.amount),
        categoryId: expenseData.category,
        expenseDate: expenseData.date
      };

      await expenseService.updateExpense(editingExpense.id, updateData);
      toast.success('Expense updated successfully!');
      setShowForm(false);
      setEditingExpense(null);
      await Promise.all([loadExpenses(), loadExpenseStats()]); // Refresh the list and stats
    } catch (error) {
      console.error('Failed to update expense:', error);
      toast.error('Failed to update expense. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Calculate statistics from backend data
  const totalAmount = expenseStats?.totalExpenses || 0;
  const totalTransactions = expenses.length;
  const avgExpense = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

  // Calculate unique categories that actually have expenses
  const categoriesWithExpenses = expenseStats?.categoryBreakdown?.length || 0;

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteExpense = (expense: Expense) => {
    // Implementation for delete functionality
    console.log('Delete expense:', expense.id);
  };

  if (isLoading && expenses.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading expenses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6" />
            Expense Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track and manage business expenses
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={creating} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Enhanced Expense Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card className="bg-brand-bg border-brand-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-brand-primary rounded-2xl">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-brand-primary">₹{totalAmount.toLocaleString('en-IN')}</div>
              <div className="text-xs text-brand-medium font-medium">Total</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-shade mb-1">Total Expenses</h3>
            <p className="text-xs text-brand-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {totalTransactions} transactions
            </p>
          </div>
        </Card>

        <Card className="bg-brand-bg border-brand-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-brand-primary rounded-2xl">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-brand-primary">₹{avgExpense.toLocaleString('en-IN')}</div>
              <div className="text-xs text-brand-medium font-medium">Average</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-shade mb-1">Average Expense</h3>
            <p className="text-xs text-brand-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Per transaction
            </p>
          </div>
        </Card>

        <Card className="bg-brand-bg border-brand-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-brand-primary rounded-2xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-brand-primary">{totalTransactions}</div>
              <div className="text-xs text-brand-medium font-medium">Total</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-shade mb-1">Total Transactions</h3>
            <p className="text-xs text-brand-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              All time
            </p>
          </div>
        </Card>

        <Card className="bg-brand-bg border-brand-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-brand-primary rounded-2xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-brand-primary">{categoriesWithExpenses}</div>
              <div className="text-xs text-brand-medium font-medium">Categories</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-shade mb-1">Categories Used</h3>
            <p className="text-xs text-brand-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              With expenses
            </p>
          </div>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search expenses..."
            className="pl-10 h-10 w-full"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading expenses...</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id} className="hover:shadow-md hover:scale-[1.02] transition-all duration-200 border-l-4 border-l-primary">
              <CardContent className="pt-6 pb-5 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Receipt className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-xl text-foreground">{expense.title}</h3>
                              <Badge variant="secondary" className="font-medium px-2 py-0.5">
                                {expense.category?.name || expense.categoryId}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatDate(expense.expenseDate)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-xl text-primary">{formatCurrency(expense.amount)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditExpense(expense)}
                      disabled={updating}
                      className="h-9 px-3 hover:bg-primary/10 w-28"
                    >
                      <Edit className="w-4 h-4 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteExpense(expense)}
                      disabled={updating}
                      className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 w-28"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {/* Show message when no expenses found */}
        {expenses.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No expenses found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first expense.'}
            </p>
            <Button onClick={() => setShowForm(true)} disabled={creating}>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="h-8 px-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={isLoading}
                  className="h-10 w-10"
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="h-8 px-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {/* <ConfirmationDialog // This component was removed
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setExpenseToDelete(null);
        }}
        onConfirm={confirmDeleteExpense}
        title="Delete Expense"
        description={`Are you sure you want to delete "${expenseToDelete?.title}"? This action cannot be undone and will permanently remove this expense record.`}
        confirmText={deleting ? "Deleting..." : "Delete Expense"}
        cancelText="Cancel"
        variant="destructive"
        confirmButtonVariant="destructive"
      /> */}

      {/* Create Expense Modal */}
      {showForm && (
        <ExpenseModal
          mode="create"
          onSave={handleCreateExpense}
          onClose={() => setShowForm(false)}
          categories={expenseCategories}
          saving={creating}
        />
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <ExpenseModal
          mode="edit"
          expense={editingExpense}
          onSave={handleUpdateExpense}
          onClose={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
          categories={expenseCategories}
          saving={updating}
        />
      )}


    </div>
  );
};

// Expense Modal Component
interface ExpenseModalProps {
  mode: 'create' | 'edit';
  expense?: Expense;
  onSave: (data: { description: string; amount: string; category: string; date: string }) => void;
  onClose: () => void;
  categories: ExpenseCategory[];
  saving: boolean;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  mode,
  expense,
  onSave,
  onClose,
  categories,
  saving
}) => {
  const [formData, setFormData] = useState({
    description: expense?.title || '',
    amount: expense?.amount || '',
    category: expense?.categoryId || (categories[0]?.id || ''),
    date: expense?.expenseDate ? expense.expenseDate.split('T')[0] : new Date().toISOString().split('T')[0]
  });

  const handleSubmit = () => {
    if (!formData.description || !formData.amount || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {mode === 'create' ? 'Add New Expense' : 'Edit Expense'}
            </h2>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="expense-title">Title *</Label>
              <Input
                id="expense-title"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter expense title"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expense-amount">Amount *</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <Label htmlFor="expense-date">Date *</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expense-category">Category *</Label>
              <select
                id="expense-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleSubmit} disabled={saving} className="flex-1">
              {saving ? `${mode === 'create' ? 'Creating' : 'Updating'}...` : `${mode === 'create' ? 'Create' : 'Update'} Expense`}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminExpenses; 
