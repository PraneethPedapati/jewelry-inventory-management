import React from 'react';
import { ShoppingCart, Heart, Star, Filter } from 'lucide-react';

const ProductCatalog: React.FC = () => {
  // Sample jewelry products
  const products = [
    {
      id: 1,
      name: 'Diamond Solitaire Ring',
      price: 1299.99,
      originalPrice: 1599.99,
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
      rating: 4.8,
      reviews: 124,
      category: 'Rings',
      isNew: true,
    },
    {
      id: 2,
      name: 'Pearl Necklace Set',
      price: 299.99,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
      rating: 4.6,
      reviews: 89,
      category: 'Necklaces',
      isNew: false,
    },
    {
      id: 3,
      name: 'Gold Chain Bracelet',
      price: 549.99,
      image: 'https://images.unsplash.com/photo-1611652022408-a03f2b3734ec?w=400&h=400&fit=crop',
      rating: 4.9,
      reviews: 156,
      category: 'Bracelets',
      isNew: true,
    },
    {
      id: 4,
      name: 'Emerald Earrings',
      price: 899.99,
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop',
      rating: 4.7,
      reviews: 67,
      category: 'Earrings',
      isNew: false,
    },
    {
      id: 5,
      name: 'Silver Charm Set',
      price: 199.99,
      originalPrice: 249.99,
      image: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop',
      rating: 4.5,
      reviews: 203,
      category: 'Charms',
      isNew: false,
    },
    {
      id: 6,
      name: 'Ruby Tennis Bracelet',
      price: 2199.99,
      image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',
      rating: 4.9,
      reviews: 78,
      category: 'Bracelets',
      isNew: true,
    },
  ];

  const categories = ['All', 'Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Charms'];

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Jewelry Collection</h1>
        <p className="text-muted-foreground">Discover our exquisite collection of handcrafted jewelry</p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Categories</h2>
          <button className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
            <Filter className="w-4 h-4" />
            <span className="text-sm">More Filters</span>
          </button>
        </div>

        <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full transition-colors ${category === 'All'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Product Image */}
            <div className="relative aspect-square">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover rounded-t-lg"
              />
              {product.isNew && (
                <span className="absolute top-2 left-2 bg-primary text-white px-2 py-1 text-xs font-medium rounded">
                  New
                </span>
              )}
              <button className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full transition-colors">
                <Heart className="w-4 h-4 text-muted-foreground hover:text-destructive" />
              </button>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <div className="mb-2">
                <span className="text-xs text-muted-foreground font-medium">{product.category}</span>
                <h3 className="text-sm font-semibold text-foreground mt-1 line-clamp-1">
                  {product.name}
                </h3>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < Math.floor(product.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-muted-foreground'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {product.rating} ({product.reviews})
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-foreground">
                    ${product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>
              </div>

              {/* Add to Cart Button */}
              <button className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 text-sm font-medium">
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center mt-12">
        <button className="bg-card border border-border text-foreground px-8 py-3 rounded-md hover:bg-muted transition-colors font-medium">
          Load More Products
        </button>
      </div>
    </div>
  );
};

export default ProductCatalog; 
