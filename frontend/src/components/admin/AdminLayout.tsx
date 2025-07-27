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
  ChevronRight,
  User,
  Receipt
} from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { env } from '@/config/env';

interface AdminLayoutProps {
  onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const handleLogout = () => {
    onLogout();
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
      title: 'Expenses',
      href: '/admin/expenses',
      icon: Receipt,
    },
    // Analytics page hidden - dashboard widgets provide the same functionality
    // {
    //   title: 'Analytics',
    //   href: '/admin/analytics',
    //   icon: BarChart3,
    // },
    // Settings module hidden for now
    // {
    //   title: 'Settings',
    //   href: '/admin/settings',
    //   icon: Settings,
    // },
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border fixed top-0 left-0 right-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Logo size="lg" variant="full" />
                <div>
                  {/* <p className="text-xs text-muted-foreground">Admin Panel</p> */}
                </div>
              </div>
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

      <div className="flex pt-20">
        {/* Fixed Sidebar */}
        <aside
          className={`bg-card border-r border-border fixed left-0 top-20 bottom-0 transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'w-64' : 'w-16'
            } group z-20`}
          onMouseEnter={() => setIsSidebarExpanded(true)}
          onMouseLeave={() => setIsSidebarExpanded(false)}
        >
          <div className="flex flex-col h-full">
            {/* Navigation Menu */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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

            {/* Admin Profile Section */}
            <div className="p-3 border-t border-border">
              <div className={`flex items-center px-3 py-3 text-muted-foreground ${!isSidebarExpanded ? 'justify-center' : 'space-x-3'}`}>
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div
                  className={`transition-all duration-300 ${isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                    }`}
                >
                  <p className="text-sm font-medium text-foreground">Admin User</p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className={`flex items-center w-full px-3 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all duration-200 mt-2 ${!isSidebarExpanded ? 'justify-center' : 'space-x-3'}`}
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
        <main className={`flex-1 transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-16'} overflow-auto`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 
