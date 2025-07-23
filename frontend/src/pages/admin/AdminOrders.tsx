import React, { useState } from 'react';
import { ShoppingCart, Edit, Search, Download, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Order {
  id: string;
  customer: string;
  item: string;
  amount: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  email: string;
  phone: string;
  address: string;
}

const AdminOrders: React.FC = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Export date range
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleUpdateOrder = (orderData: Partial<Order>) => {
    if (selectedOrder) {
      const updatedOrders = allOrders.map(order =>
        order.id === selectedOrder.id ? { ...order, ...orderData } : order
      );
      setAllOrders(updatedOrders);
      setShowEditModal(false);
      setSelectedOrder(null);
    }
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
      case 'Cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Expanded sample orders data
  const [allOrders, setAllOrders] = useState<Order[]>([
    { id: '#ORD-001', customer: 'Sarah Johnson', item: 'Diamond Solitaire Ring', amount: '₹2,04,999', status: 'Pending', date: '2024-01-15', email: 'sarah@email.com', phone: '+91 9876543210', address: '123 Main St, Mumbai, MH 400001' },
    { id: '#ORD-002', customer: 'Michael Chen', item: 'Gold Chain Necklace', amount: '₹73,999', status: 'Processing', date: '2024-01-15', email: 'michael@email.com', phone: '+91 9876543211', address: '456 Oak Ave, Delhi, DL 110001' },
    { id: '#ORD-003', customer: 'Emily Davis', item: 'Pearl Bracelet', amount: '₹28,999', status: 'Shipped', date: '2024-01-14', email: 'emily@email.com', phone: '+91 9876543212', address: '789 Pine Rd, Bangalore, KA 560001' },
    { id: '#ORD-004', customer: 'Robert Wilson', item: 'Silver Watch', amount: '₹1,07,499', status: 'Delivered', date: '2024-01-14', email: 'robert@email.com', phone: '+91 9876543213', address: '321 Elm St, Chennai, TN 600001' },
    { id: '#ORD-005', customer: 'Lisa Brown', item: 'Emerald Earrings', amount: '₹1,56,999', status: 'Pending', date: '2024-01-13', email: 'lisa@email.com', phone: '+91 9876543214', address: '654 Maple Dr, Pune, MH 411001' },
    { id: '#ORD-006', customer: 'David Lee', item: 'Ruby Ring', amount: '₹89,999', status: 'Processing', date: '2024-01-13', email: 'david@email.com', phone: '+91 9876543215', address: '987 Cedar Ln, Hyderabad, TS 500001' },
    { id: '#ORD-007', customer: 'Anna Smith', item: 'Platinum Bracelet', amount: '₹2,45,999', status: 'Shipped', date: '2024-01-12', email: 'anna@email.com', phone: '+91 9876543216', address: '159 Birch St, Kolkata, WB 700001' },
    { id: '#ORD-008', customer: 'James Miller', item: 'Diamond Earrings', amount: '₹1,89,999', status: 'Delivered', date: '2024-01-12', email: 'james@email.com', phone: '+91 9876543217', address: '753 Walnut Ave, Ahmedabad, GJ 380001' },
    { id: '#ORD-009', customer: 'Sophie Wilson', item: 'Gold Anklet', amount: '₹45,999', status: 'Pending', date: '2024-01-11', email: 'sophie@email.com', phone: '+91 9876543218', address: '951 Spruce Rd, Jaipur, RJ 302001' },
    { id: '#ORD-010', customer: 'Mark Johnson', item: 'Silver Chain', amount: '₹35,999', status: 'Cancelled', date: '2024-01-11', email: 'mark@email.com', phone: '+91 9876543219', address: '357 Ash Dr, Lucknow, UP 226001' },
    { id: '#ORD-011', customer: 'Rachel Green', item: 'Pearl Necklace', amount: '₹95,999', status: 'Processing', date: '2024-01-10', email: 'rachel@email.com', phone: '+91 9876543220', address: '246 Oak St, Bhopal, MP 462001' },
    { id: '#ORD-012', customer: 'John Doe', item: 'Diamond Ring', amount: '₹3,25,999', status: 'Shipped', date: '2024-01-10', email: 'john@email.com', phone: '+91 9876543221', address: '135 Pine Ave, Indore, MP 452001' },
    { id: '#ORD-013', customer: 'Monica Ross', item: 'Emerald Bracelet', amount: '₹1,75,999', status: 'Delivered', date: '2024-01-09', email: 'monica@email.com', phone: '+91 9876543222', address: '864 Elm Rd, Nagpur, MH 440001' },
    { id: '#ORD-014', customer: 'Ross Geller', item: 'Gold Ring', amount: '₹65,999', status: 'Pending', date: '2024-01-09', email: 'ross@email.com', phone: '+91 9876543223', address: '579 Maple St, Surat, GJ 395001' },
    { id: '#ORD-015', customer: 'Chandler Bing', item: 'Silver Bracelet', amount: '₹42,999', status: 'Processing', date: '2024-01-08', email: 'chandler@email.com', phone: '+91 9876543224', address: '792 Cedar Ave, Visakhapatnam, AP 530001' }
  ]);

  // Filter orders based on search and filter
  const filteredOrders = allOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.item.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'All' || order.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Export functionality
  const handleExport = (format: 'csv' | 'xlsx') => {
    // Validate date fields are provided
    if (!exportDateFrom || !exportDateTo) {
      alert('Please select both From Date and To Date for export.');
      return;
    }

    const fromDate = new Date(exportDateFrom);
    const toDate = new Date(exportDateTo);

    if (fromDate > toDate) {
      alert('From Date cannot be later than To Date.');
      return;
    }

    const ordersToExport = allOrders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= fromDate && orderDate <= toDate;
    });

    if (ordersToExport.length === 0) {
      alert('No orders found in the selected date range.');
      return;
    }

    if (format === 'csv') {
      exportToCSV(ordersToExport);
    } else {
      exportToXLSX(ordersToExport);
    }
    setShowExportModal(false);
  };

  const exportToCSV = (orders: Order[]) => {
    const headers = ['Order ID', 'Customer', 'Item', 'Amount', 'Status', 'Date', 'Email', 'Phone', 'Address'];
    const csvContent = [
      headers.join(','),
      ...orders.map(order => [
        order.id,
        `"${order.customer}"`,
        `"${order.item}"`,
        order.amount,
        order.status,
        order.date,
        order.email,
        order.phone,
        `"${order.address}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${exportDateFrom}_to_${exportDateTo}.csv`;
    link.click();
  };

  const exportToXLSX = (orders: Order[]) => {
    // Create proper XLSX content using HTML table format with company header
    const headers = ['Order ID', 'Customer', 'Item', 'Amount', 'Status', 'Date', 'Email', 'Phone', 'Address'];

    let xlsxContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            .company-header { 
              text-align: center; 
              margin-bottom: 30px; 
              padding: 20px;
              border-bottom: 2px solid #333;
            }
            .company-logo { 
              font-size: 24px; 
              font-weight: bold; 
              color: #333;
              margin-bottom: 10px;
            }
            .company-name { 
              font-size: 20px; 
              color: #666;
              margin-bottom: 5px;
            }
            .export-date { 
              font-size: 12px; 
              color: #888;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin-top: 20px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px; 
              text-align: left; 
            }
            th { 
              background-color: #f8f9fa; 
              font-weight: bold;
              color: #333;
            }
            .order-total {
              margin-top: 20px;
              text-align: right;
              font-weight: bold;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="company-header">
            <div class="company-logo">💎 Jewelry Store</div>
            <div class="company-name">Premium Jewelry Collection</div>
            <div class="export-date">Order Export - ${new Date().toLocaleDateString('en-IN')}</div>
            <div class="export-date">Date Range: ${exportDateFrom} to ${exportDateTo}</div>
          </div>
          
          <table>
            <tr>
              ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
    `;

    orders.forEach(order => {
      xlsxContent += `
        <tr>
          <td>${order.id}</td>
          <td>${order.customer}</td>
          <td>${order.item}</td>
          <td>${order.amount}</td>
          <td>${order.status}</td>
          <td>${order.date}</td>
          <td>${order.email}</td>
          <td>${order.phone}</td>
          <td>${order.address}</td>
        </tr>
      `;
    });

    // Add summary at the bottom
    const totalAmount = orders.reduce((sum, order) => {
      const amount = parseFloat(order.amount.replace('₹', '').replace(/,/g, ''));
      return sum + amount;
    }, 0);

    xlsxContent += `
          </table>
          
          <div class="order-total">
            <p>Total Orders: ${orders.length}</p>
            <p>Total Amount: ₹${totalAmount.toLocaleString('en-IN')}</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([xlsxContent], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `jewelry_store_orders_${exportDateFrom}_to_${exportDateTo}.xlsx`;
    link.click();
  };

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
        <Button onClick={() => setShowExportModal(true)}>
          <Download className="w-4 h-4 mr-2" />
          Export Orders
        </Button>
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
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            Showing {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
            {searchTerm && ` matching "${searchTerm}"`}
            {filterStatus !== 'All' && ` (${filterStatus})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? `No orders match "${searchTerm}"` : `No orders with status "${filterStatus}"`}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {currentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{order.id}</h3>
                        <p className="text-sm text-muted-foreground">{order.customer}</p>
                        <p className="text-sm text-muted-foreground">{order.item}</p>
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
                        className="h-9 px-3 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Export Orders</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportModal(false)}
                className="h-9 w-9 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="date-from">From Date *</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={exportDateFrom}
                  onChange={(e) => setExportDateFrom(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="date-to">To Date *</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={exportDateTo}
                  onChange={(e) => setExportDateTo(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Both dates are required for export. Only orders within the selected date range will be exported.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleExport('csv')}
                  variant="outline"
                  className="flex-1"
                  disabled={!exportDateFrom || !exportDateTo}
                >
                  Export as CSV
                </Button>
                <Button
                  onClick={() => handleExport('xlsx')}
                  className="flex-1"
                  disabled={!exportDateFrom || !exportDateTo}
                >
                  Export as XLSX
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && selectedOrder && (
        <OrderEditModal
          order={selectedOrder}
          onSave={handleUpdateOrder}
          onClose={() => {
            setShowEditModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

// Order Edit Modal Component
interface OrderEditModalProps {
  order: Order;
  onSave: (data: Partial<Order>) => void;
  onClose: () => void;
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({ order, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    customer: order.customer,
    item: order.item,
    amount: order.amount.replace('₹', '').replace(/,/g, ''),
    status: order.status,
    date: order.date,
    email: order.email,
    phone: order.phone,
    address: order.address
  });

  const handleSubmit = () => {
    const updatedOrder = {
      ...formData,
      amount: `₹${Number(formData.amount).toLocaleString()}`
    };
    onSave(updatedOrder);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Edit Order {order.id}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 w-9 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-customer">Customer Name</Label>
            <Input
              id="edit-customer"
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="edit-item">Item</Label>
            <Input
              id="edit-item"
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="edit-amount">Amount</Label>
            <Input
              id="edit-amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="edit-status">Status</Label>
            <select
              id="edit-status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Order['status'] })}
              className="w-full p-2 border border-border rounded-md bg-background"
            >
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="edit-date">Order Date</Label>
            <Input
              id="edit-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="edit-address">Address</Label>
            <textarea
              id="edit-address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2 border border-border rounded-md bg-background min-h-[80px] resize-none"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders; 
