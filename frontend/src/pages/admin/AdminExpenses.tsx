import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Search, Edit, Trash2, TrendingUp, DollarSign, Calendar, Eye, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { expenseService, type Expense, type ExpenseCategory, type CreateExpenseRequest } from '@/services/api';

const AdminExpenses: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // API state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const itemsPerPage = 10;

  // Load expenses from API
  const loadExpenses = async () => {
    try {
      setLoading(true);
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
      if (filterCategory !== 'All') params.category = filterCategory;

      const data = await expenseService.getExpenses(params);
      setExpenses(data.expenses);
      setTotalPages(data.pagination.totalPages);
      setTotalExpenses(data.pagination.total);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      toast.error('Failed to load expenses. Please try again.');
    } finally {
      setLoading(false);
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

  // Load expenses on component mount and when filters change
  useEffect(() => {
    loadExpenses();
  }, [searchTerm, filterCategory, currentPage]);

  // Load categories on component mount
  useEffect(() => {
    loadExpenseCategories();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, filterCategory]);

  const handleCreateExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'category' | 'addedBy'>) => {
    try {
      setCreating(true);
      const createData: CreateExpenseRequest = {
        title: expenseData.title,
        description: expenseData.description,
        amount: parseFloat(expenseData.amount),
        categoryId: expenseData.categoryId,
        expenseDate: expenseData.expenseDate,
        receipt: expenseData.receipt,
        tags: expenseData.tags
      };

      await expenseService.createExpense(createData);
      toast.success('Expense created successfully!');
      setShowCreateModal(false);
      await loadExpenses(); // Refresh the list
    } catch (error) {
      console.error('Failed to create expense:', error);
      toast.error('Failed to create expense. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowEditModal(true);
  };

  const handleUpdateExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'category' | 'addedBy'>) => {
    if (!selectedExpense) return;

    try {
      setUpdating(true);
      const updateData: Partial<CreateExpenseRequest> = {
        title: expenseData.title,
        description: expenseData.description,
        amount: parseFloat(expenseData.amount),
        categoryId: expenseData.categoryId,
        expenseDate: expenseData.expenseDate,
        receipt: expenseData.receipt,
        tags: expenseData.tags
      };

      await expenseService.updateExpense(selectedExpense.id, updateData);
      toast.success('Expense updated successfully!');
      setShowEditModal(false);
      setSelectedExpense(null);
      await loadExpenses(); // Refresh the list
    } catch (error) {
      console.error('Failed to update expense:', error);
      toast.error('Failed to update expense. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    setExpenseToDelete(expense);
    setShowDeleteDialog(true);
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      setDeleting(true);
      await expenseService.deleteExpense(expenseToDelete.id);
      toast.success(`Expense "${expenseToDelete.title}" deleted successfully!`);
      setShowDeleteDialog(false);
      setExpenseToDelete(null);
      await loadExpenses(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete expense:', error);
      toast.error('Failed to delete expense. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString()}`;
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

  // Calculate statistics
  const totalAmount = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const avgExpense = expenses.length > 0 ? totalAmount / expenses.length : 0;

  // Calculate unique categories that actually have expenses
  const categoriesWithExpenses = new Set(expenses.map(expense => expense.category.id)).size;

  if (loading && expenses.length === 0) {
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="w-8 h-8" />
            Expense Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Track and manage business expenses, monitor spending patterns
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} disabled={creating}>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Enhanced Expense Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500 rounded-2xl">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-900">₹{(totalAmount / 1000).toFixed(0)}K</div>
              <div className="text-xs text-red-600 font-medium">Total</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-700 mb-1">Total Expenses</h3>
            <p className="text-xs text-red-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {expenses.length} transactions
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-2xl">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-900">₹{(avgExpense / 1000).toFixed(0)}K</div>
              <div className="text-xs text-blue-600 font-medium">Average</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-700 mb-1">Average Expense</h3>
            <p className="text-xs text-blue-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Per transaction
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500 rounded-2xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-900">{expenses.length}</div>
              <div className="text-xs text-green-600 font-medium">This Period</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-green-700 mb-1">Total Transactions</h3>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Current period
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-2xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-900">{categoriesWithExpenses}</div>
              <div className="text-xs text-purple-600 font-medium">Categories</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-purple-700 mb-1">Categories Used</h3>
            <p className="text-xs text-purple-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              With expenses
            </p>
          </div>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search expenses by title or description..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-border rounded-md bg-background text-foreground min-w-[180px]"
        >
          <option value="All">All Categories</option>
          {expenseCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterCategory !== 'All'
                ? 'No expenses match your current filters'
                : 'Start by adding your first expense'}
            </p>
          </div>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{expense.title}</h3>
                        <p className="text-muted-foreground text-sm">
                          {formatDate(expense.expenseDate)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {expense.category.name}
                      </Badge>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                    </div>

                    {expense.description && (
                      <p className="text-muted-foreground mb-4">
                        {expense.description}
                      </p>
                    )}

                    {expense.tags && expense.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {expense.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Added by {expense.addedBy.name} on {formatDate(expense.createdAt)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditExpense(expense)}
                      disabled={updating}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteExpense(expense)}
                      disabled={deleting}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                    {expense.receipt && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReceipt(expense.receipt!)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Receipt
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="h-10 px-3"
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
                  disabled={loading}
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
            disabled={currentPage === totalPages || loading}
            className="h-10 px-3"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
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
      />

      {/* Create Expense Modal */}
      {showCreateModal && (
        <ExpenseModal
          mode="create"
          onSave={handleCreateExpense}
          onClose={() => setShowCreateModal(false)}
          categories={expenseCategories}
          saving={creating}
        />
      )}

      {/* Edit Expense Modal */}
      {showEditModal && selectedExpense && (
        <ExpenseModal
          mode="edit"
          expense={selectedExpense}
          onSave={handleUpdateExpense}
          onClose={() => {
            setShowEditModal(false);
            setSelectedExpense(null);
          }}
          categories={expenseCategories}
          saving={updating}
        />
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 flex items-center justify-between border-b">
              <h3 className="text-lg font-semibold">Receipt</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReceipt(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              <img
                src={selectedReceipt}
                alt="Receipt"
                className="max-w-full h-auto"
                onError={() => {
                  toast.error('Failed to load receipt image');
                  setSelectedReceipt(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Expense Modal Component
interface ExpenseModalProps {
  mode: 'create' | 'edit';
  expense?: Expense;
  onSave: (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'category' | 'addedBy'>) => void;
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
    title: expense?.title || '',
    description: expense?.description || '',
    amount: expense?.amount || '',
    categoryId: expense?.categoryId || (categories[0]?.id || ''),
    expenseDate: expense?.expenseDate ? expense.expenseDate.split('T')[0] : new Date().toISOString().split('T')[0],
    receipt: expense?.receipt || '',
    tags: expense?.tags || []
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = () => {
    if (!formData.title || !formData.amount || !formData.categoryId) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSave(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
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
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter expense title"
              />
            </div>

            <div>
              <Label htmlFor="expense-description">Description</Label>
              <textarea
                id="expense-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter expense description"
                className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[80px]"
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
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expense-category">Category *</Label>
              <select
                id="expense-category"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="expense-receipt">Receipt URL</Label>
              <Input
                id="expense-receipt"
                value={formData.receipt}
                onChange={(e) => setFormData({ ...formData, receipt: e.target.value })}
                placeholder="Enter receipt image URL"
              />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
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
