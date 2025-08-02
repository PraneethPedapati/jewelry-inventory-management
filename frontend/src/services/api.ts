import axios from 'axios';
import { toast } from 'sonner';
import { CacheService } from './cache.service';

// API Configuration
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Separate client for file uploads with longer timeout
const uploadClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for file uploads
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Enhanced error handling function
const handleApiError = (error: any, customMessage?: string) => {
  console.error('API Error:', error);

  // Extract error details from response
  const errorResponse = error.response?.data;
  const statusCode = error.response?.status;
  const errorCode = errorResponse?.code;
  const errorMessage = errorResponse?.error || error.message;

  // Handle different types of errors with user-friendly messages
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    toast.error('Request timed out. Please check your internet connection and try again.');
  } else if (statusCode === 400) {
    // Handle Zod validation errors
    if (Array.isArray(errorResponse)) {
      const messages = errorResponse.map((err: any) => err.message).join('\n');
      toast.error(messages);
      return error; // Stop further execution
    }

    if (errorCode === 'VALIDATION_ERROR') {
      const details = errorResponse?.details;
      if (details && Array.isArray(details)) {
        const fieldErrors = details.map((err: any) => `${err.field}: ${err.message}`).join(', ');
        toast.error(`Validation failed: ${fieldErrors}`);
      } else {
        toast.error(errorMessage || 'Invalid request data. Please check your input.');
      }
    } else if (errorCode === 'FILE_TOO_LARGE') {
      toast.error('File size is too large. Please use a smaller file.');
    } else if (errorCode === 'TOO_MANY_FILES') {
      toast.error('Too many files selected. Please select fewer files.');
    } else if (errorCode === 'UNEXPECTED_FILE') {
      toast.error('Unexpected file type. Please select a valid file.');
    } else {
      toast.error(errorMessage || 'Bad request. Please check your input and try again.');
    }
  } else if (statusCode === 401) {
    if (errorCode === 'INVALID_TOKEN' || errorCode === 'EXPIRED_TOKEN') {
      toast.error('Your session has expired. Please log in again.');
      // Clear auth data and redirect to login
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
      window.location.href = '/admin/login';
    } else {
      toast.error('Authentication required. Please log in.');
    }
  } else if (statusCode === 403) {
    toast.error('You do not have permission to perform this action.');
  } else if (statusCode === 404) {
    if (errorCode === 'ROUTE_NOT_FOUND') {
      toast.error('The requested resource was not found.');
    } else {
      toast.error('Resource not found. Please check the URL and try again.');
    }
  } else if (statusCode === 409) {
    if (errorCode === 'DUPLICATE_RESOURCE') {
      toast.error('This resource already exists. Please use a different value.');
    } else if (errorCode === 'INSUFFICIENT_STOCK') {
      toast.error(errorMessage || 'Insufficient stock available.');
    } else {
      toast.error('Conflict occurred. Please try again with different data.');
    }
  } else if (statusCode === 413) {
    toast.error('Request payload is too large. Please reduce the file size or data amount.');
  } else if (statusCode === 429) {
    const remainingTime = errorResponse?.remainingMinutes || 1;
    toast.error(`Too many requests. Please wait ${remainingTime} minute(s) before trying again.`);
  } else if (statusCode === 500) {
    if (errorCode === 'DATABASE_ERROR') {
      toast.error('Database error occurred. Please try again later.');
    } else if (errorCode === 'SERVICE_UNAVAILABLE') {
      toast.error('External service is currently unavailable. Please try again later.');
    } else {
      toast.error('Server error occurred. Please try again later.');
    }
  } else if (statusCode === 503) {
    toast.error('Service temporarily unavailable. Please try again later.');
  } else if (!error.response) {
    // Network error
    toast.error('Network error. Please check your internet connection and try again.');
  } else {
    // Generic error
    toast.error(customMessage || errorMessage || 'An unexpected error occurred. Please try again.');
  }

  return error;
};

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token && config.url?.includes('/admin/')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add token to upload requests if available
uploadClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token && config.url?.includes('/admin/')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle authentication errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired, clear it and redirect to login
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Handle authentication errors for upload client
uploadClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired, clear it and redirect to login
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

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
  productCode: string;
  name: string;
  description: string;
  productType: string;
  price: string;
  discountedPrice?: string;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}



export interface Order {
  id: string;
  orderNumber: string;
  orderCode: string; // New: User-friendly order code
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  totalAmount: string;
  status: 'payment_pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
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
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  productSnapshot: any;
  createdAt: string;
  product?: Product;
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
  productType: 'chain' | 'bracelet-anklet';
  description: string;
  price: number;
  discountedPrice?: number;
  isActive?: boolean;
}

export interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    productId: string;
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

// Dashboard Widgets Types
export interface DashboardWidgets {
  overallRevenue: { revenue: number; formatted: string };
  monthlyRevenue: { revenue: number; formatted: string };
  monthlyOrders: number;
  netProfit: { profit: number; margin: number; formatted: string; marginFormatted: string };
  pendingOrders: number;
  staleData: number;
  averageOrderValue: { aov: number; formatted: string };
  revenueGrowth: { percentage: number; trend: 'up' | 'down' | 'neutral'; formatted: string };
  expenseBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  topSellingProducts: Array<{ productCode: string; productName: string; salesCount: number; revenue: number }>;
  averageProductValue: { aov: number; formatted: string };
}

// Health Service
export const healthService = {
  check: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/health', {
        timeout: 5000, // Short timeout for health check
      });
      return response.status === 200;
    } catch (error) {
      console.warn('Health check failed - API may not be available:', error);
      // Don't show toast for health check failures as they're expected when API is down
      return false;
    }
  }
};

// Theme API Services
export const themeService = {
  getThemes: async (): Promise<ColorTheme[]> => {
    try {
      const response = await apiClient.get<ApiResponse<ColorTheme[]>>('/api/themes');
      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to load themes. Please try again.');
      throw error;
    }
  },

  getActiveTheme: async (): Promise<ColorTheme | null> => {
    try {
      const themes = await themeService.getThemes();
      return themes.find(theme => theme.isActive) || null;
    } catch (error) {
      handleApiError(error, 'Failed to load active theme. Please try again.');
      throw error;
    }
  },

  setActiveTheme: async (themeId: string): Promise<void> => {
    try {
      await apiClient.post('/api/themes/activate', { themeId });
    } catch (error) {
      handleApiError(error, 'Failed to activate theme. Please try again.');
      throw error;
    }
  },
};

// Auth API Services  
export const authService = {
  login: async (credentials: AdminLoginRequest): Promise<AdminLoginResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<AdminLoginResponse>>('/api/admin/auth/login', credentials);
      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Login failed. Please check your credentials and try again.');
      throw error;
    }
  },

  logout: (): void => {
    localStorage.removeItem('admin_token');
  },

  getProfile: async () => {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/api/admin/auth/profile');
      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to load profile. Please try again.');
      throw error;
    }
  }
};

// Product API Services
export const productService = {
  getProducts: async (params?: {
    search?: string;
    productType?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => {
    try {
      // Check cache first (only for non-filtered requests)
      const cacheKey = 'PRODUCTS_LIST';
      if (!params || (Object.keys(params).length === 0) || (params.page === 1 && !params.search && !params.productType && params.isActive === undefined)) {
        const cached = CacheService.get<{
          products: Product[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }>(cacheKey);
        if (cached) {
          console.log('📦 Using cached products data');
          return cached;
        }
      }

      const response = await apiClient.get<ApiResponse<{
        products: Product[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>>('/api/admin/products', { params });

      // Cache only non-filtered requests
      if (!params || (Object.keys(params).length === 0) || (params.page === 1 && !params.search && !params.productType && params.isActive === undefined)) {
        CacheService.set(cacheKey, response.data.data, CacheService.DEFAULT_TTL, true);
      }

      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to load products. Please try again.');
      throw error;
    }
  },

  getProductById: async (id: string): Promise<Product> => {
    try {
      const response = await apiClient.get<ApiResponse<Product>>(`/api/admin/products/${id}`);
      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to load product details. Please try again.');
      throw error;
    }
  },

  createProduct: async (product: CreateProductRequest, images: File[]): Promise<Product> => {
    try {
      const formData = new FormData();

      // Add product data
      formData.append('name', product.name);
      formData.append('productType', product.productType);
      formData.append('description', product.description);
      formData.append('price', product.price.toString());

      if (product.discountedPrice) {
        formData.append('discountedPrice', product.discountedPrice.toString());
      }

      if (product.isActive !== undefined) {
        formData.append('isActive', product.isActive.toString());
      }

      // Add images
      images.forEach(image => {
        formData.append('images', image);
      });

      const response = await uploadClient.post<ApiResponse<Product>>('/api/admin/products', formData);

      // Invalidate cache after creating product
      CacheService.invalidateOnDataChange('product');

      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to create product. Please try again.');
      throw error;
    }
  },

  updateProduct: async (id: string, updates: Partial<CreateProductRequest>, images?: File[]): Promise<Product> => {
    try {
      const formData = new FormData();

      // Add product data
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Add images if provided
      if (images && images.length > 0) {
        images.forEach(image => {
          formData.append('images', image);
        });
      }

      const response = await uploadClient.put<ApiResponse<Product>>(`/api/admin/products/${id}`, formData);

      // Invalidate cache after updating product
      CacheService.invalidateOnDataChange('product');

      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to update product. Please try again.');
      throw error;
    }
  },

  deleteProduct: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/admin/products/${id}`);

      // Invalidate cache after deleting product
      CacheService.invalidateOnDataChange('product');
    } catch (error) {
      handleApiError(error, 'Failed to delete product. Please try again.');
      throw error;
    }
  },

  getProductStats: async () => {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/api/admin/products/stats');
      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to load product statistics. Please try again.');
      throw error;
    }
  }
};

// Public Order API Services (for customers)
export const publicOrderService = {
  createOrder: async (orderData: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerPincode: string;
    items: {
      productId: string;
      quantity: number;
    }[];
    recaptchaToken?: string;
  }) => {
    try {
      const response = await apiClient.post<ApiResponse<{
        orderNumber: string;
        orderCode: string;
        totalAmount: number;
        estimatedDelivery: string;
        status: string;
      }>>('/api/orders', orderData);
      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to place order. Please try again.');
      throw error;
    }
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
    try {
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
    } catch (error) {
      handleApiError(error, 'Failed to load orders. Please try again.');
      throw error;
    }
  },

  getOrderById: async (id: string): Promise<Order> => {
    try {
      const response = await apiClient.get<ApiResponse<Order>>(`/api/admin/orders/${id}`);
      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to load order details. Please try again.');
      throw error;
    }
  },

  createOrder: async (order: CreateOrderRequest): Promise<Order> => {
    try {
      const response = await apiClient.post<ApiResponse<Order>>('/api/admin/orders', order);

      // Invalidate cache after creating order
      CacheService.invalidateOnDataChange('order');

      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to create order. Please try again.');
      throw error;
    }
  },

  updateOrder: async (id: string, updates: Partial<Order>): Promise<Order> => {
    try {
      const response = await apiClient.put<ApiResponse<Order>>(`/api/admin/orders/${id}`, updates);

      // Invalidate cache after updating order
      CacheService.invalidateOnDataChange('order');

      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to update order. Please try again.');
      throw error;
    }
  },

  deleteOrder: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/admin/orders/${id}`);

      // Invalidate cache after deleting order
      CacheService.invalidateOnDataChange('order');
    } catch (error) {
      handleApiError(error, 'Failed to delete order. Please try again.');
      throw error;
    }
  },

  approveOrder: async (id: string, data?: { sendPaymentQR?: boolean; customMessage?: string }) => {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/api/admin/orders/${id}/approve`, data);
      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to approve order. Please try again.');
      throw error;
    }
  },

  confirmPayment: async (id: string, data?: { paymentReference?: string; notes?: string }) => {
    try {
      const response = await apiClient.post<ApiResponse<any>>(`/api/admin/orders/${id}/confirm-payment`, data);
      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to confirm payment. Please try again.');
      throw error;
    }
  },

  generateStatusWhatsApp: async (id: string) => {
    try {
      const response = await apiClient.post<ApiResponse<{
        whatsappUrl: string;
        message: string;
        customerPhone: string;
        orderNumber: string;
        status: string;
      }>>(`/api/admin/orders/${id}/status-whatsapp`);
      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to generate WhatsApp message. Please try again.');
      throw error;
    }
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
    try {
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
    } catch (error) {
      handleApiError(error, 'Failed to load expenses. Please try again.');
      throw error;
    }
  },

  getExpenseById: async (id: string): Promise<Expense> => {
    try {
      const response = await apiClient.get<ApiResponse<Expense>>(`/api/admin/expenses/${id}`);
      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to load expense details. Please try again.');
      throw error;
    }
  },

  createExpense: async (expense: CreateExpenseRequest): Promise<Expense> => {
    try {
      const response = await apiClient.post<ApiResponse<Expense>>('/api/admin/expenses', expense);

      // Invalidate cache after creating expense
      CacheService.invalidateOnDataChange('expense');

      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to create expense. Please try again.');
      throw error;
    }
  },

  updateExpense: async (id: string, updates: Partial<CreateExpenseRequest>): Promise<Expense> => {
    try {
      const response = await apiClient.put<ApiResponse<Expense>>(`/api/admin/expenses/${id}`, updates);

      // Invalidate cache after updating expense
      CacheService.invalidateOnDataChange('expense');

      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to update expense. Please try again.');
      throw error;
    }
  },

  deleteExpense: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/admin/expenses/${id}`);

      // Invalidate cache after deleting expense
      CacheService.invalidateOnDataChange('expense');
    } catch (error) {
      handleApiError(error, 'Failed to delete expense. Please try again.');
      throw error;
    }
  },

  getExpenseCategories: async (): Promise<ExpenseCategory[]> => {
    try {
      const response = await apiClient.get<ApiResponse<ExpenseCategory[]>>('/api/admin/expenses/categories');
      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to load expense categories. Please try again.');
      throw error;
    }
  },

  getExpenseStats: async () => {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/api/admin/expenses/stats');
      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to load expense statistics. Please try again.');
      throw error;
    }
  }
};

// Dashboard API Services
export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get<ApiResponse<DashboardStats>>('/api/admin/dashboard');
      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to load dashboard statistics. Please try again.');
      throw error;
    }
  },

  getWidgets: async (): Promise<DashboardWidgets> => {
    try {
      // Check cache first
      const cached = CacheService.get<DashboardWidgets>('DASHBOARD_WIDGETS');
      if (cached) {
        console.log('📊 Using cached dashboard widgets data');
        return cached;
      }

      // Fetch from API if not cached
      console.log('📊 Fetching fresh dashboard widgets data');
      const response = await apiClient.get<ApiResponse<DashboardWidgets>>('/api/admin/dashboard/widgets');

      // Cache the response persistently
      CacheService.set('DASHBOARD_WIDGETS', response.data.data, CacheService.DEFAULT_TTL, true);

      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to load dashboard widgets. Please try again.');
      throw error;
    }
  },

  refreshWidgets: async (): Promise<DashboardWidgets> => {
    try {
      // Clear cache first
      CacheService.clear('DASHBOARD_WIDGETS');
      console.log('🔄 Clearing dashboard widgets cache');

      console.log('📡 Making API call to refresh widgets...');
      console.log('📡 URL:', '/api/admin/dashboard/widgets/refresh');
      console.log('📡 Method:', 'POST');

      const response = await apiClient.post<ApiResponse<DashboardWidgets>>('/api/admin/dashboard/widgets/refresh');
      console.log('✅ Received response status:', response.status);
      console.log('✅ Received response data:', response.data);

      // Cache the fresh response persistently
      CacheService.set('DASHBOARD_WIDGETS', response.data.data, CacheService.DEFAULT_TTL, true);
      console.log('💾 Cached fresh widget data');

      return response.data.data;
    } catch (error) {
      console.error('❌ Error refreshing widgets:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorResponse = error && typeof error === 'object' && 'response' in error ? (error as any).response : undefined;

      console.error('❌ Error details:', {
        message: errorMessage,
        status: errorResponse?.status,
        data: errorResponse?.data
      });
      handleApiError(error, 'Failed to refresh dashboard widgets. Please try again.');
      throw error;
    }
  },

  getCacheStatus: () => {
    return CacheService.getCacheStatus('DASHBOARD_WIDGETS');
  },


};

// Analytics API Services
export const analyticsService = {
  getAnalytics: async (period?: string): Promise<AnalyticsData> => {
    try {
      // Check cache first
      const cached = CacheService.get<AnalyticsData>('ANALYTICS_DATA');
      if (cached) {
        console.log('📈 Using cached analytics data');
        return cached;
      }

      // Fetch from API if not cached
      console.log('📈 Fetching fresh analytics data');
      const response = await apiClient.get<ApiResponse<AnalyticsData>>('/api/admin/analytics', {
        params: { period }
      });

      // Cache the response persistently
      CacheService.set('ANALYTICS_DATA', response.data.data, CacheService.DEFAULT_TTL, true);

      return response.data.data;
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorResponse = error && typeof error === 'object' && 'response' in error ? (error as any).response : undefined;

      throw {
        message: errorMessage,
        status: errorResponse?.status,
        data: errorResponse?.data
      };
    }
  },

  refreshAnalytics: async (): Promise<AnalyticsRefreshResponse> => {
    try {
      // Clear cache first
      CacheService.clear('ANALYTICS_DATA');
      console.log('🔄 Clearing analytics cache');

      const response = await apiClient.post<AnalyticsRefreshResponse>('/api/admin/analytics/refresh');

      // Cache the fresh response persistently
      CacheService.set('ANALYTICS_DATA', response.data, CacheService.DEFAULT_TTL, true);

      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to refresh analytics data. Please try again.');
      throw error;
    }
  },

  getAnalyticsStatus: async (): Promise<AnalyticsStatus> => {
    try {
      // Check cache first
      const cached = CacheService.get<AnalyticsStatus>('ANALYTICS_STATUS');
      if (cached) {
        console.log('📊 Using cached analytics status');
        return cached;
      }

      // Fetch from API if not cached
      const response = await apiClient.get<ApiResponse<AnalyticsStatus>>('/api/admin/analytics/status');

      // Cache the response persistently
      CacheService.set('ANALYTICS_STATUS', response.data.data, CacheService.DEFAULT_TTL, true);

      return response.data.data;
    } catch (error) {
      handleApiError(error, 'Failed to load analytics status. Please try again.');
      throw error;
    }
  }
};

export default apiClient; 
