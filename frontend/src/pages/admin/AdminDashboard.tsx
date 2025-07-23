import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Settings,
  BarChart3,
  DollarSign,
  Clock,
  User,
  Receipt
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AdminDashboard: React.FC = () => {

  const stats = [
    {
      title: 'Total Revenue',
      value: '₹20.2L',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      bgGradient: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
      iconBg: 'bg-green-500',
      textColor: 'text-green-900',
      subtitleColor: 'text-green-700',
      changeColor: 'text-green-600'
    },
    {
      title: 'Products',
      value: '247',
      change: '+3.2%',
      trend: 'up',
      icon: Package,
      bgGradient: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
      iconBg: 'bg-blue-500',
      textColor: 'text-blue-900',
      subtitleColor: 'text-blue-700',
      changeColor: 'text-blue-600'
    },
    {
      title: 'Orders',
      value: '89',
      change: '+8.1%',
      trend: 'up',
      icon: ShoppingCart,
      bgGradient: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
      iconBg: 'bg-purple-500',
      textColor: 'text-purple-900',
      subtitleColor: 'text-purple-700',
      changeColor: 'text-purple-600'
    },
    {
      title: 'Revenue Growth',
      value: '23.4%',
      change: '+5.2%',
      trend: 'up',
      icon: TrendingUp,
      bgGradient: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200',
      iconBg: 'bg-orange-500',
      textColor: 'text-orange-900',
      subtitleColor: 'text-orange-700',
      changeColor: 'text-orange-600'
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
      title: 'Expense Tracker',
      description: 'Track and manage business expenses',
      href: '/admin/expenses',
      icon: Receipt,
      color: 'bg-red-500'
    },
    {
      title: 'Analytics',
      description: 'View detailed reports and insights',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'bg-orange-500'
    }
  ];

  // Recent orders data - replace with API call
  const recentOrders = [
    {
      id: '#ORD-001',
      customer: 'Sarah Johnson',
      item: 'Diamond Solitaire Ring',
      amount: '₹2,04,999',
      status: 'pending',
      date: '2024-01-15',
      time: '2 mins ago'
    },
    {
      id: '#ORD-002',
      customer: 'Michael Chen',
      item: 'Gold Chain Necklace',
      amount: '₹73,999',
      status: 'processing',
      date: '2024-01-15',
      time: '15 mins ago'
    },
    {
      id: '#ORD-003',
      customer: 'Emily Davis',
      item: 'Pearl Bracelet',
      amount: '₹28,999',
      status: 'shipped',
      date: '2024-01-14',
      time: '1 hour ago'
    },
    {
      id: '#ORD-004',
      customer: 'Robert Wilson',
      item: 'Silver Watch',
      amount: '₹1,07,499',
      status: 'delivered',
      date: '2024-01-14',
      time: '3 hours ago'
    },
    {
      id: '#ORD-005',
      customer: 'Lisa Brown',
      item: 'Emerald Earrings',
      amount: '₹1,56,999',
      status: 'pending',
      date: '2024-01-13',
      time: '1 day ago'
    }
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'shipped':
        return 'outline';
      case 'delivered':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'delivered':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

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
            <div key={stat.title} className={`${stat.bgGradient} p-6 rounded-lg border`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${stat.iconBg} rounded-2xl`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</div>
                  <div className={`text-xs font-medium ${stat.changeColor}`}>This Month</div>
                </div>
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${stat.subtitleColor} mb-1`}>{stat.title}</h3>
                <p className={`text-xs ${stat.changeColor} flex items-center`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.change} from last month
                </p>
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

      {/* Recent Orders */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Recent Orders</h2>
          <Link
            to="/admin/orders"
            className="text-primary hover:underline text-sm font-medium"
          >
            View All Orders
          </Link>
        </div>
        <div className="space-y-4">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-card rounded-lg flex items-center justify-center border">
                  <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-foreground">{order.id}</h3>
                    <Badge variant={getStatusVariant(order.status)} className="capitalize">
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.customer}</p>
                  <p className="text-sm text-muted-foreground">{order.item}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-semibold text-foreground">{order.amount}</p>
                  <p className="text-xs text-muted-foreground">{order.time}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`}></div>
              </div>
            </div>
          ))}
        </div>

        {recentOrders.length === 0 && (
          <div className="text-center py-8">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No recent orders</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 
