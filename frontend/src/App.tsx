import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useThemeStore } from '@/stores/theme.store';
import { healthService, authService } from '@/services/api';
import { CartProvider } from '@/context/CartContext';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminExpenses from '@/pages/admin/AdminExpenses';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminSettings from '@/pages/admin/AdminSettings';
import CustomerLayout from '@/pages/customer/CustomerLayout';
import ProductCatalog from '@/pages/customer/ProductCatalog';
import Cart from '@/pages/customer/Cart';
import OrderSuccess from '@/pages/customer/OrderSuccess';

function App() {
  const { activeTheme, loadThemes, applyTheme } = useThemeStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize themes and check API connection
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if backend is connected
        await healthService.check();

        // Load themes from database
        await loadThemes();

        // Apply saved font
        if (activeTheme) {
          applyTheme(activeTheme);
        }

        // Check if admin is logged in by validating the token
        const adminToken = localStorage.getItem('admin_token');
        if (adminToken) {
          try {
            // Validate the token by calling the profile endpoint
            await authService.getProfile();
            setIsAuthenticated(true);
            console.log('✅ Admin authentication validated');
          } catch (error) {
            console.log('❌ Admin token is invalid, clearing authentication');
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_info');
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }

      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []); // Empty dependency array - only run once on mount

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading jewelry inventory system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
        {/* Root redirects directly to products */}
        <Route path="/" element={<Navigate to="/shop/products" />} />

        {/* Customer-facing pages */}
        <Route path="/shop" element={
          <CartProvider>
            <CustomerLayout />
          </CartProvider>
        }>
          <Route path="products" element={<ProductCatalog />} />
          <Route path="cart" element={<Cart />} />
          <Route path="order-success" element={<OrderSuccess />} />
          <Route index element={<Navigate to="/shop/products" />} />
        </Route>

        {/* Admin routes */}
        <Route
          path="/admin/login"
          element={!isAuthenticated ? <AdminLogin onLogin={setIsAuthenticated} /> : <Navigate to="/admin/dashboard" />}
        />
        <Route
          path="/admin"
          element={isAuthenticated ? <AdminLayout onLogout={handleLogout} /> : <Navigate to="/admin/login" />}
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="expenses" element={<AdminExpenses />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route index element={<Navigate to="/admin/dashboard" />} />
        </Route>

        {/* Catch all - redirect to products */}
        <Route path="*" element={<Navigate to="/shop/products" />} />
      </Routes>
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
    </div>
  );
}

export default App; 
