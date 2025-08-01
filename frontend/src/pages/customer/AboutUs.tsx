import React from 'react';
import { Heart, Star, Award, Users, Shield, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AboutUs: React.FC = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">About Us</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Crafting beautiful jewelry with passion, precision, and a commitment to excellence since 2010
        </p>
      </div>

      {/* Company Story */}
      <div className="mb-16">
        <Card className="bg-brand-bg border-brand-border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-brand-primary">Our Story</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-brand-shade leading-relaxed">
              Founded in 2010, Elegant Jewelry Store began as a small family workshop with a simple mission:
              to create jewelry that tells stories and celebrates life's precious moments. What started as a
              passion project has grown into a trusted name in fine jewelry, serving thousands of satisfied customers.
            </p>
            <p className="text-brand-shade leading-relaxed">
              Our journey has been marked by unwavering dedication to quality, innovative designs, and
              personalized customer service. Every piece we create carries the legacy of our founders'
              craftsmanship and the dreams of our customers.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mission & Values */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <Card className="bg-brand-bg border-brand-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-brand-primary">
              <Heart className="w-5 h-5" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-brand-shade leading-relaxed">
              To create exceptional jewelry that celebrates life's beautiful moments,
              while maintaining the highest standards of craftsmanship and ethical practices.
              We believe every piece should tell a story and bring joy to its wearer.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-brand-bg border-brand-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-brand-primary">
              <Star className="w-5 h-5" />
              Our Vision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-brand-shade leading-relaxed">
              To be the most trusted name in fine jewelry, known for our innovative designs,
              exceptional quality, and commitment to customer satisfaction. We aspire to create
              timeless pieces that become family heirlooms.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Core Values */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Our Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-brand-bg border-brand-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-brand-primary">
                <Award className="w-5 h-5" />
                Quality Excellence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-brand-shade text-sm">
                Every piece undergoes rigorous quality checks to ensure it meets our high standards
                of craftsmanship and durability.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-brand-bg border-brand-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-brand-primary">
                <Users className="w-5 h-5" />
                Customer First
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-brand-shade text-sm">
                Your satisfaction is our priority. We provide personalized service and support
                throughout your jewelry journey.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-brand-bg border-brand-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-brand-primary">
                <Shield className="w-5 h-5" />
                Ethical Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-brand-shade text-sm">
                We source materials responsibly and maintain transparent business practices
                that respect both people and the environment.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-brand-bg border-brand-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-brand-primary">
                <Star className="w-5 h-5" />
                Innovation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-brand-shade text-sm">
                We continuously explore new techniques and designs to create unique,
                contemporary pieces that stand the test of time.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-brand-bg border-brand-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-brand-primary">
                <Heart className="w-5 h-5" />
                Passion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-brand-shade text-sm">
                Our love for jewelry drives everything we do. We pour our heart into
                every piece, creating with genuine passion and care.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-brand-bg border-brand-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-brand-primary">
                <Truck className="w-5 h-5" />
                Reliability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-brand-shade text-sm">
                We deliver on our promises with timely service, secure shipping,
                and comprehensive after-sales support.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Meet Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-brand-bg border-brand-border text-center">
            <CardContent className="pt-6">
              <div className="w-24 h-24 bg-brand-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-lg font-bold text-brand-primary mb-2">Master Craftsmen</h3>
              <p className="text-brand-shade text-sm">
                Our skilled artisans bring decades of experience and traditional techniques
                to create exceptional jewelry pieces.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-brand-bg border-brand-border text-center">
            <CardContent className="pt-6">
              <div className="w-24 h-24 bg-brand-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <Star className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-lg font-bold text-brand-primary mb-2">Design Team</h3>
              <p className="text-brand-shade text-sm">
                Creative designers who blend contemporary trends with timeless elegance
                to create unique jewelry collections.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-brand-bg border-brand-border text-center">
            <CardContent className="pt-6">
              <div className="w-24 h-24 bg-brand-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                <Heart className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-lg font-bold text-brand-primary mb-2">Customer Care</h3>
              <p className="text-brand-shade text-sm">
                Dedicated professionals committed to providing exceptional service and
                ensuring your complete satisfaction.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="text-center">
        <Card className="bg-brand-bg border-brand-border">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold text-brand-primary mb-4">
              Ready to Find Your Perfect Piece?
            </h3>
            <p className="text-brand-shade mb-6">
              Explore our collection or get in touch with us for personalized assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/shop/products"
                className="inline-flex items-center justify-center px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-shade transition-colors"
              >
                Browse Collection
              </a>
              <a
                href="/shop/cart"
                className="inline-flex items-center justify-center px-6 py-3 border border-brand-primary text-brand-primary rounded-lg hover:bg-brand-primary hover:text-white transition-colors"
              >
                Contact Us
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutUs; 
