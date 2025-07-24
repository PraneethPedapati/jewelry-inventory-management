import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, User } from 'lucide-react';
import Logo from '@/components/ui/Logo';

const CustomerLayout: React.FC = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Products', href: '/shop/products', icon: ShoppingBag },
    { name: 'Cart', href: '/shop/cart', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/shop/products" className="flex items-center space-x-2">
              <Logo size="md" variant="full" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors ${isActive
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Login Button */}
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/login"
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:block">Login</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="grid grid-cols-3 gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center py-2 px-1 text-xs transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <Link
            to="/admin/login"
            className="flex flex-col items-center py-2 px-1 text-xs text-muted-foreground"
          >
            <User className="w-5 h-5 mb-1" />
            <span>Login</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default CustomerLayout; 
