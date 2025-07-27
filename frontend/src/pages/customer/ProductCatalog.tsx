import React, { useState, useMemo, useEffect } from 'react';
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
      if (selectedCategory !== 'All') params.append('productType', selectedCategory);

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



  // Load products when component mounts or filters change
  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, selectedCategory]);

  // Initialize cart states when products load
  useEffect(() => {
    if (products.length > 0) {
      const initialCartStates: Record<string, { quantity: number; specification: ProductSpecification | null }> = {};

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
      productCode: product.productCode,
      name: product.name,
      images: product.images,
      productType: product.productType,
      description: product.description
    };

    // Calculate final price
    const finalPrice = parseFloat(product.price);

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
        productCode: product.productCode,
        name: product.name,
        images: product.images,
        productType: product.productType,
        description: product.description
      };

      const finalPrice = parseFloat(product.price);
      addToCartContext(cartProduct, null, newQuantity, finalPrice);
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
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
          {products.map((product) => (
            <div key={product.id} className="product-card product-card-customer h-[480px]">
              {/* Product Image - Fixed Square Container */}
              <div className="product-card-image">
                <img
                  src={product.images[0] || '/placeholder-image.jpg'}
                  alt={product.name}
                  loading="lazy"
                />
                {isProductNew(product.createdAt) && (
                  <span className="absolute top-2 left-2 bg-primary text-white px-2 py-1 text-xs font-medium rounded">
                    New
                  </span>
                )}
                {product.discountedPrice && (
                  <span className="absolute top-2 right-2 bg-destructive text-white px-2 py-1 text-xs font-medium rounded">
                    Sale
                  </span>
                )}
              </div>

              {/* Product Info - Fixed Height Content */}
              <div className="product-card-content">
                <div className="product-description-container">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground font-medium capitalize bg-white/90 backdrop-blur-sm px-2 py-1 rounded border border-gray-200">
                      {product.productType === 'chain' ? 'Chain' : 'Bracelet/Anklet'}
                    </span>
                    <span className="text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded">
                      {product.productCode}
                    </span>
                  </div>
                  <h3 className="product-card-title">
                    {product.name}
                  </h3>

                  {/* Product Description */}
                  <div className="space-y-1 mt-2">
                    <div className="product-description-item">
                      <span className="product-description-label">Description:</span>
                      <span className="product-description-text ml-1">{product.description}</span>
                    </div>
                  </div>
                </div>

                {/* Price - Fixed Position */}
                <div className="mb-3 flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <span className="product-card-price">
                      {formatPrice(product.discountedPrice || product.price)}
                    </span>
                    {product.discountedPrice && (
                      <span className="text-xs md:text-sm text-muted-foreground line-through">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Add to Cart Button or Quantity Controls - Fixed at Bottom */}
                <div className="product-card-actions">
                  {cartStates[product.id] ? (
                    <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInlineQuantityChange(product, cartStates[product.id].quantity - 1)}
                        className="h-8 w-8 p-0 border-primary/30 text-primary hover:bg-primary hover:text-white"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium px-3 text-primary">
                        {cartStates[product.id].quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInlineQuantityChange(product, cartStates[product.id].quantity + 1)}
                        className="h-8 w-8 p-0 border-primary/30 text-primary hover:bg-primary hover:text-white"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full h-10 text-sm font-medium"
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


    </div>
  );
};

export default ProductCatalog; 
