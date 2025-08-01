import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, Info, Phone, Mail } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { useCart } from '@/hooks/useCart';

const CustomerLayout: React.FC = () => {
  const location = useLocation();
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();

  const navigation = [
    { name: 'Products', href: '/shop/products', icon: ShoppingBag },
    { name: 'Cart', href: '/shop/cart', icon: ShoppingCart },
    { name: 'About', href: '/shop/about', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <Link to="/shop/products" className="flex items-center space-x-2">
              <Logo size="lg" variant="full" />
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
                    className={`flex items-center space-x-2 px-3 py-2 text-base font-medium transition-colors relative ${isActive
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                    {item.name === 'Cart' && cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>


          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer with Contact Information */}
      <footer className="bg-card border-t border-border py-8 mt-16 pb-24 md:pb-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center space-y-4">
            {/* Contact Information */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-4">Contact Us</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+91-9876543210</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>info@elegantjewelry.com</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border w-full pt-4 text-center">
              <p className="text-sm text-muted-foreground">
                © 2024 Elegant Jewelry Store. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

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
                className={`flex flex-col items-center py-3 px-1 text-sm transition-colors relative ${isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span>{item.name}</span>
                {item.name === 'Cart' && cartItemCount > 0 && (
                  <span className="absolute -top-1 right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>
            );
          })}

        </div>
      </nav>
    </div>
  );
};

export default CustomerLayout; 
