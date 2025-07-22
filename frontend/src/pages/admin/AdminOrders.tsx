import React, { useState } from 'react';
import { ShoppingCart, TrendingUp, Clock, CheckCircle, Edit, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AdminOrders: React.FC = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'secondary';
      case 'Processing':
        return 'default';
      case 'Shipped':
        return 'outline';
      case 'Delivered':
        return 'default';
      default:
        return 'default';
    }
  };

  const sampleOrders = [
    { id: '#ORD-001', customer: 'Sarah Johnson', item: 'Diamond Solitaire Ring', amount: '₹2,04,999', status: 'Pending', date: '2024-01-15' },
    { id: '#ORD-002', customer: 'Michael Chen', item: 'Gold Chain Necklace', amount: '₹73,999', status: 'Processing', date: '2024-01-15' },
    { id: '#ORD-003', customer: 'Emily Davis', item: 'Pearl Bracelet', amount: '₹28,999', status: 'Shipped', date: '2024-01-14' },
    { id: '#ORD-004', customer: 'Robert Wilson', item: 'Silver Watch', amount: '₹1,07,499', status: 'Delivered', date: '2024-01-14' },
    { id: '#ORD-005', customer: 'Lisa Brown', item: 'Emerald Earrings', amount: '₹1,56,999', status: 'Pending', date: '2024-01-13' },
  ];

  // Filter orders based on search and filter
  const filteredOrders = sampleOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.item.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'All' || order.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            Order Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Track and manage customer orders, process payments, and handle shipping
          </p>
        </div>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">298</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹37,24,231</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search orders by ID, customer, or item..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-border rounded-md bg-background text-foreground min-w-[140px]"
        >
          <option value="All">All Orders</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            {filteredOrders.length} of {sampleOrders.length} orders
            {searchTerm && ` matching "${searchTerm}"`}
            {filterStatus !== 'All' && ` (${filterStatus})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? `No orders match "${searchTerm}"` : `No orders with status "${filterStatus}"`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{order.id}</h3>
                      <p className="text-sm text-muted-foreground">{order.customer}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div>
                      <p className="text-sm font-medium">{order.item}</p>
                      <p className="text-xs text-muted-foreground">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{order.amount}</p>
                    </div>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditOrder(order)}
                      className="h-9 px-3"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Order Modal */}
      {showEditModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Order {selectedOrder.id}</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-customer">Customer Name</Label>
                <Input id="edit-customer" defaultValue={selectedOrder.customer} />
              </div>
              <div>
                <Label htmlFor="edit-item">Item</Label>
                <Input id="edit-item" defaultValue={selectedOrder.item} />
              </div>
              <div>
                <Label htmlFor="edit-amount">Amount</Label>
                <Input id="edit-amount" defaultValue={selectedOrder.amount.replace('₹', '')} />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  defaultValue={selectedOrder.status}
                  className="w-full p-2 border border-border rounded-md bg-background"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-date">Order Date</Label>
                <Input id="edit-date" type="date" defaultValue={selectedOrder.date} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowEditModal(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => setShowEditModal(false)} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders; 
