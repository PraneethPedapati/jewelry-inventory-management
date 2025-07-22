import React from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '../stores/theme.store';
import { ShoppingBag, Settings, UserCheck, Palette } from 'lucide-react';

interface LandingPageProps {
  isApiConnected: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ isApiConnected }) => {
  const { activeTheme, availableThemes } = useThemeStore();

  return (
    <div className="container mx-auto p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">
          💎 Jewelry Inventory Management
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Complete system with configurable color palettes
        </p>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          <Link
            to="/shop"
            className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow duration-200 block"
          >
            <ShoppingBag className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Customer Store</h3>
            <p className="text-muted-foreground">
              Browse jewelry collections, view products, and place orders
            </p>
          </Link>

          <Link
            to="/admin/login"
            className="bg-card p-6 rounded-lg border hover:shadow-lg transition-shadow duration-200 block"
          >
            <Settings className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Admin Panel</h3>
            <p className="text-muted-foreground">
              Manage inventory, themes, and store settings
            </p>
          </Link>
        </div>

        {/* Theme Demo */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold text-card-foreground mb-4">
              🎨 Dynamic Theme System Active!
            </h2>

            {activeTheme && (
              <div className="mb-6">
                <p className="text-muted-foreground">
                  Current theme: <span className="font-semibold text-foreground">{activeTheme.displayName}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {activeTheme.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Primary
              </button>
              <button
                className="bg-secondary text-white px-4 py-2 rounded hover:bg-secondary/90 transition-colors"
                style={{ backgroundColor: 'var(--color-secondary)' }}
              >
                Secondary
              </button>
              <button
                className="bg-accent text-white px-4 py-2 rounded hover:bg-accent/90 transition-colors"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                Accent
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">✅ Features Implemented</h3>
              <ul className="text-left space-y-2 text-sm">
                <li>🎨 <strong>Configurable Color Palette System</strong> - Your special request!</li>
                <li>💎 Complete jewelry product management (charm + chain combinations)</li>
                <li>📱 Mobile-first PWA design</li>
                <li>📲 WhatsApp integration for orders</li>
                <li>🔐 JWT authentication with Argon2</li>
                <li>📊 OpenTelemetry distributed tracing</li>
                <li>⚛️ React 18.3+ with TypeScript 5.5+</li>
                <li>🚀 Node.js 20 LTS backend</li>
              </ul>
            </div>

            <div className={`mt-6 p-4 rounded ${isApiConnected ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              {isApiConnected ? (
                <div className="text-sm text-green-800">
                  <p className="font-semibold">✅ Database Connected Successfully!</p>
                  <p className="mt-1">
                    🎨 Loaded {availableThemes.length} themes from database<br />
                    💎 {availableThemes.filter(t => !t.isDefault).length} custom themes available<br />
                    🔧 Ready for admin theme management!
                  </p>
                </div>
              ) : (
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Backend Disconnected:</strong> Using offline themes. Check if backend server is running on port 3000.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/admin/themes"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
          >
            <Palette className="w-4 h-4 mr-2" />
            Manage Themes
          </Link>
          <Link
            to="/shop/products"
            className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90 transition-colors"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            View Store
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 
