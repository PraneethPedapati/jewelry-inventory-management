import React, { useState, useMemo } from 'react';
import { Package, Plus, Search, Edit, Upload, X, Trash2, TrendingUp, ShoppingBag, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: number;
  name: string;
  category: 'chain' | 'bracelet-anklet';
  price: string;
  originalPrice?: string;
  stock: 'In Stock' | 'Out of Stock';
  description: string;
  image: string;
  createdAt?: string;
}

const AdminProducts: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  // const [uploading, setUploading] = useState(false);

  const handleCreateProduct = () => {
    setSelectedImage(null);
    setShowCreateModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedImage(product.image || null);
    setShowEditModal(true);
  };

  const handleDeleteProduct = (productId: number) => {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      const updatedProducts = products.filter(product => product.id !== productId);
      setProducts(updatedProducts);
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
          alert('Please select a valid image file.');
          return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert('Image size should be less than 10MB.');
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
        alert('Failed to upload image. Please try again.');
      }
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'Diamond Solitaire Chain',
      category: 'chain',
      price: '₹2,04,999',
      originalPrice: '₹2,59,999',
      stock: 'In Stock',
      description: 'Elegant 1-carat diamond solitaire charm with sterling silver chain.',
      image: 'https://picsum.photos/300/300?random=1',
      createdAt: '2024-01-10T10:00:00Z'
    },
    {
      id: 2,
      name: 'Gold Heart Bracelet',
      category: 'bracelet-anklet',
      price: '₹73,999',
      stock: 'In Stock',
      description: 'Beautiful 18k gold heart charm bracelet with intricate link design.',
      image: 'https://picsum.photos/300/300?random=2',
      createdAt: '2024-01-01T10:00:00Z'
    },
    {
      id: 3,
      name: 'Silver Moon Anklet',
      category: 'bracelet-anklet',
      price: '₹16,499',
      originalPrice: '₹21,999',
      stock: 'Out of Stock',
      description: 'Classic sterling silver moon charm anklet with polished finish.',
      image: 'https://picsum.photos/300/300?random=3',
      createdAt: '2024-01-08T10:00:00Z'
    },
    {
      id: 4,
      name: 'Pearl Charm Bracelet',
      category: 'bracelet-anklet',
      price: '₹28,999',
      stock: 'In Stock',
      description: 'Lustrous freshwater pearl charm bracelet with sterling silver clasp.',
      image: 'https://picsum.photos/300/300?random=4',
      createdAt: '2024-01-12T10:00:00Z'
    },
    {
      id: 5,
      name: 'Sapphire Pendant Chain',
      category: 'chain',
      price: '₹2,72,999',
      stock: 'In Stock',
      description: 'Stunning blue sapphire pendant with diamonds on platinum chain.',
      image: 'https://picsum.photos/300/300?random=5',
      createdAt: '2024-01-11T10:00:00Z'
    },
    {
      id: 6,
      name: 'Rose Gold Anklet',
      category: 'bracelet-anklet',
      price: '₹1,56,999',
      stock: 'Out of Stock',
      description: 'Luxury rose gold charm anklet with delicate chain design.',
      image: 'https://picsum.photos/300/300?random=6',
      createdAt: '2023-12-25T10:00:00Z'
    }
  ]);

  const handleCreateSubmit = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      id: Math.max(...products.map(p => p.id), 0) + 1,
      ...productData
    };
    setProducts([...products, newProduct]);
    setShowCreateModal(false);
    setSelectedImage(null);
  };

  const handleEditSubmit = (productData: Omit<Product, 'id'>) => {
    if (selectedProduct) {
      const updatedProducts = products.map(product =>
        product.id === selectedProduct.id ? { ...productData, id: selectedProduct.id } : product
      );
      setProducts(updatedProducts);
      setShowEditModal(false);
      setSelectedProduct(null);
      setSelectedImage(null);
    }
  };

  // Filter products based on search, status, and category
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'All' || product.stock === filterStatus;
      const matchesCategory = filterCategory === 'All' || product.category === filterCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, searchTerm, filterStatus, filterCategory]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterCategory]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categoryDisplayNames = {
    'chain': 'Chain',
    'bracelet-anklet': 'Bracelet/Anklet'
  };

  // Calculate statistics for widgets
  const totalProducts = products.length;
  const inStockProducts = products.filter(p => p.stock === 'In Stock').length;
  const outOfStockProducts = products.filter(p => p.stock === 'Out of Stock').length;
  const avgPrice = products.reduce((sum, p) => sum + parseFloat(p.price.replace('₹', '').replace(/,/g, '')), 0) / totalProducts;

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
        <Button onClick={handleCreateProduct}>
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
            <option value="bracelet-anklet">Bracelet/Anklet</option>
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
              <div className="text-3xl font-bold text-blue-900">{totalProducts}</div>
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
              Ready for sale ({((inStockProducts / totalProducts) * 100).toFixed(0)}%)
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
            <h3 className="text-sm font-semibold text-red-700 mb-1">Stock Alerts</h3>
            <p className="text-xs text-red-600 flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Needs restocking
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
              <div className="text-xs text-purple-600 font-medium">Average</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-purple-700 mb-1">Average Value</h3>
            <p className="text-xs text-purple-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Per product value
            </p>
          </div>
        </Card>
      </div>

      {/* Product Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Product Inventory</h2>
          <div className="text-right">
            <p className="text-muted-foreground">
              {filteredProducts.length} of {products.length} products
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

        {filteredProducts.length === 0 ? (
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
            {paginatedProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="aspect-square relative bg-muted">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEyMCIgcj0iNDAiIGZpbGw9IiM5Q0E4QjQiLz4KPHJlY3QgeD0iMTEwIiB5PSIxODAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgZmlsbD0iIzlDQThCNCIvPgo8L3N2Zz4=';
                    }}
                  />
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    <Badge
                      variant={product.stock === 'In Stock' ? 'default' : 'destructive'}
                      className={`text-xs ${product.stock === 'In Stock' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                    >
                      {product.stock}
                    </Badge>
                    {product.originalPrice && (
                      <Badge variant="destructive" className="text-xs">
                        Sale
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {categoryDisplayNames[product.category]}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg line-clamp-1 mt-3" title={product.name}>{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]" title={product.description}>{product.description}</p>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-primary">{product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            {product.originalPrice}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          className="h-9 px-3 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="h-9 px-3 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
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
          <div className="flex items-center justify-center mt-8 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-10 px-3"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                // Show first page, last page, current page, and pages around current
                const showPage = page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1;

                if (!showPage) {
                  // Show dots for gaps
                  if (page === 2 && currentPage > 4) {
                    return <span key={page} className="px-2 text-muted-foreground">...</span>;
                  }
                  if (page === totalPages - 1 && currentPage < totalPages - 3) {
                    return <span key={page} className="px-2 text-muted-foreground">...</span>;
                  }
                  return null;
                }

                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="h-10 w-10 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-10 px-3"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

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
        />
      )}
    </div>
  );
};

// Product Modal Component
interface ProductModalProps {
  mode: 'create' | 'edit';
  product?: Product;
  onSave: (data: Omit<Product, 'id'>) => void;
  onClose: () => void;
  selectedImage: string | null;
  setSelectedImage: (image: string | null) => void;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({
  mode,
  product,
  onSave,
  onClose,
  selectedImage,
  setSelectedImage,
  handleImageUpload,
  uploading
}) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || 'chain' as 'chain' | 'bracelet-anklet',
    price: product?.price.replace('₹', '').replace(/,/g, '') || '',
    originalPrice: product?.originalPrice?.replace('₹', '').replace(/,/g, '') || '',
    stock: product?.stock || 'In Stock' as 'In Stock' | 'Out of Stock',
    description: product?.description || ''
  });

  const handleSubmit = () => {
    const productData: any = {
      name: formData.name,
      category: formData.category,
      price: `₹${Number(formData.price).toLocaleString()}`,
      originalPrice: formData.originalPrice ? `₹${Number(formData.originalPrice).toLocaleString()}` : undefined,
      stock: formData.stock,
      description: formData.description,
      image: selectedImage || '/api/placeholder/300/300',
      createdAt: new Date().toISOString()
    };

    onSave(productData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {mode === 'create' ? 'Create New Product' : 'Edit Product'}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 w-9 p-0 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Product Image */}
          <div className="space-y-4">
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
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      {uploading ? 'Uploading...' : 'Upload product image'}
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploading}
                    />
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" type="button" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Choose Image'}
                      </Button>
                    </Label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Product Details */}
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
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as 'chain' | 'bracelet-anklet' })}
                  className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
                >
                  <option value="chain">Chain</option>
                  <option value="bracelet-anklet">Bracelet/Anklet</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="product-price">Price *</Label>
              <Input
                id="product-price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Enter price"
              />
            </div>

            <div>
              <Label htmlFor="product-original-price">Original Price (for discounts)</Label>
              <Input
                id="product-original-price"
                type="number"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                placeholder="Enter original price (optional)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty if no discount. Sale badge will show if original price is higher than price.
              </p>
            </div>

            <div>
              <Label htmlFor="product-stock">Stock Status *</Label>
              <div className="relative">
                <select
                  id="product-stock"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value as 'In Stock' | 'Out of Stock' })}
                  className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
                >
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

            <div>
              <Label htmlFor="product-description">Description</Label>
              <textarea
                id="product-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter product description..."
                className="w-full p-2 border border-border rounded-md bg-background min-h-[100px] resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={!formData.name || !formData.price || !formData.category || uploading}
          >
            {mode === 'create' ? 'Create Product' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts; 
