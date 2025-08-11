import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingCart, Filter, Search, ChevronLeft, ChevronRight, Plus, Minus, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/context/CartContext';
import { productService } from '@/services/api';

const ProductCatalog: React.FC = () => {
  const { addToCart: addToCartContext, updateQuantity, removeFromCart, cart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 8;
  const isRequestingRef = useRef(false);

  // Size popup state
  const [showSizePopup, setShowSizePopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | null>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Product categories
  const productCategories = [
    { value: 'all', label: 'All Products' },
    { value: 'chain', label: 'Chains' },
    { value: 'bracelet-anklet', label: 'Bracelets & Anklets' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ];



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper function to check if product is new (created within last week)
  const isProductNew = (createdAt: string): boolean => {
    const creationDate = new Date(createdAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return creationDate > oneWeekAgo;
  };

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    // Prevent multiple simultaneous API calls
    if (isRequestingRef.current) return;

    try {
      isRequestingRef.current = true;
      setLoading(true);
      setError(null);

      const params: {
        page: number;
        limit: number;
        search?: string;
        productType?: string;
        sortBy?: string;
      } = {
        page: currentPage,
        limit: itemsPerPage
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedCategory !== 'all') params.productType = selectedCategory;
      if (sortBy) params.sortBy = sortBy;

      console.log('Fetching products with params:', params);

      const data = await productService.getProducts(params);
      console.log('API response:', data);

      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProducts([]);
    } finally {
      setLoading(false);
      isRequestingRef.current = false;
    }
  }, [currentPage, searchTerm, selectedCategory, sortBy]);



  // Load products when component mounts or filters change
  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, selectedCategory, sortBy]);

  // Helper function to get cart item for a product
  const getCartItem = (productId: string) => {
    return cart.find(item => item.product.id === productId);
  };

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numPrice);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when changing category
    setShowFilters(false);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1); // Reset to first page when changing sort
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (product: Product) => {
    // Check if product is bracelet/anklet type
    if (product.productType === 'bracelet-anklet') {
      // Show size popup for bracelet products
      setSelectedProduct(product);
      setSelectedSize(null);
      setShowSizePopup(true);
    } else {
      // Add directly to cart for non-bracelet products
      addToCart(product, 1);
    }
  };

  const addToCart = (product: Product, qty: number, size?: string) => {
    // Calculate final price
    const finalPrice = parseFloat(product.discountedPrice || product.price);

    // Add to cart using the context with size information
    addToCartContext(product, qty, finalPrice, size);
  };

  const handleSizeSelection = (size: 'S' | 'M' | 'L') => {
    setSelectedSize(size);
  };

  const handleConfirmSize = () => {
    if (selectedProduct && selectedSize) {
      addToCart(selectedProduct, 1, selectedSize);
      setShowSizePopup(false);
      setSelectedProduct(null);
      setSelectedSize(null);
    }
  };

  const handleCancelSize = () => {
    setShowSizePopup(false);
    setSelectedProduct(null);
    setSelectedSize(null);
  };

  const handleInlineQuantityChange = (product: Product, newQuantity: number) => {
    const cartItem = getCartItem(product.id);
    if (!cartItem) return;

    if (newQuantity <= 0) {
      // Remove from cart context
      removeFromCart(product.id, cartItem.size);
      return;
    }

    // Update cart context using updateQuantity
    updateQuantity(product.id, newQuantity, cartItem.size);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
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
            className="md:hidden border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Category Filter and Sort */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 md:flex-nowrap md:overflow-x-auto md:space-x-2 md:pb-2 md:scrollbar-hide">
              {productCategories.map((category) => (
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

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Sort by:</label>
              <div className="relative" ref={sortDropdownRef}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="w-full md:w-auto justify-between min-w-[160px]"
                >
                  {sortOptions.find(option => option.value === sortBy)?.label || 'Sort by'}
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                </Button>

                {showSortDropdown && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[200px]">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          handleSortChange(option.value);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${sortBy === option.value
                          ? 'bg-primary text-white'
                          : 'text-gray-700'
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
            <div className="brand-spinner mx-auto mb-4"></div>
            <p className="text-brand-medium font-medium">Loading products...</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product.id} className="product-card product-card-customer">
              {/* Product Image - Fixed Square Container */}
              <div className="product-card-image">
                <img
                  src={product.images[0] || '/placeholder-image.jpg'}
                  alt={product.name}
                  loading="lazy"
                />

                {/* Product Type Badge */}
                <div className="absolute top-3 left-3 text-xs font-medium px-2 py-1 rounded-md bg-white/95 backdrop-blur-sm border border-brand-border text-brand-shade">
                  {product.productType === 'chain' ? 'Chain' : 'Bracelet/Anklet'}
                </div>

                {/* Product Code Badge */}
                <div className="absolute top-3 right-3 text-xs font-mono text-brand-medium bg-brand-lightest px-2 py-1 rounded-md border border-brand-border">
                  {product.productCode}
                </div>

                {/* New Badge */}
                {isProductNew(product.createdAt) && (
                  <div className="absolute bottom-3 left-3 bg-brand-primary text-white px-2 py-1 text-xs font-medium rounded-md">
                    New
                  </div>
                )}

                {/* Sale Badge */}
                {product.discountedPrice && (
                  <div className="absolute bottom-3 right-3 bg-red-500 text-white px-2 py-1 text-xs font-medium rounded-md">
                    Sale
                  </div>
                )}
              </div>

              {/* Product Info - Fixed Height Content */}
              <div className="product-card-content">
                <div className="product-info-section">
                  {/* Product Name */}
                  <h3 className="product-card-title" title={product.name}>
                    {product.name}
                  </h3>

                  {/* Product Description */}
                  <div className="product-description-item">
                    <span className="product-description-text" title={product.description}>
                      {product.description}
                    </span>
                  </div>

                  {/* Price Section */}
                  <div className="price-section">
                    <span className="current-price">
                      {formatPrice(product.discountedPrice || product.price)}
                    </span>
                    {product.discountedPrice && (
                      <span className="original-price">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Add to Cart Button or Quantity Controls - Fixed at Bottom */}
                <div className="product-card-actions">
                  {getCartItem(product.id) ? (
                    <div className="flex items-center justify-between bg-brand-lightest border border-brand-border rounded-lg px-2 h-10">
                      <div
                        onClick={() => handleInlineQuantityChange(product, (getCartItem(product.id)?.quantity || 0) - 1)}
                        className="w-8 h-8 rounded-full bg-white border border-brand-border flex items-center justify-center cursor-pointer hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-200 shadow-sm"
                      >
                        <Minus className="w-3 h-3" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-semibold text-brand-shade">
                          {getCartItem(product.id)?.quantity}
                        </span>
                      </div>
                      <div
                        onClick={() => handleInlineQuantityChange(product, (getCartItem(product.id)?.quantity || 0) + 1)}
                        className="w-8 h-8 rounded-full bg-brand-primary border border-brand-primary flex items-center justify-center cursor-pointer hover:bg-brand-shade transition-all duration-200 shadow-sm text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-full h-10 text-sm font-medium bg-brand-primary hover:bg-brand-shade text-white border-0"
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  )}
                </div>
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
                  className="h-10 w-10 p-0"
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
            disabled={currentPage === totalPages}
            className="h-10 px-3"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Size Selection Popup */}
      {showSizePopup && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Select Size</h2>
                <Button variant="outline" size="sm" onClick={handleCancelSize}>
                  ×
                </Button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={selectedProduct.images[0] || '/placeholder-image.jpg'}
                    alt={selectedProduct.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedProduct.productCode}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Choose your size:</h4>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleSizeSelection('S')}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${selectedSize === 'S'
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-gray-300 hover:border-brand-primary'
                        }`}
                    >
                      <div className="font-semibold text-lg">S</div>
                      <div className="text-xs mt-1">5"-6"</div>
                    </button>

                    <button
                      onClick={() => handleSizeSelection('M')}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${selectedSize === 'M'
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-gray-300 hover:border-brand-primary'
                        }`}
                    >
                      <div className="font-semibold text-lg">M</div>
                      <div className="text-xs mt-1">6"-7"</div>
                    </button>

                    <button
                      onClick={() => handleSizeSelection('L')}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${selectedSize === 'L'
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-gray-300 hover:border-brand-primary'
                        }`}
                    >
                      <div className="font-semibold text-lg">L</div>
                      <div className="text-xs mt-1">7"-8"</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleConfirmSize}
                  disabled={!selectedSize}
                  className="flex-1"
                >
                  Add to Cart
                </Button>
                <Button variant="outline" onClick={handleCancelSize}>
                  Cancel
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
