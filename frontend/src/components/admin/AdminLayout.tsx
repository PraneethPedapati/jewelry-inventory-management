import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Products',
      href: '/admin/products',
      icon: Package,
    },
    {
      title: 'Orders',
      href: '/admin/orders',
      icon: ShoppingCart,
    },
    {
      title: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      icon: Settings,
    },
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">J</span>
                </div>
                <span className="font-semibold text-foreground">Admin Panel</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                View Store
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Collapsible Sidebar */}
        <aside
          className={`bg-card border-r border-border min-h-screen transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'w-64' : 'w-16'
            } group`}
          onMouseEnter={() => setIsSidebarExpanded(true)}
          onMouseLeave={() => setIsSidebarExpanded(false)}
        >
          <div className="flex flex-col h-full">
            {/* Navigation Menu */}
            <nav className="flex-1 p-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-md transition-all duration-200 ${isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    title={!isSidebarExpanded ? item.title : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span
                      className={`font-medium transition-all duration-300 ${isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                        }`}
                    >
                      {item.title}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout Button at Bottom */}
            <div className="p-3 border-t border-border">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-3 w-full text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all duration-200"
                title={!isSidebarExpanded ? 'Logout' : undefined}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span
                  className={`font-medium transition-all duration-300 ${isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                    }`}
                >
                  Logout
                </span>
              </button>
            </div>

            {/* Expand/Collapse Indicator */}
            <div className="p-2 flex justify-center">
              <div className="text-muted-foreground">
                {isSidebarExpanded ? (
                  <ChevronLeft className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 
