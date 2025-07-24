import React, { useState, useMemo, useEffect } from 'react';
import { Package, Plus, Search, Edit, Upload, X, Trash2, TrendingUp, ShoppingBag, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { productService, type Product, type CreateProductRequest } from '@/services/api';

const AdminProducts: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // API state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Pagination state
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Total counts (not affected by search/filters)
  const [totalActiveProducts, setTotalActiveProducts] = useState(0);
  const [totalInactiveProducts, setTotalInactiveProducts] = useState(0);
  const [avgProductPrice, setAvgProductPrice] = useState(0);

  // Load total statistics (not affected by filters)
  const loadTotalStats = async () => {
    try {
      // Get all active products to calculate total stats
      const activeData = await productService.getProducts({ status: 'active', limit: 1000 });
      const inactiveData = await productService.getProducts({ status: 'inactive', limit: 1000 });

      setTotalActiveProducts(activeData.pagination.total);
      setTotalInactiveProducts(inactiveData.pagination.total);

      // Calculate average price from active products
      if (activeData.products.length > 0) {
        const totalPrice = activeData.products.reduce((sum, p) => sum + parseFloat(p.basePrice), 0);
        setAvgProductPrice(totalPrice / activeData.products.length);
      } else {
        setAvgProductPrice(0);
      }
    } catch (error) {
      console.error('Failed to load total stats:', error);
    }
  };

  // Load products from API
  const loadProducts = async () => {
    try {
      setLoading(true);
      const params: {
        search?: string;
        category?: string;
        status?: string;
        page?: number;
        limit?: number;
      } = {
        page: currentPage,
        limit: itemsPerPage
      };

      if (searchTerm) params.search = searchTerm;
      if (filterCategory !== 'All') params.category = filterCategory;
      if (filterStatus !== 'All') params.status = (filterStatus === 'In Stock' ? 'active' : 'inactive');

      const data = await productService.getProducts(params);
      setProducts(data.products);
      setTotalPages(data.pagination.totalPages);
      setTotalProducts(data.pagination.total);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load products on component mount and when filters change
  useEffect(() => {
    loadProducts();
  }, [searchTerm, filterStatus, filterCategory, currentPage]);

  // Load total stats on component mount
  useEffect(() => {
    loadTotalStats();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, filterStatus, filterCategory]);

  const handleCreateProduct = () => {
    setSelectedImage(null);
    setShowCreateModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedImage(product.images?.[0] || null);
    setShowEditModal(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setDeleting(true);
      await productService.deleteProduct(productToDelete.id);
      toast.success(`Product "${productToDelete.name}" deleted successfully!`);
      await loadProducts(); // Refresh the list
      await loadTotalStats(); // Refresh total stats
      setShowDeleteDialog(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Imgur upload function (commented out for demo)
  // const uploadToImgur = async (file: File): Promise<string> => {
  //   setUploading(true);
  //   try {
  //     const formData = new FormData();
  //     formData.append('image', file);

  //     const response = await fetch('https://api.imgur.com/3/image', {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': 'Client-ID 546c25a59c58ad7', // Demo client ID - replace with your actual one
  //       },
  //       body: formData,
  //     });

  //     const data = await response.json();

  //     if (data.success) {
  //       return data.data.link;
  //     } else {
  //       throw new Error('Upload failed');
  //     }
  //   } catch (error) {
  //     console.error('Imgur upload error:', error);
  //     throw error;
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error('Please select a valid image file.');
          return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error('Image size should be less than 10MB.');
          return;
        }

        // Create local preview first
        const reader = new FileReader();
        reader.onload = (e) => {
          setSelectedImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Uncomment for actual Imgur upload:
        // const imgurUrl = await uploadToImgur(file);
        // setSelectedImage(imgurUrl);
      } catch (error) {
        toast.error('Failed to upload image. Please try again.');
      }
    }
  };

  const handleCreateSubmit = async (productData: Omit<Product, 'id' | 'sku' | 'createdAt' | 'updatedAt' | 'productType'>) => {
    try {
      setCreating(true);
      const createData: CreateProductRequest = {
        name: productData.name,
        category: (productData as any).category, // Will be validated by API
        charmDescription: productData.charmDescription,
        chainDescription: productData.chainDescription,
        basePrice: parseFloat(productData.basePrice),
        images: selectedImage ? [selectedImage] : [],
        stockAlertThreshold: productData.stockAlertThreshold
      };

      if (productData.metaDescription) {
        createData.metaDescription = productData.metaDescription;
      }

      await productService.createProduct(createData);
      toast.success('Product created successfully!');
      setShowCreateModal(false);
      setSelectedImage(null);
      await loadProducts(); // Refresh the list
      await loadTotalStats(); // Refresh total stats
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('Failed to create product. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleEditSubmit = async (productData: Omit<Product, 'id' | 'sku' | 'createdAt' | 'updatedAt' | 'productType'>) => {
    if (!selectedProduct) return;

    try {
      setUpdating(true);
      const updateData: Partial<CreateProductRequest> = {
        name: productData.name,
        charmDescription: productData.charmDescription,
        chainDescription: productData.chainDescription,
        basePrice: parseFloat(productData.basePrice),
        images: selectedImage ? [selectedImage] : [],
        stockAlertThreshold: productData.stockAlertThreshold
      };

      if (productData.metaDescription) {
        updateData.metaDescription = productData.metaDescription;
      }

      await productService.updateProduct(selectedProduct.id, updateData);
      toast.success('Product updated successfully!');
      setShowEditModal(false);
      setSelectedProduct(null);
      setSelectedImage(null);
      await loadProducts(); // Refresh the list
      await loadTotalStats(); // Refresh total stats
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error('Failed to update product. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categoryDisplayNames = {
    'chain': 'Chain',
    'bracelet': 'Bracelet',
    'anklet': 'Anklet'
  };

  // Calculate statistics for widgets
  const inStockProducts = totalActiveProducts;
  const outOfStockProducts = totalInactiveProducts;
  const avgPrice = avgProductPrice;

  if (loading && products.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading products...</p>
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
            <Package className="w-8 h-8" />
            Product Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your jewelry inventory, add new products, and update existing items
          </p>
        </div>
        <Button onClick={handleCreateProduct} disabled={creating}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search products by name or description..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Modern Category Dropdown */}
        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[160px]"
          >
            <option value="All">All Categories</option>
            <option value="chain">Chain</option>
            <option value="bracelet">Bracelet</option>
            <option value="anklet">Anklet</option>
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Modern Status Dropdown */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[140px]"
          >
            <option value="All">All Products</option>
            <option value="In Stock">In Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Enhanced Product Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-2xl">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-900">{totalActiveProducts + totalInactiveProducts}</div>
              <div className="text-xs text-blue-600 font-medium">Products</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-700 mb-1">Total Inventory</h3>
            <p className="text-xs text-blue-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Active products
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500 rounded-2xl">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-900">{inStockProducts}</div>
              <div className="text-xs text-green-600 font-medium">Available</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-green-700 mb-1">Available Stock</h3>
            <p className="text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Ready for sale ({(totalActiveProducts + totalInactiveProducts) > 0 ? ((inStockProducts / (totalActiveProducts + totalInactiveProducts)) * 100).toFixed(0) : 0}%)
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500 rounded-2xl">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-900">{outOfStockProducts}</div>
              <div className="text-xs text-red-600 font-medium">Out of Stock</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-700 mb-1">Needs Attention</h3>
            <p className="text-xs text-red-600 flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Requires restocking
            </p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-2xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-900">₹{(avgPrice / 1000).toFixed(0)}K</div>
              <div className="text-xs text-purple-600 font-medium">Avg Price</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-purple-700 mb-1">Average Price</h3>
            <p className="text-xs text-purple-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Per product value
            </p>
          </div>
        </Card>
      </div>

      {/* Products Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Product Inventory</h2>
          <div className="text-right">
            <p className="text-muted-foreground">
              {products.length} of {totalProducts} products
              {searchTerm && ` matching "${searchTerm}"`}
              {filterStatus !== 'All' && ` (${filterStatus})`}
              {filterCategory !== 'All' && ` in ${categoryDisplayNames[filterCategory as keyof typeof categoryDisplayNames]}`}
            </p>
            {totalPages > 1 && (
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterStatus !== 'All' || filterCategory !== 'All'
                ? 'No products match your current filters'
                : 'Start by adding your first product'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="aspect-square relative bg-muted">
                  <img
                    src={product.images?.[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEyMCIgcj0iNDAiIGZpbGw9IiM5Q0E4QjQiLz4KPHJlY3QgeD0iMTEwIiB5PSIxODAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgZmlsbD0iIzlDQThCNCIvPgo8L3N2Zz4='}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEyMCIgcj0iNDAiIGZpbGw9IiM5Q0E4QjQiLz4KPHJlY3QgeD0iMTEwIiB5PSIxODAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgZmlsbD0iIzlDQThCNCIvPgo8L3N2Zz4=';
                    }}
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <Badge
                      variant={product.isActive ? 'default' : 'destructive'}
                      className={`text-xs ${product.isActive ? 'bg-green-500 hover:bg-green-600' : ''}`}
                    >
                      {product.isActive ? 'In Stock' : 'Out of Stock'}
                    </Badge>
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {product.productType?.displayName || categoryDisplayNames[product.productType?.name as keyof typeof categoryDisplayNames]}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg line-clamp-1 mt-3" title={product.name}>{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]" title={product.charmDescription}>
                      {product.charmDescription}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-primary">₹{Number(product.basePrice).toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          className="h-9 px-3 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300"
                          disabled={updating}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product)}
                          className="h-9 px-3 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
                          disabled={deleting}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setProductToDelete(null);
        }}
        onConfirm={confirmDeleteProduct}
        title="Delete Product"
        description={`Are you sure you want to delete "${productToDelete?.name}"? This action cannot be undone and will remove the product from your inventory.`}
        confirmText={deleting ? "Deleting..." : "Delete Product"}
        cancelText="Cancel"
        variant="destructive"
        confirmButtonVariant="destructive"
      />

      {/* Create Product Modal */}
      {showCreateModal && (
        <ProductModal
          mode="create"
          onSave={handleCreateSubmit}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedImage(null);
          }}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          handleImageUpload={handleImageUpload}
          uploading={false}
          saving={creating}
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <ProductModal
          mode="edit"
          product={selectedProduct}
          onSave={handleEditSubmit}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
            setSelectedImage(null);
          }}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          handleImageUpload={handleImageUpload}
          uploading={false}
          saving={updating}
        />
      )}
    </div>
  );
};

// Product Modal Component
interface ProductModalProps {
  mode: 'create' | 'edit';
  product?: Product;
  onSave: (data: Omit<Product, 'id' | 'sku' | 'createdAt' | 'updatedAt' | 'productType'>) => void;
  onClose: () => void;
  selectedImage: string | null;
  setSelectedImage: (image: string | null) => void;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  saving: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({
  mode,
  product,
  onSave,
  onClose,
  selectedImage,
  setSelectedImage,
  handleImageUpload,
  uploading,
  saving
}) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: (product?.productType?.name as 'chain' | 'bracelet') || 'chain',
    charmDescription: product?.charmDescription || '',
    basePrice: product?.basePrice || '',
    discountedPrice: '',
    isActive: product?.isActive ?? true
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.charmDescription || !formData.basePrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    const productData: any = {
      name: formData.name,
      charmDescription: formData.charmDescription,
      chainDescription: formData.charmDescription, // Use description for both fields as per API requirement
      basePrice: formData.basePrice,
      isActive: formData.isActive,
      metaDescription: formData.discountedPrice || '', // Store discounted price in metaDescription
      stockAlertThreshold: 5, // Default value
      images: selectedImage ? [selectedImage] : [],
      category: formData.category // This will be used by the API to determine productTypeId
    };

    onSave(productData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {mode === 'create' ? 'Add New Product' : 'Edit Product'}
            </h2>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Half - Image Upload */}
            <div>
              <Label>Product Image</Label>
              <div className="mt-2">
                {selectedImage ? (
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Product preview"
                      className="w-full h-64 object-cover rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={() => setSelectedImage(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground rounded-lg p-8 text-center h-64 flex flex-col justify-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Click to upload product image
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Choose Image'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Half - Form Fields */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-name">Product Name *</Label>
                <Input
                  id="product-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <Label htmlFor="product-category">Category *</Label>
                <div className="relative">
                  <select
                    id="product-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'chain' | 'bracelet' })}
                    className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
                  >
                    <option value="chain">Chain</option>
                    <option value="bracelet">Bracelet/Anklet</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="product-description">Description *</Label>
                <Input
                  id="product-description"
                  value={formData.charmDescription}
                  onChange={(e) => setFormData({ ...formData, charmDescription: e.target.value })}
                  placeholder="Describe the product"
                />
              </div>

              <div>
                <Label htmlFor="product-price">Price *</Label>
                <Input
                  id="product-price"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  placeholder="Enter price"
                />
              </div>

              <div>
                <Label htmlFor="discounted-price">Discounted Price</Label>
                <Input
                  id="discounted-price"
                  type="number"
                  value={formData.discountedPrice}
                  onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })}
                  placeholder="Enter discounted price (optional)"
                />
              </div>

              <div>
                <Label htmlFor="product-status">Stock Status *</Label>
                <div className="relative">
                  <select
                    id="product-status"
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                    className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
                  >
                    <option value="active">In Stock</option>
                    <option value="inactive">Out of Stock</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1"
            >
              {saving ? `${mode === 'create' ? 'Creating' : 'Updating'}...` : `${mode === 'create' ? 'Create' : 'Update'} Product`}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts; 
