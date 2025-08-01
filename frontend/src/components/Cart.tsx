import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { FiMinus, FiPlus, FiTrash2, FiUser, FiPhone, FiMapPin, FiCreditCard } from 'react-icons/fi';
import { toast } from 'sonner';

interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  address: string;
  pincode: string;
}

interface OrderResponse {
  success: boolean;
  data?: {
    orderNumber: string;
    orderCode: string; // New: User-friendly order code
    totalAmount: number;
    estimatedDelivery: string;
    status: string; // New: Order status
  };
  error?: string;
}

const Cart: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    phone: '',
    email: '',
    address: '',
    pincode: ''
  });

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<OrderResponse | null>(null);
  const [errors, setErrors] = useState<Partial<CustomerDetails>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerDetails> = {};

    if (!customerDetails.name.trim() || customerDetails.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!customerDetails.phone.trim() || !/^\d{10}$/.test(customerDetails.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!customerDetails.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerDetails.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!customerDetails.address.trim() || customerDetails.address.length < 10) {
      newErrors.address = 'Address must be at least 10 characters';
    }

    if (!customerDetails.pincode.trim() || !/^\d{6}$/.test(customerDetails.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CustomerDetails, value: string) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Prepare order data
      const orderData = {
        customerName: customerDetails.name.trim(),
        customerPhone: customerDetails.phone.trim(),
        customerEmail: customerDetails.email.trim(),
        customerAddress: customerDetails.address.trim(),
        customerPincode: customerDetails.pincode.trim(),
        items: cart.map(item => {
          const orderItem: any = {
            productId: item.product.id,
            quantity: item.quantity
          };
          return orderItem;
        })
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const result: OrderResponse = await response.json();

      if (result.success && result.data) {
        setOrderSuccess(result);
        clearCart();
      } else {
        throw new Error(result.error || 'Failed to place order');
      }
    } catch (error: any) {
      console.error('Order placement error:', error);

      // Extract actual error message from backend response
      let errorMessage = 'Failed to place order. Please try again.';

      if (error.response?.data?.error) {
        // Backend returned specific error message
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        // Backend returned message field
        errorMessage = error.response.data.message;
      } else if (error.message) {
        // Network or other error
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // WhatsApp redirect functionality removed - no longer needed

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Created Successfully!</h2>
            <p className="text-gray-600 mb-6">We will contact you soon with payment details.</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Order Code:</span>
                <span className="font-semibold">{orderSuccess.data?.orderCode}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-semibold">₹{orderSuccess.data?.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold capitalize">{orderSuccess.data?.status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Estimated Delivery:</span>
                <span className="font-semibold">{orderSuccess.data?.estimatedDelivery}</span>
              </div>
            </div>

            {/* WhatsApp button removed - no longer needed */}

            <button
              onClick={() => navigate('/products')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some beautiful jewelry to get started!</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-lg mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

        {/* Cart Items */}
        <div className="space-y-4 mb-8">
          {(cart || []).filter(item => item && item.product).map((item) => (
            <div key={`${item.product.id}-${item.size || 'no-size'}`} className="bg-white rounded-xl p-4 shadow-sm">
              ,              <div className="flex gap-3">
                <img
                  src={item.product.images[0] || '/placeholder-jewelry.jpg'}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />

                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                  <p className="text-sm text-gray-600">{item.size || 'Standard'}</p>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                        disabled={item.quantity <= 1}
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                      >
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.size)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Customer Details Form */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiUser className="text-primary" />
            Customer Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={customerDetails.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                placeholder="Enter your full name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <FiPhone className="w-3 h-3" />
                Phone Number *
              </label>
              <input
                type="tel"
                value={customerDetails.phone}
                onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                placeholder="Enter 10-digit phone number"
                maxLength={10}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Address *
              </label>
              <input
                type="email"
                value={customerDetails.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                placeholder="Enter your email address"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <FiMapPin className="w-3 h-3" />
                Delivery Address *
              </label>
              <textarea
                value={customerDetails.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.address ? 'border-red-300' : 'border-gray-300'
                  }`}
                placeholder="Enter your complete address"
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
              <input
                type="text"
                value={customerDetails.pincode}
                onChange={(e) => handleInputChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.pincode ? 'border-red-300' : 'border-gray-300'
                  }`}
                placeholder="Enter 6-digit pincode"
                maxLength={6}
              />
              {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiCreditCard className="text-primary" />
            Order Summary
          </h2>

          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
              <span>₹{getTotalPrice().toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span className="text-green-600">Free</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>₹{getTotalPrice().toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={isPlacingOrder}
          className="w-full bg-primary text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
        </button>

        <p className="text-xs text-gray-500 mt-4 text-center">
          By placing this order, you agree to contact us via WhatsApp for payment confirmation.
        </p>
      </div>
    </div>
  );
};

export default Cart; 
