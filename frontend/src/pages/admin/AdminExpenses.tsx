import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Search, Filter, Edit, Trash2, Calendar, DollarSign, Tag, TrendingUp, TrendingDown, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
}

interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate: string;
  receipt?: string;
  tags: string[];
  addedBy: string;
  createdAt: string;
}

const AdminExpenses: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // Sample data - replace with API calls
  const expenseCategories: ExpenseCategory[] = [
    { id: '1', name: 'Raw Materials', description: 'Gold, silver, gemstones' },
    { id: '2', name: 'Equipment & Tools', description: 'Jewelry making tools' },
    { id: '3', name: 'Marketing & Advertising', description: 'Promotional materials' },
    { id: '4', name: 'Packaging & Shipping', description: 'Boxes, shipping' },
    { id: '5', name: 'Rent & Utilities', description: 'Store rent, utilities' },
    { id: '6', name: 'Professional Services', description: 'Legal, accounting' },
    { id: '7', name: 'Miscellaneous', description: 'Other expenses' }
  ];

  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      title: 'Gold Nuggets Purchase',
      description: '24K gold raw material for ring collection',
      amount: 125000,
      category: expenseCategories[0],
      expenseDate: '2024-01-15',
      tags: ['gold', 'raw-material', 'rings'],
      addedBy: 'Admin User',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      title: 'Instagram Ad Campaign',
      description: 'Valentine\'s Day jewelry promotion',
      amount: 15000,
      category: expenseCategories[2],
      expenseDate: '2024-01-14',
      tags: ['social-media', 'valentine', 'promotion'],
      addedBy: 'Admin User',
      createdAt: '2024-01-14T14:20:00Z'
    },
    {
      id: '3',
      title: 'Jewelry Making Tools',
      description: 'Professional pliers and cutting tools set',
      amount: 8500,
      category: expenseCategories[1],
      expenseDate: '2024-01-13',
      tags: ['tools', 'equipment'],
      addedBy: 'Admin User',
      createdAt: '2024-01-13T09:15:00Z'
    }
  ]);

  const handleCreateExpense = (expenseData: any) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      ...expenseData,
      addedBy: 'Admin User',
      createdAt: new Date().toISOString()
    };
    setExpenses([newExpense, ...expenses]);
    setShowCreateModal(false);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowEditModal(true);
  };

  const handleUpdateExpense = (expenseData: any) => {
    if (selectedExpense) {
      const updatedExpenses = expenses.map(expense =>
        expense.id === selectedExpense.id ? { ...expense, ...expenseData } : expense
      );
      setExpenses(updatedExpenses);
      setShowEditModal(false);
      setSelectedExpense(null);
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      setExpenses(expenses.filter(expense => expense.id !== expenseId));
    }
  };

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedReceipt(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === 'All' || expense.category.name === filterCategory;

    const now = new Date();
    let matchesDate = true;
    if (filterDateRange === 'This Month') {
      const expenseDate = new Date(expense.expenseDate);
      matchesDate = expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
    } else if (filterDateRange === 'Last 3 Months') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      matchesDate = new Date(expense.expenseDate) >= threeMonthsAgo;
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const monthlyTotal = expenses.filter(expense => {
    const expenseDate = new Date(expense.expenseDate);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  }).reduce((sum, expense) => sum + expense.amount, 0);

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
        <Button onClick={() => setShowCreateModal(true)}>
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
              <div className="text-3xl font-bold text-red-900">₹{(totalExpenses / 1000).toFixed(0)}K</div>
              <div className="text-xs text-red-600 font-medium">Total</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-700 mb-1">Total Expenses</h3>
            <p className="text-xs text-red-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {filteredExpenses.length} transactions
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-500 rounded-2xl">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-orange-900">₹{(monthlyTotal / 1000).toFixed(0)}K</div>
              <div className="text-xs text-orange-600 font-medium">Monthly</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-orange-700 mb-1">This Month</h3>
            <p className="text-xs text-orange-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Current month spending
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500 rounded-2xl">
              <Tag className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-900">{expenseCategories[0]?.name.split(' ')[0] || 'Raw'}</div>
              <div className="text-xs text-green-600 font-medium">Category</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-green-700 mb-1">Top Category</h3>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Most used category
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-2xl">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-900">
                ₹{filteredExpenses.length > 0 ? Math.round(totalExpenses / filteredExpenses.length).toLocaleString() : 0}
              </div>
              <div className="text-xs text-purple-600 font-medium">Average</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-purple-700 mb-1">Avg. Expense</h3>
            <p className="text-xs text-purple-600 flex items-center">
              <CreditCard className="w-3 h-3 mr-1" />
              Per transaction
            </p>
          </div>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search expenses by title, description, or tags..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Modern Category Dropdown */}
        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[160px]"
          >
            <option value="All">All Categories</option>
            {expenseCategories.map(category => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Modern Date Range Dropdown */}
        <div className="relative">
          <select
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
            className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[140px]"
          >
            <option value="All">All Time</option>
            <option value="This Month">This Month</option>
            <option value="Last 3 Months">Last 3 Months</option>
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            {filteredExpenses.length} of {expenses.length} expenses
            {searchTerm && ` matching "${searchTerm}"`}
            {filterCategory !== 'All' && ` in ${filterCategory}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
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
            <div className="space-y-4">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Receipt className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{expense.title}</h3>
                      <p className="text-sm text-muted-foreground">{expense.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{expense.category.name}</Badge>
                        {expense.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="font-semibold text-lg">₹{expense.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(expense.expenseDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditExpense(expense)}
                        className="h-9 px-3 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="h-9 px-3 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Expense Modal */}
      {showCreateModal && (
        <ExpenseModal
          mode="create"
          categories={expenseCategories}
          onSave={handleCreateExpense}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Expense Modal */}
      {showEditModal && selectedExpense && (
        <ExpenseModal
          mode="edit"
          expense={selectedExpense}
          categories={expenseCategories}
          onSave={handleUpdateExpense}
          onClose={() => {
            setShowEditModal(false);
            setSelectedExpense(null);
          }}
        />
      )}
    </div>
  );
};

// Expense Modal Component
interface ExpenseModalProps {
  mode: 'create' | 'edit';
  expense?: Expense;
  categories: ExpenseCategory[];
  onSave: (data: any) => void;
  onClose: () => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({
  mode,
  expense,
  onSave,
  onClose,
  categories
}) => {
  const [formData, setFormData] = useState({
    title: expense?.title || '',
    description: expense?.description || '',
    amount: expense?.amount || 0,
    categoryId: expense?.category.id || categories[0]?.id || '',
    expenseDate: expense?.expenseDate || new Date().toISOString().split('T')[0],
    tags: expense?.tags?.join(', ') || ''
  });

  const handleSubmit = () => {
    const expenseData: Omit<Expense, 'id'> = {
      title: formData.title,
      description: formData.description,
      amount: formData.amount,
      category: categories.find(cat => cat.id === formData.categoryId) || categories[0],
      expenseDate: formData.expenseDate,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      addedBy: 'Admin User', // Default admin user
      createdAt: new Date().toISOString()
    };

    onSave(expenseData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {mode === 'create' ? 'Add New Expense' : 'Edit Expense'}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 w-9 p-0 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Expense Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="expense-title">Expense Title *</Label>
              <Input
                id="expense-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter expense title"
              />
            </div>

            <div>
              <Label htmlFor="expense-amount">Amount (₹) *</Label>
              <Input
                id="expense-amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                placeholder="Enter amount"
              />
            </div>

            <div>
              <Label htmlFor="expense-date">Expense Date *</Label>
              <Input
                id="expense-date"
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="expense-tags">Tags</Label>
              <Input
                id="expense-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Enter tags separated by commas"
              />
            </div>
          </div>

          {/* Right Column - Category and Description */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="expense-category">Category *</Label>
              <div className="relative">
                <select
                  id="expense-category"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="expense-description">Description</Label>
              <textarea
                id="expense-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter expense description..."
                className="w-full p-2 border border-border rounded-md bg-background min-h-[120px] resize-none"
              />
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-sm">Quick Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Be specific with expense titles</li>
                <li>• Use tags for better organization</li>
                <li>• Choose the most relevant category</li>
                <li>• Keep descriptions brief but clear</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={!formData.title || !formData.amount || !formData.categoryId}
          >
            {mode === 'create' ? 'Add Expense' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminExpenses; 
