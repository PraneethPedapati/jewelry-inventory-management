import { db } from './connection.js';
import {
  admins,
  colorThemes,
  productCodeSequences,
  products,
  expenseCategories,
  orders,
  orderItems,
  orderStatusHistory,
  expenses
} from './schema.js';
import { hash } from 'argon2';
import { eq } from 'drizzle-orm';

/**
 * Clear all existing data from the database in the correct order
 * to respect foreign key constraints
 */
const clearDatabase = async (): Promise<void> => {
  console.log('🧹 Clearing existing database data...');

  // Delete in order of dependencies (child tables first)
  console.log('  - Clearing order status history...');
  await db.delete(orderStatusHistory);

  console.log('  - Clearing order items...');
  await db.delete(orderItems);

  console.log('  - Clearing orders...');
  await db.delete(orders);

  console.log('  - Clearing expenses...');
  await db.delete(expenses);

  console.log('  - Clearing products...');
  await db.delete(products);

  console.log('  - Clearing product code sequences...');
  await db.delete(productCodeSequences);

  console.log('  - Clearing expense categories...');
  await db.delete(expenseCategories);

  console.log('  - Clearing color themes...');
  await db.delete(colorThemes);

  console.log('  - Clearing admin users...');
  await db.delete(admins);

  console.log('✅ Database cleared successfully!');
};

const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data first
    await clearDatabase();

    // 1. Create default admin user
    console.log('👤 Creating default admin user...');
    const adminPassword = await hash('admin123!@#'); // Change this in production

    await db.insert(admins).values({
      email: 'admin@jewelrystore.com',
      passwordHash: adminPassword,
      name: 'Store Administrator',
      role: 'admin'
    });

    // 2. Create color themes
    console.log('🎨 Creating color themes...');
    await db.insert(colorThemes).values([
      {
        name: 'default',
        displayName: 'Default Jewelry Theme',
        isActive: true,
        isDefault: true,
        colors: {
          primary: '#6c3158',
          secondary: '#F59E0B',
          accent: '#EC4899',
          background: '#FFFFFF',
          foreground: '#1F2937',
          card: '#F9FAFB',
          cardForeground: '#111827',
          border: '#E5E7EB',
          input: '#FFFFFF',
          ring: '#6c3158',
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
    ]);

    // 3. Initialize product code sequences
    console.log('📦 Initializing product code sequences...');
    await db.insert(productCodeSequences).values([
      {
        productType: 'chain',
        currentSequence: 0
      },
      {
        productType: 'bracelet-anklet',
        currentSequence: 0
      }
    ]).onConflictDoNothing();

    // 4. Create sample jewelry products
    console.log('💎 Creating sample jewelry products...');
    const sampleProducts = [
      {
        productCode: 'CH001',
        name: 'Butterfly Dream Chain',
        description: 'Delicate butterfly charm with crystal accents and intricate wing details. Sterling silver curb chain with polished finish.',
        productType: 'chain',
        price: '45.00',
        images: [
          'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400',
          'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400'
        ]
      },
      {
        productCode: 'BR001',
        name: 'Heart Lock Bracelet',
        description: 'Heart-shaped lock charm with key detail and engraved initials. Rose gold plated cable chain with secure clasp.',
        productType: 'bracelet-anklet',
        price: '35.00',
        images: [
          'https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=400',
          'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400'
        ]
      },
      {
        productCode: 'CH002',
        name: 'Starlight Elegance Chain',
        description: 'Star-shaped charm with sparkling cubic zirconia stones. White gold plated box chain with adjustable length.',
        productType: 'chain',
        price: '52.00',
        images: [
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400'
        ]
      },
      {
        productCode: 'BR002',
        name: 'Ocean Pearl Anklet',
        description: 'Natural pearl charm with ocean wave design. Sterling silver snake chain with extension.',
        productType: 'bracelet-anklet',
        price: '28.00',
        images: [
          'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400'
        ]
      },
      {
        productCode: 'BR003',
        name: 'Vintage Rose Bracelet',
        description: 'Antique rose charm with detailed petals and leaves. Vintage-style brass chain with patina finish.',
        productType: 'bracelet-anklet',
        price: '42.00',
        images: [
          'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400'
        ]
      },
      {
        productCode: 'CH003',
        name: 'Moonstone Magic Chain',
        description: 'Mystical moonstone charm with ethereal glow. Sterling silver rope chain with antiqued finish.',
        productType: 'chain',
        price: '58.00',
        images: [
          'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400'
        ]
      },
      {
        productCode: 'BR004',
        name: 'Golden Leaf Bracelet',
        description: 'Autumn leaf charm with gold plated detailing. Gold filled figaro chain with secure toggle clasp.',
        productType: 'bracelet-anklet',
        price: '39.00',
        images: [
          'https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=400'
        ]
      },
      {
        productCode: 'CH004',
        name: 'Diamond Dreams Chain',
        description: 'Sparkling diamond-cut crystal charm in teardrop shape. Premium white gold chain with mirror finish.',
        productType: 'chain',
        price: '75.00',
        images: [
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400'
        ]
      },
      {
        productCode: 'BR005',
        name: 'Sunset Anklet',
        description: 'Gradient orange-pink charm resembling sunset colors. Delicate rose gold chain with adjustable length.',
        productType: 'bracelet-anklet',
        price: '32.00',
        images: [
          'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400'
        ]
      },
      {
        productCode: 'BR006',
        name: 'Celtic Knot Bracelet',
        description: 'Traditional Celtic knot charm symbolizing eternal love. Antique silver chain with Celtic-inspired links.',
        productType: 'bracelet-anklet',
        price: '44.00',
        images: [
          'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400'
        ]
      },
      {
        productCode: 'CH005',
        name: 'Crystal Rainbow Chain',
        description: 'Multi-colored crystal charm creating rainbow effect. Titanium chain with color-changing properties.',
        productType: 'chain',
        price: '62.00',
        images: [
          'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400'
        ]
      },
      {
        productCode: 'BR007',
        name: 'Flower Power Anklet',
        description: 'Delicate flower charm with enamel petals. Sterling silver box chain with spring ring clasp.',
        productType: 'bracelet-anklet',
        price: '26.00',
        images: [
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400'
        ]
      },
      {
        productCode: 'BR008',
        name: 'Infinity Love Bracelet',
        description: 'Infinity symbol charm with engraved love message. Rose gold cable chain with magnetic clasp.',
        productType: 'bracelet-anklet',
        price: '48.00',
        images: [
          'https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=400'
        ]
      },
      {
        productCode: 'CH006',
        name: 'Mystic Forest Chain',
        description: 'Tree of life charm with emerald green accents. Oxidized silver chain with rustic woodland finish.',
        productType: 'chain',
        price: '55.00',
        images: [
          'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400'
        ]
      },
      {
        productCode: 'BR009',
        name: 'Beach Vibes Anklet',
        description: 'Seashell and starfish charm cluster. Waterproof stainless steel chain.',
        productType: 'bracelet-anklet',
        price: '30.00',
        images: [
          'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400'
        ]
      },
      {
        productCode: 'BR010',
        name: 'Royal Crown Bracelet',
        description: 'Miniature crown charm with faux ruby centerpiece. Gold plated curb chain with royal styling.',
        productType: 'bracelet-anklet',
        price: '52.00',
        images: [
          'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400'
        ]
      },
      {
        productCode: 'CH007',
        name: 'Lightning Bolt Chain',
        description: 'Electric lightning bolt charm with blue sapphire accent. Stainless steel chain with high-tech finish.',
        productType: 'chain',
        price: '41.00',
        images: [
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400'
        ]
      },
      {
        productCode: 'BR011',
        name: 'Zen Garden Anklet',
        description: 'Peaceful lotus flower charm with jade accent. Minimalist silver chain with zen-inspired design.',
        productType: 'bracelet-anklet',
        price: '34.00',
        images: [
          'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400'
        ]
      },
      {
        productCode: 'BR012',
        name: 'Fairy Tale Bracelet',
        description: 'Magical fairy charm with glittering wings. Delicate silver chain with fairy dust finish.',
        productType: 'bracelet-anklet',
        price: '37.00',
        images: [
          'https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=400'
        ]
      },
      {
        productCode: 'CH008',
        name: 'Phoenix Rising Chain',
        description: 'Majestic phoenix charm symbolizing rebirth and strength. Fire-resistant titanium chain with flame pattern.',
        productType: 'chain',
        price: '68.00',
        images: [
          'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400'
        ]
      }
    ];

    const insertedProducts = await db.insert(products).values(sampleProducts).returning();

    // 6. Create sample orders
    console.log('🛒 Creating sample orders...');

    // Get admin user for order creation
    const [adminUser] = await db.select().from(admins).limit(1);
    if (!adminUser) {
      throw new Error('Admin user not found for order creation');
    }

    // Create sample orders
    const sampleOrders = [
      {
        orderNumber: 'ORD-00000001',
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah.johnson@email.com',
        customerPhone: '+91-9876543210',
        customerAddress: '123 Fashion Street, Mumbai, Maharashtra 400001',
        totalAmount: '50.00',
        status: 'pending' as const,
        whatsappMessageSent: false,
        paymentReceived: false,
        notes: 'First time customer, handle with care',
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-15T10:30:00Z')
      },
      {
        orderNumber: 'ORD-00000002',
        customerName: 'Michael Chen',
        customerEmail: 'michael.chen@email.com',
        customerPhone: '+91-9876543211',
        customerAddress: '456 Luxury Avenue, Delhi, Delhi 110001',
        totalAmount: '75.00',
        status: 'processing' as const,
        whatsappMessageSent: true,
        paymentReceived: true,
        notes: 'Express delivery requested',
        createdAt: new Date('2024-01-14T15:45:00Z'),
        updatedAt: new Date('2024-01-15T09:20:00Z')
      },
      {
        orderNumber: 'ORD-00000003',
        customerName: 'Emily Davis',
        customerEmail: 'emily.davis@email.com',
        customerPhone: '+91-9876543212',
        customerAddress: '789 Garden Road, Bangalore, Karnataka 560001',
        totalAmount: '32.00',
        status: 'shipped' as const,
        whatsappMessageSent: true,
        paymentReceived: true,
        notes: 'Gift wrapping requested',
        createdAt: new Date('2024-01-13T14:20:00Z'),
        updatedAt: new Date('2024-01-14T11:30:00Z')
      },
      {
        orderNumber: 'ORD-00000004',
        customerName: 'Robert Wilson',
        customerEmail: 'robert.wilson@email.com',
        customerPhone: '+91-9876543213',
        customerAddress: '321 Business District, Pune, Maharashtra 411001',
        totalAmount: '68.00',
        status: 'delivered' as const,
        whatsappMessageSent: true,
        paymentReceived: true,
        notes: 'Customer very satisfied with product quality',
        createdAt: new Date('2024-01-12T09:15:00Z'),
        updatedAt: new Date('2024-01-13T16:45:00Z')
      },
      {
        orderNumber: 'ORD-00000005',
        customerName: 'Lisa Brown',
        customerEmail: 'lisa.brown@email.com',
        customerPhone: '+91-9876543214',
        customerAddress: '654 Heritage Colony, Chennai, Tamil Nadu 600001',
        totalAmount: '45.00',
        status: 'pending' as const,
        whatsappMessageSent: false,
        paymentReceived: false,
        notes: 'Need to confirm address details',
        createdAt: new Date('2024-01-11T13:00:00Z'),
        updatedAt: new Date('2024-01-11T13:00:00Z')
      },
      {
        orderNumber: 'ORD-00000006',
        customerName: 'David Kumar',
        customerEmail: 'david.kumar@email.com',
        customerPhone: '+91-9876543215',
        customerAddress: '987 Tech Park, Hyderabad, Telangana 500001',
        totalAmount: '42.00',
        status: 'confirmed' as const,
        whatsappMessageSent: true,
        paymentReceived: false,
        notes: 'Waiting for payment confirmation',
        createdAt: new Date('2024-01-10T16:30:00Z'),
        updatedAt: new Date('2024-01-11T10:15:00Z')
      },
      {
        orderNumber: 'ORD-00000007',
        customerName: 'Priya Sharma',
        customerEmail: 'priya.sharma@email.com',
        customerPhone: '+91-9876543216',
        customerAddress: '147 Royal Street, Jaipur, Rajasthan 302001',
        totalAmount: '58.00',
        status: 'processing' as const,
        whatsappMessageSent: true,
        paymentReceived: true,
        notes: 'Rush order for wedding ceremony',
        createdAt: new Date('2024-01-09T11:45:00Z'),
        updatedAt: new Date('2024-01-10T14:20:00Z')
      },
      {
        orderNumber: 'ORD-00000008',
        customerName: 'Alex Thompson',
        customerEmail: 'alex.thompson@email.com',
        customerPhone: '+91-9876543217',
        customerAddress: '258 International City, Gurgaon, Haryana 122001',
        totalAmount: '37.00',
        status: 'shipped' as const,
        whatsappMessageSent: true,
        paymentReceived: true,
        notes: 'International shipping to UAE',
        createdAt: new Date('2024-01-08T08:30:00Z'),
        updatedAt: new Date('2024-01-09T12:00:00Z')
      },
      {
        orderNumber: 'ORD-00000009',
        customerName: 'Ananya Gupta',
        customerEmail: 'ananya.gupta@email.com',
        customerPhone: '+91-9876543218',
        customerAddress: '369 Cultural Center, Kolkata, West Bengal 700001',
        totalAmount: '52.00',
        status: 'delivered' as const,
        whatsappMessageSent: true,
        paymentReceived: true,
        notes: 'Repeat customer, premium service provided',
        createdAt: new Date('2024-01-07T12:20:00Z'),
        updatedAt: new Date('2024-01-08T15:30:00Z')
      },
      {
        orderNumber: 'ORD-00000010',
        customerName: 'James Miller',
        customerEmail: 'james.miller@email.com',
        customerPhone: '+91-9876543219',
        customerAddress: '741 Coastal Road, Kochi, Kerala 682001',
        totalAmount: '41.00',
        status: 'cancelled' as const,
        whatsappMessageSent: true,
        paymentReceived: false,
        notes: 'Customer requested cancellation due to size issues',
        createdAt: new Date('2024-01-06T14:10:00Z'),
        updatedAt: new Date('2024-01-07T09:45:00Z')
      }
    ];

    const insertedOrders = await db.insert(orders).values(sampleOrders).returning();

    // Create order items for each order
    console.log('📦 Creating order items...');
    const orderItemsData = [];

    for (let i = 0; i < insertedOrders.length; i++) {
      const order = insertedOrders[i];
      if (!order) continue;

      // Use 1-2 products per order
      const productsForOrder = insertedProducts.slice(i % 3, (i % 3) + 2);

      for (const product of productsForOrder) {
        const unitPrice = parseFloat(product.price);
        const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 items

        orderItemsData.push({
          orderId: order.id,
          productId: product.id,
          quantity,
          unitPrice: unitPrice.toString(),
          productSnapshot: {
            product: {
              id: product.id,
              productCode: product.productCode,
              name: product.name,
              description: product.description,
              productType: product.productType,
              price: product.price,
              images: product.images
            }
          }
        });
      }
    }

    await db.insert(orderItems).values(orderItemsData);

    // 8. Create default expense categories
    console.log('💰 Creating expense categories...');
    await db.insert(expenseCategories).values([
      {
        name: 'Raw Materials',
        description: 'Gold, silver, gemstones, and other raw materials for jewelry making'
      },
      {
        name: 'Equipment & Tools',
        description: 'Jewelry making tools, equipment, and machinery'
      },
      {
        name: 'Marketing & Advertising',
        description: 'Social media ads, photography, promotional materials'
      },
      {
        name: 'Packaging & Shipping',
        description: 'Jewelry boxes, shipping materials, courier charges'
      },
      {
        name: 'Rent & Utilities',
        description: 'Store rent, electricity, internet, and utility bills'
      },
      {
        name: 'Professional Services',
        description: 'Accounting, legal, design, and consultation fees'
      },
      {
        name: 'Miscellaneous',
        description: 'Other business-related expenses'
      }
    ]);

    // 9. Create sample expenses
    console.log('📋 Creating sample expenses...');

    // Get expense categories for reference
    const expenseCategoriesData = await db.select().from(expenseCategories);
    const categoriesMap = expenseCategoriesData.reduce((acc, cat) => {
      acc[cat.name] = cat.id;
      return acc;
    }, {} as Record<string, string>);

    // Validate that all required categories exist
    const requiredCategories = [
      'Raw Materials',
      'Equipment & Tools',
      'Marketing & Advertising',
      'Packaging & Shipping',
      'Rent & Utilities',
      'Professional Services',
      'Miscellaneous'
    ];

    for (const categoryName of requiredCategories) {
      if (!categoriesMap[categoryName]) {
        throw new Error(`Required expense category '${categoryName}' not found`);
      }
    }

    const sampleExpenses = [
      {
        title: 'Gold Wire - 14K (100g)',
        description: 'High-quality 14K gold wire for chain making and jewelry construction',
        amount: '15000.00',
        categoryId: categoriesMap['Raw Materials']!,
        expenseDate: new Date('2024-01-15'),
        tags: ['gold', 'wire', 'chain-making'],
        addedBy: adminUser.id
      },
      {
        title: 'Silver Sheet - Sterling (200g)',
        description: 'Premium sterling silver sheet for charm and pendant creation',
        amount: '8500.00',
        categoryId: categoriesMap['Raw Materials']!,
        expenseDate: new Date('2024-01-14'),
        tags: ['silver', 'sheet', 'charms'],
        addedBy: adminUser.id
      },
      {
        title: 'Precision Jewelry Saw',
        description: 'High-quality jewelry saw for detailed cutting work',
        amount: '3200.00',
        categoryId: categoriesMap['Equipment & Tools']!,
        expenseDate: new Date('2024-01-13'),
        tags: ['tools', 'saw', 'cutting'],
        addedBy: adminUser.id
      },
      {
        title: 'Instagram Advertising Campaign',
        description: 'Sponsored posts showcasing Valentine\'s Day jewelry collection',
        amount: '5000.00',
        categoryId: categoriesMap['Marketing & Advertising']!,
        expenseDate: new Date('2024-01-12'),
        tags: ['instagram', 'advertising', 'valentines'],
        addedBy: adminUser.id
      },
      {
        title: 'Luxury Jewelry Boxes (50 units)',
        description: 'Premium gift boxes with velvet lining for high-end jewelry pieces',
        amount: '2800.00',
        categoryId: categoriesMap['Packaging & Shipping']!,
        expenseDate: new Date('2024-01-11'),
        tags: ['packaging', 'boxes', 'luxury'],
        addedBy: adminUser.id
      },
      {
        title: 'Store Rent - January',
        description: 'Monthly rent for jewelry store location in premium shopping district',
        amount: '25000.00',
        categoryId: categoriesMap['Rent & Utilities']!,
        expenseDate: new Date('2024-01-10'),
        tags: ['rent', 'monthly', 'store'],
        addedBy: adminUser.id
      },
      {
        title: 'Gemstone Selection - Mixed',
        description: 'Assorted gemstones including cubic zirconia, crystals, and semi-precious stones',
        amount: '12000.00',
        categoryId: categoriesMap['Raw Materials']!,
        expenseDate: new Date('2024-01-09'),
        tags: ['gemstones', 'crystals', 'mixed'],
        addedBy: adminUser.id
      },
      {
        title: 'Professional Photography Session',
        description: 'Product photography for website and social media marketing',
        amount: '4500.00',
        categoryId: categoriesMap['Professional Services']!,
        expenseDate: new Date('2024-01-08'),
        tags: ['photography', 'marketing', 'products'],
        addedBy: adminUser.id
      },
      {
        title: 'Polishing Compound Set',
        description: 'Professional polishing compounds for gold, silver, and mixed metals',
        amount: '1800.00',
        categoryId: categoriesMap['Equipment & Tools']!,
        expenseDate: new Date('2024-01-07'),
        tags: ['polishing', 'compound', 'finishing'],
        addedBy: adminUser.id
      },
      {
        title: 'Shipping Materials Bulk Order',
        description: 'Bubble wrap, shipping boxes, and protective padding for online orders',
        amount: '1200.00',
        categoryId: categoriesMap['Packaging & Shipping']!,
        expenseDate: new Date('2024-01-06'),
        tags: ['shipping', 'protection', 'bulk'],
        addedBy: adminUser.id
      },
      {
        title: 'Facebook & Google Ads',
        description: 'Digital marketing campaign targeting engagement ring shoppers',
        amount: '3500.00',
        categoryId: categoriesMap['Marketing & Advertising']!,
        expenseDate: new Date('2024-01-05'),
        tags: ['facebook', 'google', 'digital-marketing'],
        addedBy: adminUser.id
      },
      {
        title: 'Electricity Bill - December',
        description: 'Monthly electricity bill for store and workshop operations',
        amount: '1800.00',
        categoryId: categoriesMap['Rent & Utilities']!,
        expenseDate: new Date('2024-01-04'),
        tags: ['electricity', 'utilities', 'monthly'],
        addedBy: adminUser.id
      },
      {
        title: 'Jewelry Design Software License',
        description: 'Annual license for 3D jewelry design and modeling software',
        amount: '8000.00',
        categoryId: categoriesMap['Professional Services']!,
        expenseDate: new Date('2024-01-03'),
        tags: ['software', 'design', 'license'],
        addedBy: adminUser.id
      },
      {
        title: 'Rose Gold Plating Solution',
        description: 'Professional-grade rose gold plating solution for finishing',
        amount: '2200.00',
        categoryId: categoriesMap['Raw Materials']!,
        expenseDate: new Date('2024-01-02'),
        tags: ['rose-gold', 'plating', 'finishing'],
        addedBy: adminUser.id
      },
      {
        title: 'Office Supplies & Stationery',
        description: 'General office supplies, invoice books, and business stationery',
        amount: '800.00',
        categoryId: categoriesMap['Miscellaneous']!,
        expenseDate: new Date('2024-01-01'),
        tags: ['office', 'supplies', 'stationery'],
        addedBy: adminUser.id
      }
    ];

    await db.insert(expenses).values(sampleExpenses);

    console.log('✅ Database seeding completed successfully!');
    console.log(`
📊 Summary:
- ✅ Admin user created (admin@jewelrystore.com / admin123!@#)
- ✅ 3 color themes configured
- ✅ Product code sequences initialized (chain, bracelet-anklet)
- ✅ ${sampleProducts.length} sample products with auto-generated codes
- ✅ ${sampleOrders.length} sample orders with items
- ✅ 7 expense categories created
- ✅ ${sampleExpenses.length} sample expenses
    `);

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

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
