import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, User, Phone, Mail, MapPin, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { publicOrderService } from '@/services/api';

interface UserDetails {
  name: string;
  phone: string;
  address: string;
  pincode: string;
}

const Cart: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

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

  const handleUpdateQuantity = (productId: string, size: string | undefined, newQuantity: number) => {
    updateQuantity(productId, newQuantity, size);
  };

  const handleRemoveItem = (productId: string, size: string | undefined) => {
    removeFromCart(productId, size);
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shippingFee = 15; // ₹15 shipping fee
    return subtotal + shippingFee;
  };

  const handleUserDetailsChange = (field: keyof UserDetails, value: string) => {
    setUserDetails(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return userDetails.name.trim() !== '' &&
      userDetails.phone.trim() !== '' &&
      userDetails.address.trim() !== '' &&
      userDetails.pincode.trim() !== '' &&
      cart.length > 0;
  };

  const handlePlaceOrder = async () => {
    if (!isFormValid()) return;

    setIsPlacingOrder(true);
    try {
      // Prepare order data
      const orderData = {
        customerName: userDetails.name,
        customerPhone: userDetails.phone,
        customerAddress: userDetails.address,
        customerPincode: userDetails.pincode,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          size: item.size
        }))
      };

      // Create order via API
      const orderResult = await publicOrderService.createOrder(orderData);

      // Clear cart and form after successful order
      clearCart();
      setUserDetails({ name: '', phone: '', email: '', address: '', pincode: '' });

      // Navigate to success page with order details
      navigate('/shop/order-success', {
        state: {
          orderDetails: orderResult
        }
      });

    } catch (error) {
      console.error('Order placement failed:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cart.length === 0) {
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
    <div className="container mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Shopping Cart</h1>
        <p className="text-muted-foreground">Review your items and complete your order</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Cart Items ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item) => (
                <div key={`${item.product.id}-${item.size || 'no-size'}`} className="border rounded-lg p-4">
                  {/* Mobile: Stacked layout, Desktop: Horizontal layout */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Product Image and Name Row */}
                    <div className="flex items-center gap-3 flex-1">
                      {/* Product Image */}
                      <div className="w-20 h-20 md:w-16 md:h-16 flex-shrink-0">
                        <img
                          src={item.product.images[0] || '/placeholder-image.jpg'}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>

                      {/* Product Name and Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground line-clamp-2 text-base md:text-sm">{item.product.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span className="capitalize">{item.product.productType === 'chain' ? 'Chain' : 'Bracelet/Anklet'}</span>
                          {item.size && (
                            <>
                              <span>•</span>
                              <span>Size: {item.size}</span>
                            </>
                          )}
                        </div>

                        {/* Price and Controls Row */}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-lg font-bold text-primary">{formatPrice(item.price)}</p>

                          {/* Quantity Controls and Remove Button */}
                          <div className="flex items-center gap-3">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <div
                                onClick={() => handleUpdateQuantity(item.product.id, item.size, item.quantity - 1)}
                                className="w-8 h-8 rounded-full bg-white border border-brand-border flex items-center justify-center cursor-pointer hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-200 shadow-sm"
                              >
                                <Minus className="w-3 h-3" />
                              </div>
                              <span className="text-sm font-semibold text-brand-shade w-8 text-center">{item.quantity}</span>
                              <div
                                onClick={() => handleUpdateQuantity(item.product.id, item.size, item.quantity + 1)}
                                className="w-8 h-8 rounded-full bg-brand-primary border border-brand-primary flex items-center justify-center cursor-pointer hover:bg-brand-shade transition-all duration-200 shadow-sm text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </div>
                            </div>

                            {/* Remove Button */}
                            <div
                              onClick={() => handleRemoveItem(item.product.id, item.size)}
                              className="w-8 h-8 rounded-full bg-red-500 border border-red-500 flex items-center justify-center cursor-pointer hover:bg-red-600 transition-all duration-200 shadow-sm text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
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
                <span>Subtotal ({cart.length} items)</span>
                <span>{formatPrice(calculateSubtotal())}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{formatPrice(15)}</span>
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
                <p>* Required fields: Name, Phone, Address, Pincode</p>
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