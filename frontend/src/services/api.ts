import axios from 'axios';

// API Configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token && config.url?.includes('/admin/')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

// Types
export interface ColorTheme {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  isDefault: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    border: string;
    input: string;
    ring: string;
    muted: string;
    mutedForeground: string;
    destructive: string;
    destructiveForeground: string;
    success: string;
    successForeground: string;
    warning: string;
    warningForeground: string;
  };
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  charmDescription: string;
  chainDescription: string;
  basePrice: string;
  sku: string;
  images: string[];
  isActive: boolean;
  stockAlertThreshold: number;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
  productType: {
    id: string;
    name: string;
    displayName: string;
    specificationType: string;
  };
  specifications?: ProductSpecification[];
}

export interface ProductSpecification {
  id: string;
  productId: string;
  specType: 'size' | 'layer';
  specValue: string;
  displayName: string;
  priceModifier: string;
  stockQuantity: number;
  isAvailable: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  totalAmount: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  whatsappMessageSent: boolean;
  paymentReceived: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  specificationId: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  productSnapshot: any;
  createdAt: string;
  product?: Product;
  specification?: ProductSpecification;
}

export interface Expense {
  id: string;
  title: string;
  description?: string;
  amount: string;
  categoryId: string;
  expenseDate: string;
  receipt?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  category: ExpenseCategory;
  addedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateProductRequest {
  name: string;
  category: 'chain' | 'bracelet-anklet';
  charmDescription: string;
  chainDescription: string;
  basePrice: number;
  images?: string[];
  metaDescription?: string;
  stockAlertThreshold?: number;
}

export interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    productId: string;
    specificationId: string;
    quantity: number;
  }[];
  notes?: string;
}

export interface CreateExpenseRequest {
  title: string;
  description?: string;
  amount: number;
  categoryId: string;
  expenseDate: string;
  receipt?: string;
  tags?: string[];
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  expiresIn: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalProducts: number;
  totalOrders: number;
  revenueGrowth: number;
  recentOrders: Array<{
    id: string;
    customer: string;
    item: string;
    amount: string;
    status: string;
    date: string;
    time: string;
  }>;
}

export interface AnalyticsData {
  revenueData: Array<{
    month: string;
    revenue: number;
    expenses: number;
  }>;
  expenseCategories: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
  topSellingProducts: Array<{
    name: string;
    sales: number;
    revenue: string;
    profit: string;
  }>;
  summary?: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    revenueChange: number;
    expenseChange: number;
    profitMargin: number;
    mostProfitableMonth: string;
    averageMonthlyRevenue: number;
    expenseEfficiency: number;
  };
}

export interface AnalyticsStatus {
  lastRefreshed: string | null;
  isStale: boolean;
  cooldownStatus: {
    [key: string]: {
      canRefresh: boolean;
      remainingMs: number;
    };
  };
  canRefresh: boolean;
}

export interface AnalyticsRefreshResponse {
  success: boolean;
  data: AnalyticsData;
  message: string;
  isStale: boolean;
  lastRefreshed: string;
  computationTimeMs: number;
  cooldownStatus: {
    [key: string]: {
      canRefresh: boolean;
      remainingMs: number;
    };
  };
}

// Health Service
export const healthService = {
  check: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/api/health');
      return response.data.success;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
};

// Theme API Services
export const themeService = {
  getThemes: async (): Promise<ColorTheme[]> => {
    const response = await apiClient.get<ApiResponse<ColorTheme[]>>('/api/themes');
    return response.data.data;
  },

  getActiveTheme: async (): Promise<ColorTheme | null> => {
    const themes = await themeService.getThemes();
    return themes.find(theme => theme.isActive) || null;
  },

  setActiveTheme: async (themeId: string): Promise<void> => {
    await apiClient.post('/api/themes/activate', { themeId });
  },
};

// Auth API Services  
export const authService = {
  login: async (credentials: AdminLoginRequest): Promise<AdminLoginResponse> => {
    const response = await apiClient.post<ApiResponse<AdminLoginResponse>>('/api/admin/auth/login', credentials);
    return response.data.data;
  },

  logout: (): void => {
    localStorage.removeItem('admin_token');
  },

  getProfile: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/api/admin/auth/profile');
    return response.data.data;
  }
};

// Product API Services
export const productService = {
  getProducts: async (params?: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get<ApiResponse<{
      products: Product[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>>('/api/admin/products', { params });
    return response.data.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await apiClient.get<ApiResponse<Product>>(`/api/admin/products/${id}`);
    return response.data.data;
  },

  createProduct: async (product: CreateProductRequest): Promise<Product> => {
    const response = await apiClient.post<ApiResponse<Product>>('/api/admin/products', product);
    return response.data.data;
  },

  updateProduct: async (id: string, updates: Partial<CreateProductRequest>): Promise<Product> => {
    const response = await apiClient.put<ApiResponse<Product>>(`/api/admin/products/${id}`, updates);
    return response.data.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/admin/products/${id}`);
  },

  getProductCategories: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>('/api/admin/products/categories');
    return response.data.data;
  }
};

// Order API Services
export const orderService = {
  getOrders: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<{
      orders: Order[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>>('/api/admin/orders', { params });
    return response.data.data;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const response = await apiClient.get<ApiResponse<Order>>(`/api/admin/orders/${id}`);
    return response.data.data;
  },

  createOrder: async (order: CreateOrderRequest): Promise<Order> => {
    const response = await apiClient.post<ApiResponse<Order>>('/api/admin/orders', order);
    return response.data.data;
  },

  updateOrder: async (id: string, updates: Partial<Order>): Promise<Order> => {
    const response = await apiClient.put<ApiResponse<Order>>(`/api/admin/orders/${id}`, updates);
    return response.data.data;
  },

  deleteOrder: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/admin/orders/${id}`);
  },

  approveOrder: async (id: string, data?: { upiId?: string; sendPaymentQR?: boolean; customMessage?: string }) => {
    const response = await apiClient.post<ApiResponse<any>>(`/api/admin/orders/${id}/approve`, data);
    return response.data.data;
  },

  confirmPayment: async (id: string, data?: { paymentReference?: string; notes?: string }) => {
    const response = await apiClient.post<ApiResponse<any>>(`/api/admin/orders/${id}/confirm-payment`, data);
    return response.data.data;
  }
};

// Expense API Services
export const expenseService = {
  getExpenses: async (params?: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<{
      expenses: Expense[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>>('/api/admin/expenses', { params });
    return response.data.data;
  },

  getExpenseById: async (id: string): Promise<Expense> => {
    const response = await apiClient.get<ApiResponse<Expense>>(`/api/admin/expenses/${id}`);
    return response.data.data;
  },

  createExpense: async (expense: CreateExpenseRequest): Promise<Expense> => {
    const response = await apiClient.post<ApiResponse<Expense>>('/api/admin/expenses', expense);
    return response.data.data;
  },

  updateExpense: async (id: string, updates: Partial<CreateExpenseRequest>): Promise<Expense> => {
    const response = await apiClient.put<ApiResponse<Expense>>(`/api/admin/expenses/${id}`, updates);
    return response.data.data;
  },

  deleteExpense: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/admin/expenses/${id}`);
  },

  getExpenseCategories: async (): Promise<ExpenseCategory[]> => {
    const response = await apiClient.get<ApiResponse<ExpenseCategory[]>>('/api/admin/expenses/categories');
    return response.data.data;
  },

  getExpenseStats: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/api/admin/expenses/stats');
    return response.data.data;
  }
};

// Dashboard API Services
export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<ApiResponse<DashboardStats>>('/api/admin/dashboard');
    return response.data.data;
  }
};

// Analytics API Services
export const analyticsService = {
  getAnalytics: async (period?: string): Promise<AnalyticsData> => {
    const response = await apiClient.get<ApiResponse<AnalyticsData>>('/api/admin/analytics', {
      params: { period }
    });
    return response.data.data;
  },

  refreshAnalytics: async (): Promise<AnalyticsRefreshResponse> => {
    const response = await apiClient.post<ApiResponse<AnalyticsRefreshResponse>>('/api/admin/analytics/refresh');
    return response.data.data;
  },

  getAnalyticsStatus: async (): Promise<AnalyticsStatus> => {
    const response = await apiClient.get<ApiResponse<AnalyticsStatus>>('/api/admin/analytics/status');
    return response.data.data;
  }
};

export default apiClient; 
