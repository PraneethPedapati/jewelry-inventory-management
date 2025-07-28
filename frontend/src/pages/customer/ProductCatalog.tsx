import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ShoppingCart, Filter, Search, ChevronLeft, ChevronRight, Plus, Minus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';

interface Product {
  id: string;
  productCode: string;
  name: string;
  price: string;
  discountedPrice?: string;
  images: string[];
  productType: 'chain' | 'bracelet-anklet';
  description: string;
  isActive: boolean;
  createdAt: string;
}

const ProductCatalog: React.FC = () => {
  const { addToCart: addToCartContext, isInCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [cartStates, setCartStates] = useState<Record<string, { quantity: number }>>({});

  // New state for API data
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 8;
  const isRequestingRef = useRef(false);

  // Check if API URL is configured
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const isApiConfigured = apiUrl !== 'http://localhost:3000' || import.meta.env.VITE_API_URL;

  // Debug logging
  useEffect(() => {
    console.log('API Configuration Debug:', {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      apiUrl,
      isApiConfigured
    });
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

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'All') params.append('productType', selectedCategory);

      console.log('Fetching products from:', `${apiUrl}/api/products?${params}`);

      const response = await fetch(`${apiUrl}/api/products?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API response:', data);

      if (data.success) {
        setProducts(data.data.products || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      } else {
        throw new Error(data.error || 'Failed to load products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProducts([]);
    } finally {
      setLoading(false);
      isRequestingRef.current = false;
    }
  }, [currentPage, searchTerm, selectedCategory, apiUrl]);



  // Load products when component mounts or filters change
  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, selectedCategory]);

  // Initialize cart states when products load
  useEffect(() => {
    if (products.length > 0) {
      const initialCartStates: Record<string, { quantity: number }> = {};

      products.forEach(product => {
        // Check if product is in cart and get its state
        // This is a simplified approach - in a real app you'd sync with cart context
        // For now, we'll rely on the cartStates being set when items are added
      });

      setCartStates(prev => ({ ...prev, ...initialCartStates }));
    }
  }, [products]);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (product: Product) => {
    // Add directly to cart with default quantity
    addToCart(product, 1);
  };

  const addToCart = (product: Product, qty: number) => {
    // Convert ProductCatalog Product to CartContext Product format
    const cartProduct = {
      id: product.id,
      name: product.name,
      images: product.images,
      category: product.productType,
      description: product.description
    };

    // Calculate final price
    const finalPrice = parseFloat(product.discountedPrice || product.price);

    // Add to cart using the context
    addToCartContext(cartProduct, null, qty, finalPrice);

    // Update cart state for inline controls
    setCartStates(prev => ({
      ...prev,
      [product.id]: { quantity: qty }
    }));
  };

  const handleInlineQuantityChange = (product: Product, newQuantity: number) => {
    const cartState = cartStates[product.id];
    if (cartState) {
      if (newQuantity <= 0) {
        // Remove from cart
        setCartStates(prev => {
          const newState = { ...prev };
          delete newState[product.id];
          return newState;
        });
        return;
      }

      // Update quantity
      setCartStates(prev => ({
        ...prev,
        [product.id]: { ...cartState, quantity: newQuantity }
      }));

      // Update cart context
      const cartProduct = {
        id: product.id,
        name: product.name,
        images: product.images,
        category: product.productType,
        description: product.description
      };

      const finalPrice = parseFloat(product.discountedPrice || product.price);
      addToCartContext(cartProduct, null, newQuantity, finalPrice);
    }
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

      {/* Configuration Error State */}
      {!isApiConfigured && (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <p className="text-lg font-medium">API Configuration Error</p>
            <p className="text-sm">VITE_API_URL environment variable is not set.</p>
            <p className="text-sm">Please check your .env file and restart the development server.</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && isApiConfigured && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="brand-spinner mx-auto mb-4"></div>
            <p className="text-brand-medium font-medium">Loading products...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && isApiConfigured && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchProducts} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && isApiConfigured && products.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm">Try adjusting your search or filter criteria</p>
          </div>
        </div>
      ) : !loading && !error && isApiConfigured ? (
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
                  {cartStates[product.id] ? (
                    <div className="flex items-center justify-between bg-brand-lightest border border-brand-border rounded-lg px-2 h-10">
                      <div
                        onClick={() => handleInlineQuantityChange(product, cartStates[product.id].quantity - 1)}
                        className="w-8 h-8 rounded-full bg-white border border-brand-border flex items-center justify-center cursor-pointer hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-200 shadow-sm"
                      >
                        <Minus className="w-3 h-3" />
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-semibold text-brand-shade">
                          {cartStates[product.id].quantity}
                        </span>
                      </div>
                      <div
                        onClick={() => handleInlineQuantityChange(product, cartStates[product.id].quantity + 1)}
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


    </div>
  );
};

export default ProductCatalog; 
