import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  Palette,
  Settings,
  LogOut,
  BarChart3,
  DollarSign
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const stats = [
    {
      title: 'Total Revenue',
      value: '$24,567',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Products',
      value: '247',
      change: '+3.2%',
      trend: 'up',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Orders',
      value: '89',
      change: '+8.1%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'text-purple-600'
    },
    {
      title: 'Customers',
      value: '1,234',
      change: '+15.7%',
      trend: 'up',
      icon: Users,
      color: 'text-orange-600'
    }
  ];

  const quickActions = [
    {
      title: 'Theme Management',
      description: 'Customize store colors and appearance',
      href: '/admin/themes',
      icon: Palette,
      color: 'bg-purple-500'
    },
    {
      title: 'Product Management',
      description: 'Add, edit, or remove products',
      href: '#',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      title: 'Order Management',
      description: 'View and manage customer orders',
      href: '#',
      icon: ShoppingCart,
      color: 'bg-green-500'
    },
    {
      title: 'Analytics',
      description: 'View detailed reports and insights',
      href: '#',
      icon: BarChart3,
      color: 'bg-orange-500'
    }
  ];

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
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border min-h-screen p-6">
          <nav className="space-y-2">
            <Link
              to="/admin/dashboard"
              className="flex items-center space-x-3 px-3 py-2 text-primary bg-primary/10 rounded-md"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>

            <Link
              to="/admin/themes"
              className="flex items-center space-x-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <Palette className="w-5 h-5" />
              <span>Theme Management</span>
            </Link>

            <a
              href="#"
              className="flex items-center space-x-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <Package className="w-5 h-5" />
              <span>Products</span>
            </a>

            <a
              href="#"
              className="flex items-center space-x-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Orders</span>
            </a>

            <a
              href="#"
              className="flex items-center space-x-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>Customers</span>
            </a>

            <a
              href="#"
              className="flex items-center space-x-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </a>

            <a
              href="#"
              className="flex items-center space-x-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening in your jewelry store.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.title} className="bg-card p-6 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className={`text-sm ${stat.color} flex items-center mt-1`}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {stat.change}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full bg-muted`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.title}
                    to={action.href}
                    className="bg-card p-6 rounded-lg border hover:shadow-md transition-shadow duration-200 block"
                  >
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-md">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-foreground">New order #1234 received</span>
                <span className="text-xs text-muted-foreground ml-auto">2 mins ago</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-md">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-foreground">Product "Diamond Ring" updated</span>
                <span className="text-xs text-muted-foreground ml-auto">5 mins ago</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-md">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-foreground">Theme colors updated</span>
                <span className="text-xs text-muted-foreground ml-auto">10 mins ago</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard; 
