import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FiMinus, FiPlus, FiTrash2, FiUser, FiPhone, FiMapPin, FiCreditCard } from 'react-icons/fi';

// Add Google reCAPTCHA script if not already loaded
const loadRecaptcha = () => {
  if (window.grecaptcha) return Promise.resolve();

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (!siteKey || siteKey === 'your-recaptcha-site-key-here') {
    console.error('reCAPTCHA site key not configured. Please set VITE_RECAPTCHA_SITE_KEY in your .env file');
    return Promise.reject(new Error('reCAPTCHA not configured'));
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.onload = resolve;
    document.head.appendChild(script);
  });
};

interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  pincode: string;
}

interface OrderResponse {
  success: boolean;
  data?: {
    orderNumber: string;
    totalAmount: number;
    whatsappUrl: string;
    estimatedDelivery: string;
  };
  error?: string;
}

const Cart: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    phone: '',
    address: '',
    pincode: ''
  });

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<OrderResponse | null>(null);
  const [errors, setErrors] = useState<Partial<CustomerDetails>>({});

  useEffect(() => {
    loadRecaptcha();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerDetails> = {};

    if (!customerDetails.name.trim() || customerDetails.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!customerDetails.phone.trim() || !/^\+?[\d\s-()]{10,15}$/.test(customerDetails.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
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

  const getRecaptchaToken = async (): Promise<string> => {
    try {
      await loadRecaptcha();

      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

      return new Promise((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha.execute(siteKey, { action: 'place_order' })
            .then((token) => {
              resolve(token);
            })
            .catch((error) => {
              reject(error);
            });
        });
      });
    } catch (error) {
      throw new Error('CAPTCHA verification failed');
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await getRecaptchaToken();

      // Prepare order data
      const orderData = {
        customerName: customerDetails.name.trim(),
        customerPhone: customerDetails.phone.trim(),
        customerAddress: customerDetails.address.trim(),
        customerPincode: customerDetails.pincode.trim(),
        items: cart.map(item => ({
          productId: item.product.id.toString(),
          specificationId: item.specification.id.toString(),
          quantity: item.quantity
        })),
        recaptchaToken
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
    } catch (error) {
      console.error('Order placement error:', error);
      alert(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleWhatsAppRedirect = () => {
    if (orderSuccess?.data?.whatsappUrl) {
      window.open(orderSuccess.data.whatsappUrl, '_blank');
    }
  };

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

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
            <p className="text-gray-600 mb-6">Your order has been received and is being processed.</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-semibold">{orderSuccess.data?.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-semibold">₹{orderSuccess.data?.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Estimated Delivery:</span>
                <span className="font-semibold">{orderSuccess.data?.estimatedDelivery}</span>
              </div>
            </div>

            <button
              onClick={handleWhatsAppRedirect}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors mb-4"
            >
              Continue on WhatsApp
            </button>

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
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
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
          {cart.map((item) => (
            <div key={`${item.product.id}-${item.specification.id}`}
              className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex gap-3">
                <img
                  src={item.product.images[0] || '/placeholder-jewelry.jpg'}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />

                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                  <p className="text-sm text-gray-600">{item.specification.displayName}</p>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.specification.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                        disabled={item.quantity <= 1}
                      >
                        <FiMinus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.specification.id, item.quantity + 1)}
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
                        onClick={() => removeFromCart(item.product.id, item.specification.id)}
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
            <FiUser className="text-purple-600" />
            Customer Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={customerDetails.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.name ? 'border-red-300' : 'border-gray-300'
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
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                placeholder="Enter your phone number"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.address ? 'border-red-300' : 'border-gray-300'
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.pincode ? 'border-red-300' : 'border-gray-300'
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
            <FiCreditCard className="text-purple-600" />
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
          className="w-full bg-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
