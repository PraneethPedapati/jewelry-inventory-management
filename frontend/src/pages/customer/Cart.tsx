import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, User, Phone, MapPin, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CartItem {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image: string;
  category: string;
}

interface UserDetails {
  name: string;
  phone: string;
  address: string;
  pincode: string;
}

const Cart: React.FC = () => {
  // In a real app, this would come from context or props
  const [cartItems, setCartItems] = useState<CartItem[]>([
    // Sample data for demonstration
    {
      id: 1,
      productId: 1,
      name: 'Diamond Solitaire Chain',
      price: 204999,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
      category: 'chain'
    },
    {
      id: 2,
      productId: 3,
      name: 'Gold Charm Bracelet',
      price: 156999,
      quantity: 2,
      size: 'M',
      image: 'https://images.unsplash.com/photo-1611652022408-a03f2b3734ec?w=400&h=400&fit=crop',
      category: 'bracelet-anklet'
    }
  ]);

  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: '',
    phone: '',
    address: '',
    pincode: ''
  });

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (itemId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    // For now, just return subtotal. Later you can add shipping, taxes, etc.
    return calculateSubtotal();
  };

  const handleUserDetailsChange = (field: keyof UserDetails, value: string) => {
    setUserDetails(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return userDetails.name.trim() !== '' &&
      userDetails.phone.trim() !== '' &&
      userDetails.address.trim() !== '' &&
      userDetails.pincode.trim() !== '' &&
      cartItems.length > 0;
  };

  const handlePlaceOrder = async () => {
    if (!isFormValid()) return;

    setIsPlacingOrder(true);
    try {
      // TODO: Implement API call to place order
      // const orderData = {
      //   customerName: userDetails.name,
      //   customerPhone: userDetails.phone,
      //   customerAddress: userDetails.address,
      //   customerPincode: userDetails.pincode,
      //   items: cartItems,
      //   totalAmount: calculateTotal()
      // };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      alert('Order placed successfully! You will receive confirmation details soon.');

      // Clear cart and form after successful order
      setCartItems([]);
      setUserDetails({ name: '', phone: '', address: '', pincode: '' });

    } catch (error) {
      alert('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some beautiful jewelry to get started!</p>
          <Button>
            <Link to="/shop/products" className="block w-full">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Shopping Cart</h1>
        <p className="text-muted-foreground">Review your items and complete your order</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Cart Items ({cartItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground line-clamp-2">{item.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span className="capitalize">{item.category === 'chain' ? 'Chain' : 'Bracelet/Anklet'}</span>
                      {item.size && (
                        <>
                          <span>•</span>
                          <span>Size: {item.size}</span>
                        </>
                      )}
                    </div>
                    <p className="text-lg font-bold text-primary mt-2">{formatPrice(item.price)}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-lg font-medium w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary and User Details */}
        <div className="space-y-6">
          {/* User Details Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={userDetails.name}
                  onChange={(e) => handleUserDetailsChange('name', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="phone"
                    placeholder="Enter your phone number"
                    value={userDetails.phone}
                    onChange={(e) => handleUserDetailsChange('phone', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
                  <textarea
                    id="address"
                    placeholder="Enter your complete address"
                    value={userDetails.address}
                    onChange={(e) => handleUserDetailsChange('address', e.target.value)}
                    className="w-full min-h-[80px] pl-10 pr-3 py-2 text-sm border border-input bg-background rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  placeholder="Enter pincode"
                  value={userDetails.pincode}
                  onChange={(e) => handleUserDetailsChange('pincode', e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>{formatPrice(calculateSubtotal())}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(calculateTotal())}</span>
                </div>
              </div>

              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={!isFormValid() || isPlacingOrder}
              >
                {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
              </Button>

              <div className="text-xs text-muted-foreground text-center mt-4">
                <p>* All fields are required</p>
                <p>Payment will be collected upon delivery</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart; 
