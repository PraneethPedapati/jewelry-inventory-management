import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Home, ShoppingCart, Clock, User } from 'lucide-react';

const CustomerLayout: React.FC = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Products', href: '/shop/products', icon: ShoppingBag },
    { name: 'Cart', href: '/shop/cart', icon: ShoppingCart },
    { name: 'Orders', href: '/shop/orders', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">J</span>
              </div>
              <span className="font-semibold text-foreground">Jewelry Store</span>
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

            {/* User actions */}
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:block">Home</span>
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
        <div className="grid grid-cols-4 gap-1">
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
            to="/"
            className="flex flex-col items-center py-2 px-1 text-xs text-muted-foreground"
          >
            <Home className="w-5 h-5 mb-1" />
            <span>Home</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default CustomerLayout; 
