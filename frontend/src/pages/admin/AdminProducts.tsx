import React, { useState } from 'react';
import { Package, Plus, Search, Filter, MoreHorizontal, Edit, Eye, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const AdminProducts: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleCreateProduct = () => {
    setSelectedImage(null);
    setShowCreateModal(true);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setSelectedImage(product.image || null);
    setShowEditModal(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const sampleProducts = [
    {
      id: 1,
      name: 'Diamond Solitaire Ring',
      sku: 'DSR-001',
      price: '₹2,04,999',
      stock: 'In Stock',
      description: 'Elegant 1-carat diamond solitaire ring set in 18k white gold with a classic prong setting.',
      image: '/api/placeholder/300/300'
    },
    {
      id: 2,
      name: 'Gold Chain Necklace',
      sku: 'GCN-002',
      price: '₹73,999',
      stock: 'In Stock',
      description: 'Beautiful 18k gold chain necklace with intricate link design, perfect for everyday elegance.',
      image: '/api/placeholder/300/300'
    },
    {
      id: 3,
      name: 'Silver Hoop Earrings',
      sku: 'SHE-003',
      price: '₹16,499',
      stock: 'Out of Stock',
      description: 'Classic sterling silver hoop earrings with a polished finish and secure clasp closure.',
      image: '/api/placeholder/300/300'
    },
    {
      id: 4,
      name: 'Pearl Bracelet',
      sku: 'PB-004',
      price: '₹28,999',
      stock: 'In Stock',
      description: 'Lustrous freshwater pearl bracelet with sterling silver clasp and adjustable length.',
      image: '/api/placeholder/300/300'
    },
    {
      id: 5,
      name: 'Sapphire Engagement Ring',
      sku: 'SER-005',
      price: '₹2,72,999',
      stock: 'In Stock',
      description: 'Stunning blue sapphire engagement ring surrounded by diamonds in platinum setting.',
      image: '/api/placeholder/300/300'
    },
    {
      id: 6,
      name: 'Rose Gold Watch',
      sku: 'RGW-006',
      price: '₹1,56,999',
      stock: 'Out of Stock',
      description: 'Luxury rose gold watch with Swiss movement and leather strap.',
      image: '/api/placeholder/300/300'
    }
  ];

  // Filter products based on search and filter
  const filteredProducts = sampleProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'All' || product.stock === filterStatus;

    return matchesSearch && matchesFilter;
  });

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
            placeholder="Search products by name, SKU, or description..."
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
          <option value="All">All Products</option>
          <option value="In Stock">In Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {/* Product Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-foreground">Total Products</CardTitle>
            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-foreground">{sampleProducts.length}</div>
            <p className="text-xs text-muted-foreground">+{Math.floor(sampleProducts.length * 0.05)} from last month</p>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-foreground">In Stock</CardTitle>
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-foreground">
              {sampleProducts.filter(p => p.stock === 'In Stock').length}
            </div>
            <p className="text-xs text-muted-foreground">Available for sale</p>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-foreground">Out of Stock</CardTitle>
            <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-foreground">
              {sampleProducts.filter(p => p.stock === 'Out of Stock').length}
            </div>
            <p className="text-xs text-muted-foreground">Unavailable</p>
          </CardContent>
        </Card>
      </div>

      {/* Product Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Product Inventory</h2>
          <p className="text-muted-foreground">
            {filteredProducts.length} of {sampleProducts.length} products
            {searchTerm && ` matching "${searchTerm}"`}
            {filterStatus !== 'All' && ` (${filterStatus})`}
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? `No products match "${searchTerm}"` : `No products with status "${filterStatus}"`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="aspect-square relative bg-muted">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjUgMTI1SDE3NVYxNzVIMTI1VjEyNVoiIGZpbGw9IiM5Q0E4QjQiLz4KPC9zdmc+';
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={product.stock === 'In Stock' ? 'default' : 'destructive'}
                      className={`text-xs ${product.stock === 'In Stock' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                    >
                      {product.stock}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-lg font-bold text-primary">{product.price}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          className="h-9 px-3"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create New Product</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
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
                        <p className="text-sm text-muted-foreground mb-2">Upload product image</p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <Label htmlFor="image-upload" className="cursor-pointer">
                          <Button variant="outline" size="sm" type="button">
                            Choose Image
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
                  <Input id="product-name" placeholder="Enter product name" />
                </div>

                <div>
                  <Label htmlFor="product-sku">SKU *</Label>
                  <Input id="product-sku" placeholder="Enter SKU (e.g., DSR-001)" />
                </div>

                <div>
                  <Label htmlFor="product-price">Price *</Label>
                  <Input id="product-price" type="number" placeholder="Enter price (without $)" />
                </div>

                <div>
                  <Label htmlFor="product-stock">Stock Status *</Label>
                  <select
                    id="product-stock"
                    className="w-full p-2 border border-border rounded-md bg-background"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="product-description">Description</Label>
                  <textarea
                    id="product-description"
                    placeholder="Enter product description..."
                    className="w-full p-2 border border-border rounded-md bg-background min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t">
              <Button onClick={() => setShowCreateModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => setShowCreateModal(false)} className="flex-1">
                Create Product
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit Product</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(false)}
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
                        <p className="text-sm text-muted-foreground mb-2">Upload product image</p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="edit-image-upload"
                        />
                        <Label htmlFor="edit-image-upload" className="cursor-pointer">
                          <Button variant="outline" size="sm" type="button">
                            Choose Image
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
                  <Label htmlFor="edit-product-name">Product Name *</Label>
                  <Input id="edit-product-name" defaultValue={selectedProduct.name} />
                </div>

                <div>
                  <Label htmlFor="edit-product-sku">SKU *</Label>
                  <Input id="edit-product-sku" defaultValue={selectedProduct.sku} />
                </div>

                <div>
                  <Label htmlFor="edit-product-price">Price *</Label>
                  <Input id="edit-product-price" type="number" defaultValue={selectedProduct.price.replace('₹', '').replace(/,/g, '')} />
                </div>

                <div>
                  <Label htmlFor="edit-product-stock">Stock Status *</Label>
                  <select
                    id="edit-product-stock"
                    defaultValue={selectedProduct.stock}
                    className="w-full p-2 border border-border rounded-md bg-background"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="edit-product-description">Description</Label>
                  <textarea
                    id="edit-product-description"
                    defaultValue={selectedProduct.description}
                    placeholder="Enter product description..."
                    className="w-full p-2 border border-border rounded-md bg-background min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t">
              <Button onClick={() => setShowEditModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => setShowEditModal(false)} className="flex-1">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts; 
