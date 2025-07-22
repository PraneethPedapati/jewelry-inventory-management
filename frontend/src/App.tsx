import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useThemeStore } from './stores/theme.store';
import { healthService } from './services/api';

// Import pages
import CustomerLayout from './pages/customer/CustomerLayout';
import ProductCatalog from './pages/customer/ProductCatalog';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminThemes from './pages/admin/AdminThemes';

// Demo/Landing page
import LandingPage from './pages/LandingPage';

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
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsApiConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [loadThemes, applyTheme]);

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
        {/* Landing/Demo Page */}
        <Route path="/" element={<LandingPage isApiConnected={isApiConnected} />} />

        {/* Customer-facing pages */}
        <Route path="/shop" element={<CustomerLayout />}>
          <Route index element={<ProductCatalog />} />
          <Route path="products" element={<ProductCatalog />} />
          <Route path="cart" element={<div className="p-8">Shopping Cart (Coming Soon)</div>} />
          <Route path="orders" element={<div className="p-8">Order History (Coming Soon)</div>} />
        </Route>

        {/* Admin routes */}
        <Route
          path="/admin/login"
          element={!isAuthenticated ? <AdminLogin onLogin={setIsAuthenticated} /> : <Navigate to="/admin/dashboard" />}
        />
        <Route
          path="/admin/dashboard"
          element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/themes"
          element={isAuthenticated ? <AdminThemes /> : <Navigate to="/admin/login" />}
        />

        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App; 
