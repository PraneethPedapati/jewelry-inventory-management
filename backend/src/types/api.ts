// Database entity types
export interface ProductType {
  id: string;
  name: 'chain' | 'bracelet' | 'anklet';
  displayName: string;
  specificationType: 'layer' | 'size';
  isActive: boolean;
  createdAt: string;
}

export interface ProductSpecification {
  id: string;
  productId: string;
  specType: 'size' | 'layer';
  specValue: string;
  displayName: string;
  priceModifier: number;
  stockQuantity: number;
  isAvailable: boolean;
}

export interface CompleteProduct {
  id: string;
  name: string;
  charmDescription: string;
  chainDescription: string;
  productType: ProductType;
  basePrice: number;
  sku: string;
  images: string[];
  isActive: boolean;
  specifications: ProductSpecification[];
  createdAt: string;
  updatedAt: string;
}

// Color Theme System
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
  createdAt: string;
  updatedAt: string;
}

// Order Types
export interface OrderItem {
  id: string;
  productId: string;
  specificationId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productSnapshot: CompleteProduct;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderCode: string; // New: User-friendly order code (e.g., ORD001)
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  totalAmount: number;
  status: 'payment_pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  whatsappMessageSent: boolean;
  paymentReceived: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
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
}

export interface CreateOrderResponse {
  order: Order;
  whatsappUrl: string;
  message: string;
}

export interface WhatsAppMessageRequest {
  orderId: string;
  messageType: 'order' | 'status';
  customMessage?: string;
}

export interface WhatsAppMessageResponse {
  whatsappUrl: string;
  message: string;
  success: boolean;
}

// Color Theme API Types
export interface CreateColorThemeRequest {
  name: string;
  displayName: string;
  colors: ColorTheme['colors'];
  description?: string;
  isDefault?: boolean;
}

export interface UpdateColorThemeRequest {
  displayName?: string;
  colors?: Partial<ColorTheme['colors']>;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface SetActiveThemeRequest {
  themeId: string;
}

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export interface PaginationResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Product API Types
export interface ProductsResponse {
  products: CompleteProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    types: ProductType[];
    priceRange: { min: number; max: number };
  };
}

export interface ProductDetailResponse {
  product: CompleteProduct;
  relatedProducts: CompleteProduct[];
}

// Admin Types
export interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  admin: Admin;
  expiresIn: number;
}

// Dashboard Types
export interface DashboardResponse {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    activeProducts: number;
    lowStockAlerts: number;
  };
  recentOrders: Order[];
  popularSpecifications: {
    productId: string;
    productName: string;
    specificationId: string;
    specificationName: string;
    orderCount: number;
  }[];
  salesChart: {
    date: string;
    orders: number;
    revenue: number;
  }[];
  activeTheme: ColorTheme;
}

export interface AdminOrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  statusCounts: Record<string, number>;
}

export interface UpdateOrderStatusRequest {
  status: Order['status'];
  notes?: string;
  notifyCustomer?: boolean;
} 
