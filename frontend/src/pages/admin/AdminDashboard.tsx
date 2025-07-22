import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Settings,
  BarChart3,
  DollarSign
} from 'lucide-react';

const AdminDashboard: React.FC = () => {

  const stats = [
    {
      title: 'Total Revenue',
      value: '₹20,24,567',
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
      title: 'Revenue Growth',
      value: '23.4%',
      change: '+5.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ];

  const quickActions = [
    {
      title: 'Product Management',
      description: 'Add, edit, or remove jewelry products',
      href: '/admin/products',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      title: 'Order Management',
      description: 'View and manage customer orders',
      href: '/admin/orders',
      icon: ShoppingCart,
      color: 'bg-green-500'
    },
    {
      title: 'Analytics',
      description: 'View detailed reports and insights',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'bg-orange-500'
    },
    {
      title: 'Settings',
      description: 'Configure themes, fonts, and preferences',
      href: '/admin/settings',
      icon: Settings,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="p-6">
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
    </div>
  );
};

export default AdminDashboard; 
