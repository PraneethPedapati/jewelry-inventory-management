import { db } from './connection.js';
import {
  admins,
  colorThemes,
  productTypes,
  products,
  productSpecifications,
  systemConfigs
} from './schema.js';
import { hash } from 'argon2';

const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding...');

    // 1. Create default admin user
    console.log('👤 Creating default admin user...');
    const adminPassword = await hash('admin123!@#'); // Change this in production

    await db.insert(admins).values({
      email: 'admin@jewelrystore.com',
      passwordHash: adminPassword,
      name: 'Store Administrator',
      role: 'admin'
    }).onConflictDoNothing();

    // 2. Create color themes
    console.log('🎨 Creating color themes...');
    await db.insert(colorThemes).values([
      {
        name: 'default',
        displayName: 'Default Jewelry Theme',
        isActive: true,
        isDefault: true,
        colors: {
          primary: '#8B5CF6',
          secondary: '#F59E0B',
          accent: '#EC4899',
          background: '#FFFFFF',
          foreground: '#1F2937',
          card: '#F9FAFB',
          cardForeground: '#111827',
          border: '#E5E7EB',
          input: '#FFFFFF',
          ring: '#8B5CF6',
          muted: '#F3F4F6',
          mutedForeground: '#6B7280',
          destructive: '#EF4444',
          destructiveForeground: '#FFFFFF',
          success: '#10B981',
          successForeground: '#FFFFFF',
          warning: '#F59E0B',
          warningForeground: '#FFFFFF'
        },
        description: 'Default elegant theme for jewelry store'
      },
      {
        name: 'valentine',
        displayName: 'Valentine\'s Collection',
        isActive: false,
        isDefault: false,
        colors: {
          primary: '#EC4899',
          secondary: '#DC2626',
          accent: '#F97316',
          background: '#FDF2F8',
          foreground: '#1F2937',
          card: '#FCE7F3',
          cardForeground: '#111827',
          border: '#F9A8D4',
          input: '#FFFFFF',
          ring: '#EC4899',
          muted: '#FDF2F8',
          mutedForeground: '#6B7280',
          destructive: '#EF4444',
          destructiveForeground: '#FFFFFF',
          success: '#10B981',
          successForeground: '#FFFFFF',
          warning: '#F59E0B',
          warningForeground: '#FFFFFF'
        },
        description: 'Romantic theme for Valentine\'s Day collection'
      },
      {
        name: 'luxury',
        displayName: 'Luxury Collection',
        isActive: false,
        isDefault: false,
        colors: {
          primary: '#1F2937',
          secondary: '#F59E0B',
          accent: '#8B5CF6',
          background: '#FAFAFA',
          foreground: '#111827',
          card: '#F8FAFC',
          cardForeground: '#0F172A',
          border: '#CBD5E1',
          input: '#FFFFFF',
          ring: '#1F2937',
          muted: '#F1F5F9',
          mutedForeground: '#64748B',
          destructive: '#EF4444',
          destructiveForeground: '#FFFFFF',
          success: '#10B981',
          successForeground: '#FFFFFF',
          warning: '#F59E0B',
          warningForeground: '#FFFFFF'
        },
        description: 'Sophisticated theme for luxury jewelry pieces'
      }
    ]).onConflictDoNothing();

    // 3. Create product types
    console.log('📦 Creating product types...');
    await db.insert(productTypes).values([
      {
        name: 'chain',
        displayName: 'Chain',
        specificationType: 'layer'
      },
      {
        name: 'bracelet',
        displayName: 'Bracelet',
        specificationType: 'size'
      },
      {
        name: 'anklet',
        displayName: 'Anklet',
        specificationType: 'size'
      }
    ]).onConflictDoNothing();

    // Get product type IDs for foreign key references
    const [chainType] = await db.select().from(productTypes).where(eq(productTypes.name, 'chain'));
    const [braceletType] = await db.select().from(productTypes).where(eq(productTypes.name, 'bracelet'));
    const [ankletType] = await db.select().from(productTypes).where(eq(productTypes.name, 'anklet'));

    // 4. Create sample jewelry products
    console.log('💎 Creating sample jewelry products...');
    const sampleProducts = [
      {
        name: 'Butterfly Dream Chain',
        charmDescription: 'Delicate butterfly charm with crystal accents and intricate wing details',
        chainDescription: 'Sterling silver curb chain with polished finish',
        productTypeId: chainType.id,
        basePrice: 45.00,
        sku: 'BDC001',
        images: [
          'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
          'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400'
        ]
      },
      {
        name: 'Heart Lock Bracelet',
        charmDescription: 'Heart-shaped lock charm with key detail and engraved initials',
        chainDescription: 'Rose gold plated cable chain with secure clasp',
        productTypeId: braceletType.id,
        basePrice: 35.00,
        sku: 'HLB001',
        images: [
          'https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=400',
          'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400'
        ]
      },
      {
        name: 'Starlight Elegance Chain',
        charmDescription: 'Star-shaped charm with sparkling cubic zirconia stones',
        chainDescription: 'White gold plated box chain with adjustable length',
        productTypeId: chainType.id,
        basePrice: 52.00,
        sku: 'SEC001',
        images: [
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400'
        ]
      },
      {
        name: 'Ocean Pearl Anklet',
        charmDescription: 'Natural pearl charm with ocean wave design',
        chainDescription: 'Sterling silver snake chain with extension',
        productTypeId: ankletType.id,
        basePrice: 28.00,
        sku: 'OPA001',
        images: [
          'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400'
        ]
      },
      {
        name: 'Vintage Rose Bracelet',
        charmDescription: 'Antique rose charm with detailed petals and leaves',
        chainDescription: 'Vintage-style brass chain with patina finish',
        productTypeId: braceletType.id,
        basePrice: 42.00,
        sku: 'VRB001',
        images: [
          'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400'
        ]
      }
    ];

    const insertedProducts = await db.insert(products).values(sampleProducts).returning();

    // 5. Create product specifications
    console.log('📏 Creating product specifications...');
    const specifications = [];

    for (const product of insertedProducts) {
      const productType = [chainType, braceletType, ankletType].find(type => type.id === product.productTypeId);

      if (productType?.specificationType === 'layer') {
        // Chain specifications (layers)
        specifications.push(
          {
            productId: product.id,
            specType: 'layer' as const,
            specValue: 'single',
            displayName: 'Single Layer',
            priceModifier: 0.00,
            stockQuantity: 15,
            isAvailable: true
          },
          {
            productId: product.id,
            specType: 'layer' as const,
            specValue: 'double',
            displayName: 'Double Layer',
            priceModifier: 15.00,
            stockQuantity: 12,
            isAvailable: true
          },
          {
            productId: product.id,
            specType: 'layer' as const,
            specValue: 'triple',
            displayName: 'Triple Layer',
            priceModifier: 25.00,
            stockQuantity: 8,
            isAvailable: true
          }
        );
      } else if (productType?.specificationType === 'size') {
        // Bracelet/Anklet specifications (sizes)
        specifications.push(
          {
            productId: product.id,
            specType: 'size' as const,
            specValue: 'S',
            displayName: 'Small (6-7 inches)',
            priceModifier: 0.00,
            stockQuantity: 20,
            isAvailable: true
          },
          {
            productId: product.id,
            specType: 'size' as const,
            specValue: 'M',
            displayName: 'Medium (7-8 inches)',
            priceModifier: 5.00,
            stockQuantity: 25,
            isAvailable: true
          },
          {
            productId: product.id,
            specType: 'size' as const,
            specValue: 'L',
            displayName: 'Large (8-9 inches)',
            priceModifier: 8.00,
            stockQuantity: 18,
            isAvailable: true
          }
        );
      }
    }

    await db.insert(productSpecifications).values(specifications);

    // 6. Create system configurations
    console.log('⚙️ Creating system configurations...');
    await db.insert(systemConfigs).values([
      {
        key: 'store_name',
        value: { value: 'Elegant Jewelry Store' },
        description: 'Store display name'
      },
      {
        key: 'store_description',
        value: { value: 'Handcrafted jewelry with love and precision' },
        description: 'Store description for customers'
      },
      {
        key: 'default_currency',
        value: { value: 'USD' },
        description: 'Default currency for pricing'
      },
      {
        key: 'active_theme',
        value: { themeId: 'default' },
        description: 'Currently active color theme'
      },
      {
        key: 'whatsapp_enabled',
        value: { enabled: true },
        description: 'Enable WhatsApp integration'
      },
      {
        key: 'low_stock_threshold',
        value: { threshold: 5 },
        description: 'Default low stock alert threshold'
      }
    ]).onConflictDoNothing();

    console.log('✅ Database seeding completed successfully!');
    console.log('📊 Created:');
    console.log('   • 1 admin user (admin@jewelrystore.com / admin123!@#)');
    console.log('   • 3 color themes (default, valentine, luxury)');
    console.log('   • 3 product types (chain, bracelet, anklet)');
    console.log(`   • ${insertedProducts.length} sample jewelry products`);
    console.log(`   • ${specifications.length} product specifications`);
    console.log('   • 6 system configurations');
    console.log('');
    console.log('🔐 Admin Login Credentials:');
    console.log('   Email: admin@jewelrystore.com');
    console.log('   Password: admin123!@#');
    console.log('   ⚠️  Please change the admin password in production!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

// Import eq function for WHERE clauses
import { eq } from 'drizzle-orm';

// Run seeding if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('📝 Seeding process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
} 
