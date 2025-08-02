import React from 'react';
import { Sparkles, Heart, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const AboutUs: React.FC = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">About Us</h1>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-brand-primary" />
          <span className="text-lg text-brand-primary font-medium">Chic Chains and Charms</span>
          <Sparkles className="w-6 h-6 text-brand-primary" />
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Wear it for everyday glam
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-brand-bg border-brand-border">
          <CardContent className="pt-8 pb-8">
            <div className="space-y-6 text-center">
              {/* Opening */}
              <div className="space-y-4">
                <p className="text-xl text-brand-primary font-medium leading-relaxed">
                  Where every charm tells a story, and every sparkle carries a dream.
                </p>

                <p className="text-brand-shade leading-relaxed">
                  Born from a love of little things that make big statements,<br />
                  We craft more than just accessories —<br />
                  We create moments you can wear.
                </p>
              </div>

              {/* Middle Section */}
              <div className="space-y-4">
                <p className="text-brand-shade leading-relaxed">
                  From dainty chains to whimsical trinkets,<br />
                  Our pieces are for the dreamers, the lovers, the bold, and the soft-hearted.<br />
                  Each charm is handpicked with care,<br />
                  To celebrate your vibe, your journey, your glow.
                </p>
              </div>

              {/* Closing */}
              <div className="space-y-4">
                <p className="text-brand-shade leading-relaxed">
                  Whether you're gifting a memory or treating yourself to magic,<br />
                  Step into our world where style meets soul —<br />
                  Because you, darling, deserve to shine effortlessly.
                </p>

                <div className="flex items-center justify-center gap-3 pt-4">
                  <Heart className="w-5 h-5 text-brand-primary" />
                  <p className="text-lg text-brand-primary font-medium">
                    Chic Chains and Charms — Wear the charm, live the story.
                  </p>
                  <Star className="w-5 h-5 text-brand-primary" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="bg-brand-bg border-brand-border">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold text-brand-primary mb-4">
                Ready to Find Your Perfect Charm?
              </h3>
              <p className="text-brand-shade mb-6">
                Explore our collection and discover pieces that speak to your soul.
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
                  View Cart
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AboutUs; 
