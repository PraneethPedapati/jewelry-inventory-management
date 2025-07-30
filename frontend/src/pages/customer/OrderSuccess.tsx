import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const orderDetails = location.state?.orderDetails;
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-6">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Order Placed Successfully!</h1>
          <p className="text-muted-foreground text-base">
            Thank you for your order. We'll contact you soon with payment details.
          </p>
        </div>

        {/* Order Details Card */}
        {orderDetails && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-semibold text-foreground text-sm">{orderDetails.orderNumber}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Order Code</p>
                  <p className="font-semibold text-foreground text-sm">{orderDetails.orderCode}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-primary text-base">{formatPrice(orderDetails.totalAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                  <p className="font-semibold text-foreground text-sm">{orderDetails.estimatedDelivery}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary font-semibold text-xs">1</span>
              </div>
              <div>
                <h3 className="font-medium text-foreground text-sm">Payment Confirmation</h3>
                <p className="text-muted-foreground text-xs">
                  We'll send you payment details via WhatsApp or call you shortly.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary font-semibold text-xs">2</span>
              </div>
              <div>
                <h3 className="font-medium text-foreground text-sm">Order Processing</h3>
                <p className="text-muted-foreground text-xs">
                  Once payment is confirmed, we'll start processing your order.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary font-semibold text-xs">3</span>
              </div>
              <div>
                <h3 className="font-medium text-foreground text-sm">Delivery</h3>
                <p className="text-muted-foreground text-xs">
                  Your order will be delivered within {orderDetails?.estimatedDelivery || '5-7 business days'}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-center">
          <Button className="px-8">
            <Link to="/shop/products" className="flex items-center justify-center w-full">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess; 
