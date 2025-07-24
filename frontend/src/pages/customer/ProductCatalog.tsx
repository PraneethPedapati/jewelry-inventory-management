import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Filter, Search, ChevronLeft, ChevronRight, Plus, Minus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';

interface Product {
  id: string; // Changed to string for UUID
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: 'chain' | 'bracelet-anklet';
  description: string;
  charmDescription: string;
  chainDescription: string;
  sku: string;
  createdAt: string; // ISO date string
  specifications?: ProductSpecification[];
}

interface ProductSpecification {
  id: string;
  displayName: string;
  value: string;
  type: 'size' | 'layer';
  priceModifier: number;
  stockQuantity: number;
  isAvailable: boolean;
}

const ProductCatalog: React.FC = () => {
  const { addToCart: addToCartContext } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  // New state for API data
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 8;

  // Helper function to check if product is new (created within last week)
  const isProductNew = (createdAt: string): boolean => {
    const creationDate = new Date(createdAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return creationDate > oneWeekAgo;
  };

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      } else {
        throw new Error(data.error || 'Failed to load products');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch product specifications when needed
  const fetchProductSpecifications = async (productId: string): Promise<ProductSpecification[]> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}/specifications`);

      if (!response.ok) {
        throw new Error('Failed to fetch specifications');
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Error fetching specifications:', err);
      return [];
    }
  };

  // Load products when component mounts or filters change
  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, selectedCategory]);

  const categories = [
    { value: 'All', label: 'All Products' },
    { value: 'chain', label: 'Chains' },
    { value: 'bracelet-anklet', label: 'Bracelets & Anklets' }
  ];

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when changing category
    setShowFilters(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (product: Product) => {
    if (product.category === 'bracelet-anklet') {
      // Fetch specifications for this product
      const specifications = await fetchProductSpecifications(product.id);
      const updatedProduct = { ...product, specifications };
      setSelectedProduct(updatedProduct);
      setQuantity(1);
      setSelectedSize('');
      setShowSizeModal(true);
    } else {
      // For chains, fetch specifications and use the first available one
      const specifications = await fetchProductSpecifications(product.id);
      const defaultSpec = specifications.find(spec => spec.isAvailable) || {
        id: `default-${product.id}`,
        displayName: 'Standard',
        value: 'standard',
        type: 'layer' as const,
        priceModifier: 0,
        stockQuantity: 1,
        isAvailable: true
      };

      addToCart(product, 1, defaultSpec);
    }
  };

  const addToCart = (product: Product, qty: number, specification: ProductSpecification) => {
    // Convert ProductCatalog Product to CartContext Product format
    const cartProduct = {
      id: product.id,
      name: product.name,
      images: product.images,
      category: product.category,
      description: product.description
    };

    // Convert to CartContext specification format
    const cartSpecification = {
      id: specification.id,
      displayName: specification.displayName,
      value: specification.value,
      type: specification.type
    };

    // Calculate final price including specification modifier
    const finalPrice = product.price + specification.priceModifier;

    // Add to cart using the context
    addToCartContext(cartProduct, cartSpecification, qty, finalPrice);

    setShowSizeModal(false);
    setSelectedProduct(null);

    // Show success message
    alert(`Added ${qty} ${product.name} (${specification.displayName}) to cart!`);
  };

  const handleSizeModalSubmit = () => {
    if (selectedProduct && selectedSize && quantity > 0) {
      const selectedSpec = selectedProduct.specifications?.find(spec => spec.value === selectedSize);
      if (selectedSpec) {
        addToCart(selectedProduct, quantity, selectedSpec);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Jewelry Collection</h1>
        <p className="text-muted-foreground text-sm md:text-base">Discover our exquisite handcrafted jewelry collection</p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search jewelry..."
            className="pl-10 h-12 text-base"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Categories and Filter Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Categories</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Category Filter */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="flex flex-wrap gap-2 md:flex-nowrap md:overflow-x-auto md:space-x-2 md:pb-2 md:scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(category.value)}
                className={`flex-shrink-0 transition-colors ${selectedCategory === category.value
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {products.length} product{products.length !== 1 ? 's' : ''} found
            {searchTerm && ` for "${searchTerm}"`}
          </span>
          {totalPages > 1 && (
            <span>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchProducts} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm">Try adjusting your search or filter criteria</p>
          </div>
        </div>
      ) : !loading && !error ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200">
              {/* Product Image */}
              <div className="relative aspect-square">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-t-lg"
                  loading="lazy"
                />
                {isProductNew(product.createdAt) && (
                  <span className="absolute top-2 left-2 bg-primary text-white px-2 py-1 text-xs font-medium rounded">
                    New
                  </span>
                )}
                {product.originalPrice && (
                  <span className="absolute top-2 right-2 bg-destructive text-white px-2 py-1 text-xs font-medium rounded">
                    Sale
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3 md:p-4">
                <div className="mb-3">
                  <span className="text-xs text-muted-foreground font-medium capitalize">
                    {product.category === 'chain' ? 'Chain' : 'Bracelet/Anklet'}
                  </span>
                  <h3 className="text-sm md:text-base font-semibold text-foreground mt-1 line-clamp-2">
                    {product.name}
                  </h3>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-base md:text-lg font-bold text-foreground">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs md:text-sm text-muted-foreground line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                  className="w-full h-10 text-sm font-medium"
                  size="sm"
                  onClick={() => handleAddToCart(product)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

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
              const showPage = page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1;

              if (!showPage) {
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

      {/* Size Selection Modal */}
      {showSizeModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Size & Quantity</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSizeModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">{selectedProduct.name}</p>
                <p className="text-lg font-bold text-primary">{formatPrice(selectedProduct.price)}</p>
              </div>

              {/* Size/Specification Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select {selectedProduct.category === 'bracelet-anklet' ? 'Size' : 'Option'}:
                </label>
                <div className="space-y-2">
                  {selectedProduct.specifications?.map((spec) => (
                    <label key={spec.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="specification"
                        value={spec.value}
                        checked={selectedSize === spec.value}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className="text-primary"
                      />
                      <span className="text-sm flex-1">{spec.displayName}</span>
                      {spec.priceModifier > 0 && (
                        <span className="text-sm text-primary font-medium">
                          +{formatPrice(spec.priceModifier)}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Quantity Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Quantity:</label>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-lg font-medium w-8 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Total Price */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice((() => {
                      const selectedSpec = selectedProduct.specifications?.find(spec => spec.value === selectedSize);
                      const finalPrice = selectedProduct.price + (selectedSpec?.priceModifier || 0);
                      return finalPrice * quantity;
                    })())}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSizeModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSizeModalSubmit}
                  disabled={!selectedSize}
                  className="flex-1"
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCatalog; 
