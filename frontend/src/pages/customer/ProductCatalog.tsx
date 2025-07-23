import React, { useState, useMemo } from 'react';
import { ShoppingCart, Filter, Search, ChevronLeft, ChevronRight, Plus, Minus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: 'chain' | 'bracelet-anklet';
  description: string;
  createdAt: string; // ISO date string
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

  const itemsPerPage = 8;

  // Helper function to check if product is new (created within last week)
  const isProductNew = (createdAt: string): boolean => {
    const creationDate = new Date(createdAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return creationDate > oneWeekAgo;
  };

  // Updated jewelry products with creation dates and proper pricing
  const products: Product[] = [
    {
      id: 1,
      name: 'Diamond Solitaire Chain',
      price: 204999,
      originalPrice: 259999,
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
      category: 'chain',
      description: 'Elegant diamond solitaire pendant with sterling silver chain',
      createdAt: '2024-01-10T10:00:00Z' // 5 days ago - should be new
    },
    {
      id: 2,
      name: 'Pearl Charm Chain',
      price: 73999,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
      category: 'chain',
      description: 'Beautiful pearl charm with delicate gold chain',
      createdAt: '2024-01-01T10:00:00Z' // 2 weeks ago - not new
    },
    {
      id: 3,
      name: 'Gold Charm Bracelet',
      price: 156999,
      image: 'https://images.unsplash.com/photo-1611652022408-a03f2b3734ec?w=400&h=400&fit=crop',
      category: 'bracelet-anklet',
      description: 'Luxury 18k gold charm bracelet with intricate design',
      createdAt: '2024-01-12T10:00:00Z' // 3 days ago - should be new
    },
    {
      id: 4,
      name: 'Emerald Chain Necklace',
      price: 328999,
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop',
      category: 'chain',
      description: 'Stunning emerald pendant chain with platinum setting',
      createdAt: '2023-12-20T10:00:00Z' // 3 weeks ago - not new
    },
    {
      id: 5,
      name: 'Silver Charm Anklet',
      price: 28999,
      originalPrice: 34999,
      image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop',
      category: 'bracelet-anklet',
      description: 'Classic sterling silver charm anklet with delicate links',
      createdAt: '2024-01-08T10:00:00Z' // 1 week ago - not new
    },
    {
      id: 6,
      name: 'Ruby Tennis Bracelet',
      price: 487999,
      image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',
      category: 'bracelet-anklet',
      description: 'Exquisite ruby tennis bracelet with white gold setting',
      createdAt: '2024-01-13T10:00:00Z' // 2 days ago - should be new
    },
    {
      id: 7,
      name: 'Sapphire Pendant Chain',
      price: 567999,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
      category: 'chain',
      description: 'Blue sapphire pendant with diamond accents on platinum chain',
      createdAt: '2024-01-11T10:00:00Z' // 4 days ago - should be new
    },
    {
      id: 8,
      name: 'Rose Gold Charm Bracelet',
      price: 198999,
      originalPrice: 234999,
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
      category: 'bracelet-anklet',
      description: 'Elegant rose gold charm bracelet with heart pendants',
      createdAt: '2023-12-25T10:00:00Z' // 3 weeks ago - not new
    },
    {
      id: 9,
      name: 'Diamond Tennis Bracelet',
      price: 892999,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
      category: 'bracelet-anklet',
      description: 'Premium diamond tennis bracelet with platinum setting',
      createdAt: '2024-01-14T10:00:00Z' // 1 day ago - should be new
    },
    {
      id: 10,
      name: 'Gold Layered Chain',
      price: 134999,
      image: 'https://images.unsplash.com/photo-1611652022408-a03f2b3734ec?w=400&h=400&fit=crop',
      category: 'chain',
      description: 'Multi-layered gold chain with varying pendant charms',
      createdAt: '2024-01-05T10:00:00Z' // 10 days ago - not new
    }
  ];

  const categories = [
    { value: 'All', label: 'All Products' },
    { value: 'chain', label: 'Chains' },
    { value: 'bracelet-anklet', label: 'Bracelets & Anklets' }
  ];

  const sizes = [
    { value: 'S', label: 'Small (6-7 inches / 15-18 cm)' },
    { value: 'M', label: 'Medium (7-8 inches / 18-20 cm)' },
    { value: 'L', label: 'Large (8-9 inches / 20-23 cm)' }
  ];

  // Filter and search logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setShowFilters(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product: Product) => {
    if (product.category === 'bracelet-anklet') {
      setSelectedProduct(product);
      setQuantity(1);
      setSelectedSize('');
      setShowSizeModal(true);
    } else {
      // Direct add to cart for chains
      addToCart(product, 1);
    }
  };

  const addToCart = (product: Product, qty: number, size?: string) => {
    // Convert ProductCatalog Product to CartContext Product format
    const cartProduct = {
      id: product.id,
      name: product.name,
      images: [product.image], // Convert single image to array
      category: product.category,
      description: product.description
    };

    // Create appropriate specification based on product type
    const specification = {
      id: Date.now(), // Use timestamp for unique specification ID
      displayName: size ? `Size: ${size}` : 'Standard',
      value: size || 'standard',
      type: (product.category === 'bracelet-anklet' ? 'size' : 'layer') as 'size' | 'layer'
    };

    // Add to cart using the context
    addToCartContext(cartProduct, specification, qty, product.price);

    setShowSizeModal(false);
    setSelectedProduct(null);

    // Show success message
    alert(`Added ${qty} ${product.name}${size ? ` (Size: ${size})` : ''} to cart!`);
  };

  const handleSizeModalSubmit = () => {
    if (selectedProduct && selectedSize && quantity > 0) {
      addToCart(selectedProduct, quantity, selectedSize);
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
            onChange={(e) => setSearchTerm(e.target.value)}
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
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            {searchTerm && ` for "${searchTerm}"`}
          </span>
          {totalPages > 1 && (
            <span>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {paginatedProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm">Try adjusting your search or filter criteria</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {paginatedProducts.map((product) => (
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

              {/* Size Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Size:</label>
                <div className="space-y-2">
                  {sizes.map((size) => (
                    <label key={size.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="size"
                        value={size.value}
                        checked={selectedSize === size.value}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className="text-primary"
                      />
                      <span className="text-sm">{size.label}</span>
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
                    {formatPrice(selectedProduct.price * quantity)}
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
