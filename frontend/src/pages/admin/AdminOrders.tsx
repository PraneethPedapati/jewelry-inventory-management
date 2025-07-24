import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Edit, Download, Eye, ChevronLeft, ChevronRight, Clock, User, MapPin, Phone, Mail, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { orderService, type Order, type OrderItem } from '@/services/api';

interface OrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderData: Partial<Order>) => void;
}

const AdminOrders: React.FC = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // API state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Pagination state
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // Export date range
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');

  // Load orders from API
  const loadOrders = async () => {
    try {
      setLoading(true);
      const params: {
        search?: string;
        status?: string;
        page?: number;
        limit?: number;
      } = {
        page: currentPage,
        limit: itemsPerPage
      };

      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== 'All') params.status = filterStatus.toLowerCase();

      const data = await orderService.getOrders(params);
      setOrders(data.orders);
      setTotalPages(data.pagination.totalPages);
      setTotalOrders(data.pagination.total);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load orders on component mount and when filters change
  useEffect(() => {
    loadOrders();
  }, [searchTerm, filterStatus, currentPage]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, filterStatus]);

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleUpdateOrder = async (orderData: Partial<Order>) => {
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      await orderService.updateOrder(selectedOrder.id, orderData);
      toast.success('Order updated successfully!');
      setShowEditModal(false);
      setSelectedOrder(null);
      await loadOrders(); // Refresh the list
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Failed to update order. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleExportOrders = async () => {
    try {
      setExporting(true);
      // This would typically download a CSV/Excel file
      // For now, we'll just show a success message
      toast.success('Orders export feature will be implemented soon!');
      setShowExportModal(false);
    } catch (error) {
      console.error('Failed to export orders:', error);
      toast.error('Failed to export orders. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
      case 'processing':
        return 'default';
      case 'shipped':
        return 'outline';
      case 'delivered':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'confirmed':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'processing':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'shipped':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'delivered':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString()}`;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && orders.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      </div>
    );
  }

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
        <Button onClick={() => setShowExportModal(true)} disabled={exporting}>
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
          <option value="Confirmed">Confirmed</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterStatus !== 'All'
                ? 'No orders match your current filters'
                : 'No orders have been placed yet'}
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                        <p className="text-muted-foreground text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <Badge
                        variant={getStatusVariant(order.status)}
                        className={`${getStatusColor(order.status)} font-medium`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {order.customerEmail}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{order.customerPhone}</p>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Address on file
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                          <p className="text-muted-foreground">
                            {order.items?.length || 0} item(s)
                          </p>
                        </div>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="text-sm">{order.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditOrder(order)}
                      disabled={updating}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        // Could open a detailed view modal here
                        toast.info('Order details view coming soon!');
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="h-10 px-3"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={loading}
                  className="h-10 w-10"
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="h-10 px-3"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && selectedOrder && (
        <OrderEditModal
          order={selectedOrder}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedOrder(null);
          }}
          onSave={handleUpdateOrder}
          updating={updating}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExportOrders}
          exporting={exporting}
          exportDateFrom={exportDateFrom}
          setExportDateFrom={setExportDateFrom}
          exportDateTo={exportDateTo}
          setExportDateTo={setExportDateTo}
        />
      )}
    </div>
  );
};

// Order Edit Modal Component
interface OrderEditModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderData: Partial<Order>) => void;
  updating: boolean;
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({
  order,
  isOpen,
  onClose,
  onSave,
  updating
}) => {
  const [formData, setFormData] = useState({
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    status: order.status,
    notes: order.notes || ''
  });

  const handleSubmit = () => {
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Edit Order</h2>
            <Button variant="outline" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name</label>
                <Input
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  placeholder="Customer email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="Customer phone"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Order['status'] })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <textarea
                value={formData.customerAddress}
                onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                placeholder="Customer address"
                className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[80px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Order notes"
                className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleSubmit} disabled={updating} className="flex-1">
              {updating ? 'Updating...' : 'Update Order'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={updating}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export Modal Component
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  exporting: boolean;
  exportDateFrom: string;
  setExportDateFrom: (date: string) => void;
  exportDateTo: string;
  setExportDateTo: (date: string) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  exporting,
  exportDateFrom,
  setExportDateFrom,
  exportDateTo,
  setExportDateTo
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Export Orders</h2>
            <Button variant="outline" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">From Date</label>
              <Input
                type="date"
                value={exportDateFrom}
                onChange={(e) => setExportDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">To Date</label>
              <Input
                type="date"
                value={exportDateTo}
                onChange={(e) => setExportDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={onExport} disabled={exporting} className="flex-1">
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={exporting}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders; 
