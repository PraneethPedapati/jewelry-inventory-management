import { db } from './connection';
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
} from './schema';
import { hash } from 'argon2';
import { sql } from 'drizzle-orm';

/**
 * Clear all existing data from the database in the correct order
 * to respect foreign key constraints
 */
const clearDatabase = async (): Promise<void> => {
  console.log('🧹 Clearing existing database data...');

  // Delete in order of dependencies (child tables first)
  console.log('  - Clearing analytics history...');
  await db.execute(sql`DELETE FROM analytics_history`);

  console.log('  - Clearing analytics cache...');
  await db.execute(sql`DELETE FROM analytics_cache`);

  console.log('  - Clearing analytics metadata...');
  await db.execute(sql`DELETE FROM analytics_metadata`);

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

    const adminUsers = await db.insert(admins).values({
      email: 'admin@jewelrystore.com',
      passwordHash: adminPassword,
      name: 'Store Administrator',
      role: 'admin'
    }).returning();

    const adminUser = adminUsers[0];
    if (!adminUser) {
      throw new Error('Failed to create admin user');
    }

    // 2. Create monochromatic color theme
    console.log('🎨 Creating monochromatic color theme...');
    await db.insert(colorThemes).values([
      {
        name: 'default',
        displayName: 'Sophisticated Monochromatic Theme',
        isActive: true,
        isDefault: true,
        colors: {
          // Accent Colors (Primary Color for UI Elements)
          primary: '#6c3158',      // Buttons, icons, active states
          secondary: '#854b70',    // Secondary buttons
          accent: '#a0668a',       // Highlights, focus states
          ring: '#6c3158',         // Focus rings, active borders

          // Background Colors (Neutral Greys)
          background: '#FFFFFF',    // Main page background (pure white)
          card: '#f9fafb',         // Card backgrounds (light grey)
          muted: '#f3f4f6',        // Hover states, subtle backgrounds

          // Text Colors (Black/Grey for Readability)
          foreground: '#1F2937',   // Main text (dark grey)
          cardForeground: '#1F2937', // Card text (dark grey)
          mutedForeground: '#6B7280', // Secondary text (grey)

          // Form Elements
          border: '#e4d9e0',       // Borders (neutral grey)
          input: '#FFFFFF',         // Input backgrounds (white)

          // Status Colors
          destructive: '#EF4444',   // Error states (red)
          destructiveForeground: '#FFFFFF', // Error text (white)
          success: '#10B981',       // Success states (green)
          successForeground: '#FFFFFF', // Success text (white)
          warning: '#F59E0B',       // Warning states (amber)
          warningForeground: '#FFFFFF' // Warning text (white)
        },
        description: 'Sophisticated monochromatic theme for jewelry store - elegant deep magenta with tonal variations'
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

    // 4. Create comprehensive jewelry products (25 products)
    console.log('💎 Creating comprehensive jewelry products...');
    const sampleProducts = [
      // Chains (15 products)
      {
        productCode: 'CH001',
        name: 'Butterfly Dream Chain',
        description: 'Delicate butterfly charm with crystal accents and intricate wing details. Sterling silver curb chain with polished finish.',
        productType: 'chain',
        price: '45.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400']
      },
      {
        productCode: 'CH002',
        name: 'Starlight Elegance Chain',
        description: 'Star-shaped charm with sparkling cubic zirconia stones. White gold plated box chain with adjustable length.',
        productType: 'chain',
        price: '52.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400']
      },
      {
        productCode: 'CH003',
        name: 'Moonlight Serenity Chain',
        description: 'Crescent moon charm with pearl accents. Rose gold plated cable chain with secure lobster clasp.',
        productType: 'chain',
        price: '38.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400']
      },
      {
        productCode: 'CH004',
        name: 'Golden Rose Chain',
        description: 'Rose flower charm with golden finish. 18K gold plated curb chain with elegant design.',
        productType: 'chain',
        price: '65.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400']
      },
      {
        productCode: 'CH005',
        name: 'Ocean Wave Chain',
        description: 'Wave pattern charm with turquoise stone. Sterling silver snake chain with ocean theme.',
        productType: 'chain',
        price: '42.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400']
      },
      {
        productCode: 'CH006',
        name: 'Diamond Sparkle Chain',
        description: 'Diamond-cut charm with brilliant sparkle. White gold plated box chain with premium finish.',
        productType: 'chain',
        price: '78.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400']
      },
      {
        productCode: 'CH007',
        name: 'Vintage Locket Chain',
        description: 'Antique-style locket with intricate engravings. Brass chain with vintage patina finish.',
        productType: 'chain',
        price: '55.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400']
      },
      {
        productCode: 'CH008',
        name: 'Angel Wing Chain',
        description: 'Angel wing charm with feather details. Sterling silver curb chain with spiritual design.',
        productType: 'chain',
        price: '48.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400']
      },
      {
        productCode: 'CH009',
        name: 'Infinity Love Chain',
        description: 'Infinity symbol charm with love theme. Rose gold plated cable chain with romantic design.',
        productType: 'chain',
        price: '35.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400']
      },
      {
        productCode: 'CH010',
        name: 'Tree of Life Chain',
        description: 'Tree of life charm with detailed branches. Sterling silver box chain with nature theme.',
        productType: 'chain',
        price: '58.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400']
      },
      {
        productCode: 'CH011',
        name: 'Crystal Butterfly Chain',
        description: 'Crystal butterfly charm with rainbow colors. Sterling silver snake chain with colorful design.',
        productType: 'chain',
        price: '32.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400']
      },
      {
        productCode: 'CH012',
        name: 'Lotus Flower Chain',
        description: 'Lotus flower charm with spiritual meaning. White gold plated curb chain with elegant design.',
        productType: 'chain',
        price: '45.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400']
      },
      {
        productCode: 'CH013',
        name: 'Celestial Star Chain',
        description: 'Star cluster charm with cosmic theme. Sterling silver cable chain with celestial design.',
        productType: 'chain',
        price: '52.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400']
      },
      {
        productCode: 'CH014',
        name: 'Dragon Scale Chain',
        description: 'Dragon scale pattern charm with mystical theme. Brass chain with antique finish.',
        productType: 'chain',
        price: '68.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400']
      },
      {
        productCode: 'CH015',
        name: 'Phoenix Rising Chain',
        description: 'Phoenix bird charm with rebirth symbolism. Rose gold plated box chain with majestic design.',
        productType: 'chain',
        price: '75.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400']
      },
      // Bracelets & Anklets (10 products)
      {
        productCode: 'BR001',
        name: 'Heart Lock Bracelet',
        description: 'Heart-shaped lock charm with key detail and engraved initials. Rose gold plated cable chain with secure clasp.',
        productType: 'bracelet-anklet',
        price: '35.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=400']
      },
      {
        productCode: 'BR002',
        name: 'Ocean Pearl Anklet',
        description: 'Natural pearl charm with ocean wave design. Sterling silver snake chain with extension.',
        productType: 'bracelet-anklet',
        price: '28.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400']
      },
      {
        productCode: 'BR003',
        name: 'Vintage Rose Bracelet',
        description: 'Antique rose charm with detailed petals and leaves. Vintage-style brass chain with patina finish.',
        productType: 'bracelet-anklet',
        price: '42.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400']
      },
      {
        productCode: 'BR004',
        name: 'Crystal Beaded Anklet',
        description: 'Crystal beads with silver spacers. Adjustable elastic band with elegant design.',
        productType: 'bracelet-anklet',
        price: '25.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=400']
      },
      {
        productCode: 'BR005',
        name: 'Leather Wrap Bracelet',
        description: 'Genuine leather wrap with silver charm. Adjustable design with rustic appeal.',
        productType: 'bracelet-anklet',
        price: '38.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400']
      },
      {
        productCode: 'BR006',
        name: 'Charm Stack Anklet',
        description: 'Multiple charms on sterling silver chain. Includes heart, star, and flower charms.',
        productType: 'bracelet-anklet',
        price: '45.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400']
      },
      {
        productCode: 'BR007',
        name: 'Boho Feather Anklet',
        description: 'Feather charm with tribal design. Sterling silver chain with bohemian style.',
        productType: 'bracelet-anklet',
        price: '32.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=400']
      },
      {
        productCode: 'BR008',
        name: 'Infinity Link Bracelet',
        description: 'Infinity links with rose gold finish. Elegant design with secure clasp.',
        productType: 'bracelet-anklet',
        price: '55.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400']
      },
      {
        productCode: 'BR009',
        name: 'Crystal Tennis Anklet',
        description: 'Crystal stones set in sterling silver. Tennis bracelet style for ankle.',
        productType: 'bracelet-anklet',
        price: '68.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400']
      },
      {
        productCode: 'BR010',
        name: 'Lotus Mandala Anklet',
        description: 'Lotus mandala charm with spiritual symbols. Sterling silver chain with meditation theme.',
        productType: 'bracelet-anklet',
        price: '48.00',
        isActive: true,
        images: ['https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=400']
      }
    ];

    const insertedProducts = await db.insert(products).values(sampleProducts).returning();

    // 5. Create comprehensive orders (30 orders)
    console.log('🛒 Creating comprehensive orders...');
    const customerNames = [
      'Sarah Johnson', 'Michael Chen', 'Emily Davis', 'Robert Wilson', 'Lisa Brown',
      'David Miller', 'Jennifer Garcia', 'Christopher Lee', 'Amanda Taylor', 'James Anderson',
      'Maria Rodriguez', 'Daniel Martinez', 'Jessica Thompson', 'Kevin White', 'Ashley Clark',
      'Matthew Lewis', 'Nicole Hall', 'Andrew Young', 'Stephanie King', 'Ryan Scott',
      'Rachel Green', 'Brandon Adams', 'Lauren Baker', 'Tyler Nelson', 'Megan Carter',
      'Jordan Mitchell', 'Hannah Perez', 'Austin Roberts', 'Kayla Turner', 'Zachary Phillips'
    ];

    const customerEmails = customerNames.map(name =>
      `${name.toLowerCase().replace(' ', '.')}@email.com`
    );

    const customerPhones = Array.from({ length: 30 }, (_, i) =>
      `+91-9876543${String(i + 210).padStart(3, '0')}`
    );

    const addresses = [
      '123 Fashion Street, Mumbai, Maharashtra 400001',
      '456 Luxury Avenue, Delhi, Delhi 110001',
      '789 Garden Road, Bangalore, Karnataka 560001',
      '321 Business District, Pune, Maharashtra 411001',
      '654 Heritage Colony, Chennai, Tamil Nadu 600001',
      '987 Tech Park, Hyderabad, Telangana 500001',
      '147 Cultural Lane, Kolkata, West Bengal 700001',
      '258 Royal Plaza, Jaipur, Rajasthan 302001',
      '369 Modern Complex, Ahmedabad, Gujarat 380001',
      '741 Smart City, Noida, Uttar Pradesh 201301',
      '852 Innovation Hub, Gurgaon, Haryana 122001',
      '963 Heritage Street, Varanasi, Uttar Pradesh 221001',
      '159 Coastal Road, Kochi, Kerala 682001',
      '357 Hill Station, Shimla, Himachal Pradesh 171001',
      '468 Desert View, Jodhpur, Rajasthan 342001',
      '579 Lake Side, Udaipur, Rajasthan 313001',
      '681 Mountain View, Manali, Himachal Pradesh 175131',
      '792 Beach Road, Goa, Goa 403001',
      '813 Valley Street, Srinagar, Jammu & Kashmir 190001',
      '924 River Front, Varanasi, Uttar Pradesh 221001',
      '135 Temple Street, Vrindavan, Uttar Pradesh 281121',
      '246 Palace Road, Mysore, Karnataka 570001',
      '357 Fort Area, Agra, Uttar Pradesh 282001',
      '468 Museum Lane, Kolkata, West Bengal 700016',
      '579 University Road, Chandigarh, Chandigarh 160014',
      '681 Airport Road, Indore, Madhya Pradesh 452001',
      '792 Mall Street, Lucknow, Uttar Pradesh 226001',
      '813 Park Avenue, Bhopal, Madhya Pradesh 462001',
      '924 Garden Colony, Patna, Bihar 800001'
    ];

    const orderStatuses = ['payment_pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
    const statusWeights = [3, 2, 2, 3, 15, 1]; // More delivered orders for realistic data

    const sampleOrders = Array.from({ length: 30 }, (_, i) => {
      const statusIndex = Math.floor(Math.random() * orderStatuses.length);
      const status = orderStatuses[statusIndex];
      const totalAmount = (Math.random() * 100 + 20).toFixed(2); // 20-120 range

      return {
        orderNumber: `ORD-${String(i + 1).padStart(8, '0')}`,
        orderCode: `ORD${String(i + 1).padStart(3, '0')}`,
        customerName: customerNames[i],
        customerEmail: customerEmails[i],
        customerPhone: customerPhones[i],
        customerAddress: addresses[i % addresses.length],
        totalAmount,
        status,
        whatsappMessageSent: status !== 'payment_pending',
        paymentReceived: status !== 'payment_pending' && status !== 'cancelled',
        notes: `Order ${i + 1} - ${status === 'delivered' ? 'Customer satisfied' : 'Processing normally'}`
      };
    });

    // Fix: Ensure all required fields are non-undefined for type safety
    const sanitizedOrders = sampleOrders.map(order => ({
      ...order,
      customerName: order.customerName ?? '',
      customerEmail: order.customerEmail ?? '',
      customerPhone: order.customerPhone ?? '',
      customerAddress: order.customerAddress ?? '',
    }));

    // Fix: Ensure all required fields are non-undefined and status is never undefined
    const sanitizedOrdersWithStatus = sanitizedOrders.map(order => ({
      ...order,
      status: order.status ?? 'payment_pending', // fallback to a valid status if undefined
    }));

    const insertedOrders = await db.insert(orders).values(sanitizedOrdersWithStatus).returning();

    // 6. Create order status history for each order
    console.log('📋 Creating order status history...');
    const statusHistoryData: any[] = [];

    for (const order of insertedOrders) {
      if (!order) continue;

      // Create initial status history entry
      statusHistoryData.push({
        orderId: order.id,
        oldStatus: null,
        newStatus: order.status,
        changedBy: adminUser.id,
        notes: 'Order created'
      });

      // Add status transitions based on current status
      if (order.status === 'confirmed' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') {
        statusHistoryData.push({
          orderId: order.id,
          oldStatus: 'payment_pending',
          newStatus: 'confirmed',
          changedBy: adminUser.id,
          notes: 'Payment confirmed'
        });
      }

      if (order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') {
        statusHistoryData.push({
          orderId: order.id,
          oldStatus: 'confirmed',
          newStatus: 'processing',
          changedBy: adminUser.id,
          notes: 'Order processing started'
        });
      }

      if (order.status === 'shipped' || order.status === 'delivered') {
        statusHistoryData.push({
          orderId: order.id,
          oldStatus: 'processing',
          newStatus: 'shipped',
          changedBy: adminUser.id,
          notes: 'Order shipped to customer'
        });
      }

      if (order.status === 'delivered') {
        statusHistoryData.push({
          orderId: order.id,
          oldStatus: 'shipped',
          newStatus: 'delivered',
          changedBy: adminUser.id,
          notes: 'Order delivered successfully'
        });
      }
    }

    await db.insert(orderStatusHistory).values(statusHistoryData);

    // 7. Create order items for each order
    console.log('📦 Creating order items...');
    const orderItemsData = [];

    for (let i = 0; i < insertedOrders.length; i++) {
      const order = insertedOrders[i];
      if (!order) continue;

      // Randomly select 1-3 products per order
      const numProducts = Math.floor(Math.random() * 3) + 1;
      const selectedProducts: typeof insertedProducts = [];

      for (let j = 0; j < numProducts; j++) {
        const randomProduct = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
        if (randomProduct && !selectedProducts.find((p) => p.id === randomProduct.id)) {
          selectedProducts.push(randomProduct);
        }
      }

      for (const product of selectedProducts) {
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

    // 8. Create comprehensive expense categories
    console.log('💰 Creating expense categories...');
    await db.insert(expenseCategories).values([
      {
        name: 'Raw Materials',
        description: 'Gold, silver, gemstones, and other raw materials for jewelry making',
        isActive: true
      },
      {
        name: 'Equipment & Tools',
        description: 'Jewelry making tools, equipment, and machinery',
        isActive: true
      },
      {
        name: 'Marketing & Advertising',
        description: 'Social media ads, photography, promotional materials',
        isActive: true
      },
      {
        name: 'Packaging & Shipping',
        description: 'Jewelry boxes, shipping materials, courier charges',
        isActive: true
      },
      {
        name: 'Rent & Utilities',
        description: 'Store rent, electricity, internet, and utility bills',
        isActive: true
      },
      {
        name: 'Professional Services',
        description: 'Accounting, legal, design, and consultation fees',
        isActive: true
      },
      {
        name: 'Employee Salaries',
        description: 'Wages and salaries for jewelry makers and staff',
        isActive: true
      },
      {
        name: 'Insurance & Security',
        description: 'Business insurance, security systems, and safety equipment',
        isActive: true
      },
      {
        name: 'Travel & Events',
        description: 'Trade shows, exhibitions, and business travel',
        isActive: true
      },
      {
        name: 'Miscellaneous',
        description: 'Other business-related expenses',
        isActive: true
      }
    ]);

    // 9. Create comprehensive expenses (35 expenses)
    console.log('📋 Creating comprehensive expenses...');

    // Get expense categories for reference
    const expenseCategoriesData = await db.select().from(expenseCategories);
    const categoriesMap = expenseCategoriesData.reduce((acc, cat) => {
      acc[cat.name] = cat.id;
      return acc;
    }, {} as Record<string, string>);

    const expenseData = [
      // Raw Materials (8 expenses)
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
        title: 'Cubic Zirconia Stones (50 pieces)',
        description: 'High-quality CZ stones for jewelry embellishments',
        amount: '3200.00',
        categoryId: categoriesMap['Raw Materials']!,
        expenseDate: new Date('2024-01-13'),
        tags: ['stones', 'cz', 'embellishments'],
        addedBy: adminUser.id
      },
      {
        title: 'Pearl Beads - Freshwater (100 pieces)',
        description: 'Natural freshwater pearl beads for anklet making',
        amount: '2800.00',
        categoryId: categoriesMap['Raw Materials']!,
        expenseDate: new Date('2024-01-12'),
        tags: ['pearls', 'beads', 'anklets'],
        addedBy: adminUser.id
      },
      {
        title: 'Brass Wire - Various Gauges',
        description: 'Assorted brass wire for vintage-style jewelry',
        amount: '1800.00',
        categoryId: categoriesMap['Raw Materials']!,
        expenseDate: new Date('2024-01-11'),
        tags: ['brass', 'wire', 'vintage'],
        addedBy: adminUser.id
      },
      {
        title: 'Rose Gold Plating Solution',
        description: 'Rose gold plating solution for chain finishing',
        amount: '4200.00',
        categoryId: categoriesMap['Raw Materials']!,
        expenseDate: new Date('2024-01-10'),
        tags: ['plating', 'rose-gold', 'finishing'],
        addedBy: adminUser.id
      },
      {
        title: 'Crystal Beads - Assorted Colors',
        description: 'Crystal beads in various colors for anklet designs',
        amount: '1500.00',
        categoryId: categoriesMap['Raw Materials']!,
        expenseDate: new Date('2024-01-09'),
        tags: ['crystals', 'beads', 'colors'],
        addedBy: adminUser.id
      },
      {
        title: 'Leather Cord - Genuine (50m)',
        description: 'Genuine leather cord for wrap bracelets',
        amount: '2200.00',
        categoryId: categoriesMap['Raw Materials']!,
        expenseDate: new Date('2024-01-08'),
        tags: ['leather', 'cord', 'bracelets'],
        addedBy: adminUser.id
      },
      // Equipment & Tools (6 expenses)
      {
        title: 'Precision Jewelry Saw',
        description: 'High-quality jewelry saw for detailed cutting work',
        amount: '3200.00',
        categoryId: categoriesMap['Equipment & Tools']!,
        expenseDate: new Date('2024-01-07'),
        tags: ['tools', 'saw', 'cutting'],
        addedBy: adminUser.id
      },
      {
        title: 'Jewelry Polishing Machine',
        description: 'Electric polishing machine for finishing jewelry pieces',
        amount: '8500.00',
        categoryId: categoriesMap['Equipment & Tools']!,
        expenseDate: new Date('2024-01-06'),
        tags: ['machine', 'polishing', 'finishing'],
        addedBy: adminUser.id
      },
      {
        title: 'Magnifying Lamp Set',
        description: 'LED magnifying lamp for detailed jewelry work',
        amount: '2800.00',
        categoryId: categoriesMap['Equipment & Tools']!,
        expenseDate: new Date('2024-01-05'),
        tags: ['lamp', 'magnifying', 'led'],
        addedBy: adminUser.id
      },
      {
        title: 'Jewelry Pliers Set',
        description: 'Complete set of jewelry making pliers',
        amount: '1800.00',
        categoryId: categoriesMap['Equipment & Tools']!,
        expenseDate: new Date('2024-01-04'),
        tags: ['pliers', 'tools', 'set'],
        addedBy: adminUser.id
      },
      {
        title: 'Soldering Station',
        description: 'Professional soldering station for metal work',
        amount: '6500.00',
        categoryId: categoriesMap['Equipment & Tools']!,
        expenseDate: new Date('2024-01-03'),
        tags: ['soldering', 'station', 'metal'],
        addedBy: adminUser.id
      },
      {
        title: 'Digital Caliper',
        description: 'Precision digital caliper for measurements',
        amount: '1200.00',
        categoryId: categoriesMap['Equipment & Tools']!,
        expenseDate: new Date('2024-01-02'),
        tags: ['caliper', 'digital', 'measurement'],
        addedBy: adminUser.id
      },
      // Marketing & Advertising (5 expenses)
      {
        title: 'Instagram Advertising Campaign',
        description: 'Sponsored posts showcasing Valentine\'s Day jewelry collection',
        amount: '5000.00',
        categoryId: categoriesMap['Marketing & Advertising']!,
        expenseDate: new Date('2024-01-01'),
        tags: ['instagram', 'advertising', 'valentines'],
        addedBy: adminUser.id
      },
      {
        title: 'Professional Photography Session',
        description: 'Product photography for new jewelry collection',
        amount: '3500.00',
        categoryId: categoriesMap['Marketing & Advertising']!,
        expenseDate: new Date('2023-12-30'),
        tags: ['photography', 'professional', 'products'],
        addedBy: adminUser.id
      },
      {
        title: 'Facebook Ads Campaign',
        description: 'Facebook advertising for holiday season',
        amount: '4200.00',
        categoryId: categoriesMap['Marketing & Advertising']!,
        expenseDate: new Date('2023-12-29'),
        tags: ['facebook', 'ads', 'holiday'],
        addedBy: adminUser.id
      },
      {
        title: 'Google Ads - Search Campaign',
        description: 'Google search ads for jewelry keywords',
        amount: '3800.00',
        categoryId: categoriesMap['Marketing & Advertising']!,
        expenseDate: new Date('2023-12-28'),
        tags: ['google', 'ads', 'search'],
        addedBy: adminUser.id
      },
      {
        title: 'Influencer Collaboration',
        description: 'Collaboration with fashion influencers',
        amount: '6000.00',
        categoryId: categoriesMap['Marketing & Advertising']!,
        expenseDate: new Date('2023-12-27'),
        tags: ['influencer', 'collaboration', 'fashion'],
        addedBy: adminUser.id
      },
      // Packaging & Shipping (4 expenses)
      {
        title: 'Luxury Jewelry Boxes (50 units)',
        description: 'Premium gift boxes with velvet lining for high-end jewelry pieces',
        amount: '2800.00',
        categoryId: categoriesMap['Packaging & Shipping']!,
        expenseDate: new Date('2023-12-26'),
        tags: ['packaging', 'boxes', 'luxury'],
        addedBy: adminUser.id
      },
      {
        title: 'Shipping Labels & Materials',
        description: 'Shipping labels, bubble wrap, and packaging materials',
        amount: '1200.00',
        categoryId: categoriesMap['Packaging & Shipping']!,
        expenseDate: new Date('2023-12-25'),
        tags: ['shipping', 'labels', 'materials'],
        addedBy: adminUser.id
      },
      {
        title: 'Courier Service - Monthly',
        description: 'Monthly courier service for order deliveries',
        amount: '2500.00',
        categoryId: categoriesMap['Packaging & Shipping']!,
        expenseDate: new Date('2023-12-24'),
        tags: ['courier', 'service', 'monthly'],
        addedBy: adminUser.id
      },
      {
        title: 'Gift Wrapping Supplies',
        description: 'Ribbons, tissue paper, and gift wrapping materials',
        amount: '800.00',
        categoryId: categoriesMap['Packaging & Shipping']!,
        expenseDate: new Date('2023-12-23'),
        tags: ['gift', 'wrapping', 'supplies'],
        addedBy: adminUser.id
      },
      // Rent & Utilities (3 expenses)
      {
        title: 'Store Rent - January',
        description: 'Monthly rent for jewelry store location',
        amount: '25000.00',
        categoryId: categoriesMap['Rent & Utilities']!,
        expenseDate: new Date('2024-01-01'),
        tags: ['rent', 'store', 'monthly'],
        addedBy: adminUser.id
      },
      {
        title: 'Electricity Bill - December',
        description: 'Monthly electricity bill for store and workshop',
        amount: '3500.00',
        categoryId: categoriesMap['Rent & Utilities']!,
        expenseDate: new Date('2023-12-31'),
        tags: ['electricity', 'bill', 'monthly'],
        addedBy: adminUser.id
      },
      {
        title: 'Internet & Phone - December',
        description: 'Internet and phone services for business',
        amount: '1800.00',
        categoryId: categoriesMap['Rent & Utilities']!,
        expenseDate: new Date('2023-12-30'),
        tags: ['internet', 'phone', 'services'],
        addedBy: adminUser.id
      },
      // Professional Services (3 expenses)
      {
        title: 'Accounting Services - Q4',
        description: 'Quarterly accounting and bookkeeping services',
        amount: '8000.00',
        categoryId: categoriesMap['Professional Services']!,
        expenseDate: new Date('2023-12-29'),
        tags: ['accounting', 'bookkeeping', 'quarterly'],
        addedBy: adminUser.id
      },
      {
        title: 'Legal Consultation',
        description: 'Legal consultation for business compliance',
        amount: '5000.00',
        categoryId: categoriesMap['Professional Services']!,
        expenseDate: new Date('2023-12-28'),
        tags: ['legal', 'consultation', 'compliance'],
        addedBy: adminUser.id
      },
      {
        title: 'Design Consultation',
        description: 'Professional design consultation for new collection',
        amount: '3500.00',
        categoryId: categoriesMap['Professional Services']!,
        expenseDate: new Date('2023-12-27'),
        tags: ['design', 'consultation', 'collection'],
        addedBy: adminUser.id
      },
      // Employee Salaries (3 expenses)
      {
        title: 'Jewelry Maker Salary - December',
        description: 'Monthly salary for skilled jewelry maker',
        amount: '18000.00',
        categoryId: categoriesMap['Employee Salaries']!,
        expenseDate: new Date('2023-12-31'),
        tags: ['salary', 'jewelry-maker', 'monthly'],
        addedBy: adminUser.id
      },
      {
        title: 'Sales Assistant Salary - December',
        description: 'Monthly salary for sales assistant',
        amount: '12000.00',
        categoryId: categoriesMap['Employee Salaries']!,
        expenseDate: new Date('2023-12-31'),
        tags: ['salary', 'sales-assistant', 'monthly'],
        addedBy: adminUser.id
      },
      {
        title: 'Part-time Helper Salary - December',
        description: 'Monthly salary for part-time helper',
        amount: '8000.00',
        categoryId: categoriesMap['Employee Salaries']!,
        expenseDate: new Date('2023-12-31'),
        tags: ['salary', 'part-time', 'helper'],
        addedBy: adminUser.id
      },
      // Insurance & Security (2 expenses)
      {
        title: 'Business Insurance - Annual',
        description: 'Annual business insurance premium',
        amount: '15000.00',
        categoryId: categoriesMap['Insurance & Security']!,
        expenseDate: new Date('2023-12-26'),
        tags: ['insurance', 'business', 'annual'],
        addedBy: adminUser.id
      },
      {
        title: 'Security System Installation',
        description: 'Security camera and alarm system installation',
        amount: '12000.00',
        categoryId: categoriesMap['Insurance & Security']!,
        expenseDate: new Date('2023-12-25'),
        tags: ['security', 'system', 'installation'],
        addedBy: adminUser.id
      },
      // Travel & Events (1 expense)
      {
        title: 'Jewelry Trade Show - Mumbai',
        description: 'Participation in Mumbai jewelry trade show',
        amount: '25000.00',
        categoryId: categoriesMap['Travel & Events']!,
        expenseDate: new Date('2023-12-20'),
        tags: ['trade-show', 'mumbai', 'participation'],
        addedBy: adminUser.id
      }
    ];

    await db.insert(expenses).values(expenseData);

    console.log('✅ Database seeding completed successfully!');
    console.log(`
📊 Summary:
- ✅ Admin user created (admin@jewelrystore.com / admin123!@#)
- ✅ 1 monochromatic color theme configured with brand palette
- ✅ Product code sequences initialized (chain, bracelet-anklet)
- ✅ ${sampleProducts.length} comprehensive products (15 chains + 10 bracelets/anklets)
- ✅ ${sampleOrders.length} realistic orders with varied statuses
- ✅ Order status history with proper transitions
- ✅ Order items with realistic product combinations
- ✅ 10 expense categories covering all business aspects
- ✅ ${expenseData.length} detailed expenses across all categories
- ✅ Rich data for analytics and dashboard testing
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
