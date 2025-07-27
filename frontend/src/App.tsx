import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useThemeStore } from './stores/theme.store';
import { healthService } from './services/api';
import { CartProvider } from './context/CartContext';

// Import pages
import CustomerLayout from './pages/customer/CustomerLayout';
import ProductCatalog from './pages/customer/ProductCatalog';
import Cart from './components/Cart';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSettings from './pages/admin/AdminSettings';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminExpenses from './pages/admin/AdminExpenses';
import AdminAnalytics from './pages/admin/AdminAnalytics';

function App() {
  const { activeTheme, loadThemes, applyTheme } = useThemeStore();
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  // Initialize themes and check API connection
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);

        // Check if backend is connected
        const healthCheck = await healthService.check();
        setIsApiConnected(healthCheck);

        // Load themes from database
        await loadThemes();

        // Apply the active theme if it exists
        if (activeTheme) {
          applyTheme(activeTheme);
        }

        // Check if admin is logged in (basic localStorage check for demo)
        const adminToken = localStorage.getItem('admin_token');
        setIsAuthenticated(!!adminToken);

        // Apply saved font
        const savedFont = localStorage.getItem('selected-font');
        if (savedFont) {
          document.documentElement.style.setProperty('--font-family', `'${savedFont}', 'Inter', system-ui, sans-serif`);
          document.body.style.fontFamily = `'${savedFont}', 'Inter', system-ui, sans-serif`;
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsApiConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [loadThemes, applyTheme]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
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
    <CartProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          {/* Root redirects directly to products */}
          <Route path="/" element={<Navigate to="/shop/products" />} />

          {/* Customer-facing pages */}
          <Route path="/shop" element={<CustomerLayout />}>
            <Route path="products" element={<ProductCatalog />} />
            <Route path="cart" element={<Cart />} />
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
      </div>
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
    </CartProvider>
  );
}

export default App; 
